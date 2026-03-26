import { Router } from "express";
import { prisma } from "@nammal/db";
import { requireAdmin, type AuthRequest } from "../middleware/auth.js";
import { AppError } from "../middleware/errorHandler.js";
import { sendPush } from "../lib/fcm.js";

export const adminRouter: ReturnType<typeof Router> = Router();
adminRouter.use(requireAdmin);

// GET /api/admin/queue — pending verification profiles
adminRouter.get("/queue", async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      where: { status: "PENDING" },
      include: { profile: { include: { photos: true } } },
      orderBy: { createdAt: "asc" },
    });
    res.json(users);
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/users/:id/approve
adminRouter.put("/users/:id/approve", async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { status: "VERIFIED", verifiedAt: new Date() },
    });
    await prisma.adminAction.create({
      data: { adminId: req.userId!, targetUserId: user.id, action: "APPROVED", reason: "Profile verified" },
    });
    if (user.fcmToken) {
      await sendPush(user.fcmToken, {
        title: "Profile approved!",
        body: "Your profile has been verified. You can now browse and send interests.",
        data: { url: "/browse", type: "profile_approved" },
      });
    }
    res.json({ message: "Profile approved" });
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/users/:id/reject
adminRouter.put("/users/:id/reject", async (req: AuthRequest, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason) throw new AppError(400, "Reason required");
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { status: "REJECTED" },
    });
    await prisma.adminAction.create({
      data: { adminId: req.userId!, targetUserId: user.id, action: "REJECTED", reason },
    });
    if (user.fcmToken) {
      await sendPush(user.fcmToken, {
        title: "Profile not approved",
        body: `Your profile was not approved: ${reason}. Please update your profile and resubmit.`,
        data: { url: "/pending", type: "profile_rejected" },
      });
    }
    res.json({ message: "Profile rejected" });
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/users/:id/suspend
adminRouter.put("/users/:id/suspend", async (req: AuthRequest, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason) throw new AppError(400, "Reason required");
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { status: "SUSPENDED" },
    });
    await prisma.adminAction.create({
      data: { adminId: req.userId!, targetUserId: user.id, action: "SUSPENDED", reason },
    });
    res.json({ message: "User suspended" });
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/users/:id/ban
adminRouter.put("/users/:id/ban", async (req: AuthRequest, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason) throw new AppError(400, "Reason required");
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { status: "DELETED" },
    });
    await prisma.adminAction.create({
      data: { adminId: req.userId!, targetUserId: user.id, action: "BANNED", reason },
    });
    res.json({ message: "User banned" });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/reports
adminRouter.get("/reports", async (_req, res, next) => {
  try {
    const reports = await prisma.report.findMany({
      where: { status: "PENDING" },
      include: {
        reporter: { include: { profile: true } },
        reported: { include: { profile: true } },
      },
      orderBy: { createdAt: "asc" },
    });
    res.json(reports);
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/reports/:id
adminRouter.put("/reports/:id", async (req: AuthRequest, res, next) => {
  try {
    const { action } = req.body; // "dismissed" | "actioned"
    await prisma.report.update({
      where: { id: req.params.id },
      data: { status: action === "actioned" ? "ACTIONED" : "DISMISSED" },
    });
    res.json({ message: "Report updated" });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/metrics
adminRouter.get("/metrics", async (_req, res, next) => {
  try {
    const [totalUsers, verifiedUsers, pendingUsers, pendingReports, totalChats] = await Promise.all([
      prisma.user.count({ where: { status: { not: "DELETED" } } }),
      prisma.user.count({ where: { status: "VERIFIED" } }),
      prisma.user.count({ where: { status: "PENDING" } }),
      prisma.report.count({ where: { status: "PENDING" } }),
      prisma.chat.count(),
    ]);
    res.json({ totalUsers, verifiedUsers, pendingUsers, pendingReports, totalChats });
  } catch (err) {
    next(err);
  }
});
