import { Router } from "express";
import { prisma } from "@nammal/db";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";
import { AppError } from "../middleware/errorHandler.js";
import { addToInterestExpiryQueue } from "../jobs/expireInterests.js";
import { sendPush } from "../lib/fcm.js";

export const interestRouter = Router();

const MAX_PENDING_INTERESTS = 10;
const COOLDOWN_DAYS = 30;
const EXPIRY_DAYS = 7;

// POST /api/interests — send interest
interestRouter.post("/", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const { receiverId } = req.body;
    if (!receiverId) throw new AppError(400, "receiverId is required");

    const [sender, receiver] = await Promise.all([
      prisma.user.findUnique({ where: { id: req.userId! } }),
      prisma.user.findUnique({ where: { id: receiverId } }),
    ]);

    if (!sender || sender.status !== "VERIFIED") throw new AppError(403, "Not verified");
    if (!receiver || receiver.status !== "VERIFIED") throw new AppError(404, "Profile not found");
    if (sender.gender === receiver.gender) throw new AppError(400, "Cannot send interest to same gender");

    // Check pending interest count
    const pendingCount = await prisma.interest.count({
      where: { senderId: req.userId!, status: "PENDING" },
    });
    if (pendingCount >= MAX_PENDING_INTERESTS) {
      throw new AppError(400, `Maximum ${MAX_PENDING_INTERESTS} pending interests allowed`);
    }

    // Check cooldown
    const cooldown = await prisma.interestCooldown.findUnique({
      where: { senderId_receiverId: { senderId: req.userId!, receiverId } },
    });
    if (cooldown && cooldown.cooldownUntil > new Date()) {
      throw new AppError(400, "You must wait 30 days before resending interest to this profile");
    }

    // Check existing pending interest
    const existing = await prisma.interest.findFirst({
      where: { senderId: req.userId!, receiverId, status: "PENDING" },
    });
    if (existing) throw new AppError(409, "Interest already sent");

    const expiresAt = new Date(Date.now() + EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    const interest = await prisma.interest.create({
      data: { senderId: req.userId!, receiverId, status: "PENDING", expiresAt },
    });

    // Queue auto-expiry job
    await addToInterestExpiryQueue(interest.id, expiresAt);

    // Push notification to receiver
    if (receiver.fcmToken) {
      await sendPush(receiver.fcmToken, {
        title: "New interest received",
        body: "Someone is interested in your profile. Check it out!",
        data: { url: "/interests", type: "interest_received" },
      });
    }

    res.status(201).json(interest);
  } catch (err) {
    next(err);
  }
});

// GET /api/interests/received
interestRouter.get("/received", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const interests = await prisma.interest.findMany({
      where: { receiverId: req.userId!, status: "PENDING" },
      include: { sender: { include: { profile: { include: { photos: { where: { isPrimary: true } } } } } } },
      orderBy: { sentAt: "desc" },
    });
    res.json(interests);
  } catch (err) {
    next(err);
  }
});

// GET /api/interests/sent
interestRouter.get("/sent", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const interests = await prisma.interest.findMany({
      where: { senderId: req.userId! },
      include: { receiver: { include: { profile: { include: { photos: { where: { isPrimary: true } } } } } } },
      orderBy: { sentAt: "desc" },
    });
    res.json(interests);
  } catch (err) {
    next(err);
  }
});

// PUT /api/interests/:id/accept
interestRouter.put("/:id/accept", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const interest = await prisma.interest.findUnique({ where: { id: req.params.id } });
    if (!interest || interest.receiverId !== req.userId!) throw new AppError(404, "Interest not found");
    if (interest.status !== "PENDING") throw new AppError(400, "Interest is no longer pending");

    const [updatedInterest] = await prisma.$transaction([
      prisma.interest.update({
        where: { id: interest.id },
        data: { status: "ACCEPTED", respondedAt: new Date() },
      }),
      prisma.chat.create({
        data: {
          interestId: interest.id,
          userAId: interest.senderId,
          userBId: interest.receiverId,
        },
      }),
    ]);

    // Push notification to original sender
    const sender = await prisma.user.findUnique({ where: { id: interest.senderId } });
    if (sender?.fcmToken) {
      await sendPush(sender.fcmToken, {
        title: "Interest accepted!",
        body: "Your interest was accepted. You can now chat.",
        data: { url: "/chat", type: "interest_accepted" },
      });
    }

    res.json(updatedInterest);
  } catch (err) {
    next(err);
  }
});

// PUT /api/interests/:id/decline
interestRouter.put("/:id/decline", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const interest = await prisma.interest.findUnique({ where: { id: req.params.id } });
    if (!interest || interest.receiverId !== req.userId!) throw new AppError(404, "Interest not found");
    if (interest.status !== "PENDING") throw new AppError(400, "Interest is no longer pending");

    const cooldownUntil = new Date(Date.now() + COOLDOWN_DAYS * 24 * 60 * 60 * 1000);
    await prisma.$transaction([
      prisma.interest.update({
        where: { id: interest.id },
        data: { status: "DECLINED", respondedAt: new Date() },
      }),
      prisma.interestCooldown.upsert({
        where: { senderId_receiverId: { senderId: interest.senderId, receiverId: interest.receiverId } },
        create: { senderId: interest.senderId, receiverId: interest.receiverId, cooldownUntil },
        update: { cooldownUntil },
      }),
    ]);

    res.json({ message: "Interest declined" });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/interests/:id — withdraw
interestRouter.delete("/:id", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const interest = await prisma.interest.findUnique({ where: { id: req.params.id } });
    if (!interest || interest.senderId !== req.userId!) throw new AppError(404, "Interest not found");
    if (interest.status !== "PENDING") throw new AppError(400, "Cannot withdraw a non-pending interest");

    await prisma.interest.update({ where: { id: interest.id }, data: { status: "WITHDRAWN" } });
    res.json({ message: "Interest withdrawn" });
  } catch (err) {
    next(err);
  }
});
