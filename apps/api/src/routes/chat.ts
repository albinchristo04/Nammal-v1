import { Router } from "express";
import { prisma } from "@nammal/db";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";
import { AppError } from "../middleware/errorHandler.js";

export const chatRouter = Router();

// GET /api/chats — get all chat threads
chatRouter.get("/", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const chats = await prisma.chat.findMany({
      where: {
        OR: [{ userAId: req.userId! }, { userBId: req.userId! }],
        isBlocked: false,
      },
      include: {
        messages: { orderBy: { sentAt: "desc" }, take: 1 },
        userA: { include: { profile: { include: { photos: { where: { isPrimary: true } } } } } },
        userB: { include: { profile: { include: { photos: { where: { isPrimary: true } } } } } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(chats);
  } catch (err) {
    next(err);
  }
});

// GET /api/chats/:id/messages
chatRouter.get("/:id/messages", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const chat = await prisma.chat.findUnique({ where: { id: req.params.id } });
    if (!chat) throw new AppError(404, "Chat not found");
    if (chat.userAId !== req.userId! && chat.userBId !== req.userId!) {
      throw new AppError(403, "Forbidden");
    }

    const { cursor, limit = "30" } = req.query;
    const messages = await prisma.message.findMany({
      where: { chatId: chat.id },
      orderBy: { sentAt: "desc" },
      take: parseInt(limit as string),
      ...(cursor ? { cursor: { id: cursor as string }, skip: 1 } : {}),
    });

    res.json(messages.reverse());
  } catch (err) {
    next(err);
  }
});

// POST /api/chats/:id/block
chatRouter.post("/:id/block", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const chat = await prisma.chat.findUnique({ where: { id: req.params.id } });
    if (!chat) throw new AppError(404, "Chat not found");
    if (chat.userAId !== req.userId! && chat.userBId !== req.userId!) {
      throw new AppError(403, "Forbidden");
    }

    await prisma.chat.update({
      where: { id: chat.id },
      data: { isBlocked: true, blockedBy: req.userId! },
    });
    res.json({ message: "User blocked" });
  } catch (err) {
    next(err);
  }
});

// POST /api/chats/:id/report
chatRouter.post("/:id/report", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const chat = await prisma.chat.findUnique({ where: { id: req.params.id } });
    if (!chat) throw new AppError(404, "Chat not found");
    if (chat.userAId !== req.userId! && chat.userBId !== req.userId!) {
      throw new AppError(403, "Forbidden");
    }

    const reportedId = chat.userAId === req.userId! ? chat.userBId : chat.userAId;
    const { reason, details } = req.body;

    await prisma.report.create({
      data: { reporterId: req.userId!, reportedId, reason, details },
    });
    res.status(201).json({ message: "Report submitted" });
  } catch (err) {
    next(err);
  }
});
