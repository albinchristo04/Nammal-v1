import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { prisma } from "@nammal/db";
import { sendOtp, verifyOtp } from "../lib/otp.js";
import { AppError } from "../middleware/errorHandler.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";

const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  keyGenerator: (req) => req.body?.phone ?? req.ip ?? "unknown",
  message: { error: "Too many OTP requests. Try again in an hour." },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authRouter = Router();

const phoneSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, "Invalid Indian mobile number"),
});

const otpSchema = z.object({
  phone: z.string(),
  otp: z.string().length(6),
});

// POST /api/auth/send-otp
authRouter.post("/send-otp", otpLimiter, async (req, res, next) => {
  try {
    const { phone } = phoneSchema.parse(req.body);
    await sendOtp(phone);
    res.json({ message: "OTP sent" });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/verify-otp
authRouter.post("/verify-otp", async (req, res, next) => {
  try {
    const { phone, otp } = otpSchema.parse(req.body);
    const valid = await verifyOtp(phone, otp);
    if (!valid) throw new AppError(400, "Invalid or expired OTP");

    // Upsert user
    let user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      user = await prisma.user.create({ data: { phone, status: "PENDING" } });
    }

    const role = user.isAdmin ? "admin" : "user";
    const accessToken = jwt.sign(
      { sub: user.id, role },
      process.env.JWT_SECRET!,
      { expiresIn: "15m" }
    );
    const refreshToken = jwt.sign(
      { sub: user.id, role },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: "30d" }
    );

    // Fetch profile gender if it exists
    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
      select: { gender: true },
    });

    res
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000,
      })
      .json({
        accessToken,
        user: {
          id: user.id,
          phone: user.phone,
          status: user.status,
          gender: profile?.gender ?? null,
          isAdmin: user.isAdmin,
        },
      });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/refresh
authRouter.post("/refresh", async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) throw new AppError(401, "No refresh token");

    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as {
      sub: string;
      role: string;
    };

    const accessToken = jwt.sign(
      { sub: payload.sub, role: payload.role },
      process.env.JWT_SECRET!,
      { expiresIn: "15m" }
    );

    res.json({ accessToken });
  } catch {
    next(new AppError(401, "Invalid refresh token"));
  }
});

// POST /api/auth/logout
authRouter.post("/logout", (_req, res) => {
  res.clearCookie("refreshToken").json({ message: "Logged out" });
});

// PUT /api/auth/fcm-token — save device FCM token
authRouter.put("/fcm-token", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const { token } = req.body;
    if (!token || typeof token !== "string") throw new AppError(400, "token is required");
    await prisma.user.update({
      where: { id: req.userId! },
      data: { fcmToken: token },
    });
    res.json({ message: "FCM token saved" });
  } catch (err) {
    next(err);
  }
});
