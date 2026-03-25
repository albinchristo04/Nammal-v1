import type { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { prisma } from "@nammal/db";
import { sendPush } from "../lib/fcm.js";

// Track online users: userId → Set of socket IDs
const onlineUsers = new Map<string, Set<string>>();

export function registerSocketHandlers(io: Server) {
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

    // Track online presence
    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId)!.add(socket.id);

    socket.join(`user:${userId}`);

    socket.on("join-chat", async (chatId: string) => {
      const chat = await prisma.chat.findUnique({ where: { id: chatId } });
      if (!chat) return;
      if (chat.userAId !== userId && chat.userBId !== userId) return;
      if (chat.isBlocked) return;
      socket.join(`chat:${chatId}`);
    });

    socket.on("mark-read", async (chatId: string) => {
      const chat = await prisma.chat.findUnique({ where: { id: chatId } });
      if (!chat || (chat.userAId !== userId && chat.userBId !== userId)) return;
      await prisma.message.updateMany({
        where: { chatId, senderId: { not: userId }, isRead: false },
        data: { isRead: true },
      });
    });

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

      const recipientId = chat.userAId === userId ? chat.userBId : chat.userAId;

      // In-app notification
      io.to(`user:${recipientId}`).emit("notification", {
        type: "new-message",
        chatId,
        preview: content.slice(0, 50),
      });

      // FCM push only if recipient is offline
      const isOnline = (onlineUsers.get(recipientId)?.size ?? 0) > 0;
      if (!isOnline) {
        const recipient = await prisma.user.findUnique({
          where: { id: recipientId },
          select: { fcmToken: true },
        });
        if (recipient?.fcmToken) {
          const senderProfile = await prisma.profile.findUnique({
            where: { userId },
            select: { fullName: true },
          });
          await sendPush(recipient.fcmToken, {
            title: senderProfile?.fullName ?? "New message",
            body: content.slice(0, 100),
            data: { url: `/chat?id=${chatId}`, type: "new_message", chatId },
          });
        }
      }
    });

    socket.on("disconnect", () => {
      const sockets = onlineUsers.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) onlineUsers.delete(userId);
      }
    });
  });
}
