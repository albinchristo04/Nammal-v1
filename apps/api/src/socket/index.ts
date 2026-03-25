import type { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { prisma } from "@nammal/db";

export function registerSocketHandlers(io: Server) {
  // Auth middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Unauthorized"));
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as { sub: string };
      socket.data.userId = payload.sub;
      return next();
    } catch {
      return next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const userId: string = socket.data.userId;
    console.log(`[socket] User ${userId} connected`);

    // Join personal room for notifications
    socket.join(`user:${userId}`);

    // Join a chat room
    socket.on("join-chat", async (chatId: string) => {
      const chat = await prisma.chat.findUnique({ where: { id: chatId } });
      if (!chat) return;
      if (chat.userAId !== userId && chat.userBId !== userId) return;
      if (chat.isBlocked) return;
      socket.join(`chat:${chatId}`);
    });

    // Mark messages as read
    socket.on("mark-read", async (chatId: string) => {
      const chat = await prisma.chat.findUnique({ where: { id: chatId } });
      if (!chat || (chat.userAId !== userId && chat.userBId !== userId)) return;
      await prisma.message.updateMany({
        where: { chatId, senderId: { not: userId }, isRead: false },
        data: { isRead: true },
      });
    });

    // Send message
    socket.on("send-message", async (data: { chatId: string; content: string }) => {
      const { chatId, content } = data;
      if (!content?.trim()) return;

      const chat = await prisma.chat.findUnique({ where: { id: chatId } });
      if (!chat || chat.isBlocked) return;
      if (chat.userAId !== userId && chat.userBId !== userId) return;

      const message = await prisma.message.create({
        data: { chatId, senderId: userId, content: content.trim() },
      });

      io.to(`chat:${chatId}`).emit("new-message", message);

      // Notify offline user
      const recipientId = chat.userAId === userId ? chat.userBId : chat.userAId;
      io.to(`user:${recipientId}`).emit("notification", {
        type: "new-message",
        chatId,
        preview: content.slice(0, 50),
      });
    });

    socket.on("disconnect", () => {
      console.log(`[socket] User ${userId} disconnected`);
    });
  });
}
