import { Router } from "express";
import { z } from "zod";
import { prisma } from "@nammal/db";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";
import { AppError } from "../middleware/errorHandler.js";
import multer from "multer";
import { uploadToCloudinary } from "../lib/cloudinary.js";

export const profileRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const profileSchema = z.object({
  fullName: z.string().min(2).max(100),
  dateOfBirth: z.string().datetime(),
  gender: z.enum(["MALE", "FEMALE"]),
  religion: z.string().min(1).max(50),
  community: z.string().max(50).optional(),
  district: z.string().min(1).max(50),
  education: z.string().min(1).max(100),
  occupation: z.string().min(1).max(100),
  incomeRange: z.string().max(50),
  heightCm: z.number().int().min(120).max(220),
  maritalStatus: z.enum(["NEVER_MARRIED", "DIVORCED", "WIDOWED"]),
  aboutMe: z.string().max(500).optional(),
  star: z.string().max(50).optional(),
  rasi: z.string().max(50).optional(),
  contactPreference: z.enum(["SELF", "FAMILY"]).default("SELF"),
});

// GET /api/profile/me
profileRouter.get("/me", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const profile = await prisma.profile.findUnique({
      where: { userId: req.userId! },
      include: { photos: true },
    });
    if (!profile) throw new AppError(404, "Profile not found");
    res.json(profile);
  } catch (err) {
    next(err);
  }
});

// POST /api/profile
profileRouter.post("/", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const data = profileSchema.parse(req.body);
    const existing = await prisma.profile.findUnique({ where: { userId: req.userId! } });
    if (existing) throw new AppError(409, "Profile already exists");

    const profile = await prisma.profile.create({
      data: { ...data, userId: req.userId!, dateOfBirth: new Date(data.dateOfBirth) },
    });
    res.status(201).json(profile);
  } catch (err) {
    next(err);
  }
});

// PUT /api/profile/me
profileRouter.put("/me", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const data = profileSchema.partial().parse(req.body);
    const profile = await prisma.profile.update({
      where: { userId: req.userId! },
      data: { ...data, dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined },
    });
    res.json(profile);
  } catch (err) {
    next(err);
  }
});

// POST /api/profile/me/photos
profileRouter.post(
  "/me/photos",
  requireAuth,
  upload.single("photo"),
  async (req: AuthRequest, res, next) => {
    try {
      if (!req.file) throw new AppError(400, "No file uploaded");
      const profile = await prisma.profile.findUnique({ where: { userId: req.userId! } });
      if (!profile) throw new AppError(404, "Profile not found");

      const photoCount = await prisma.profilePhoto.count({ where: { profileId: profile.id } });
      if (photoCount >= 5) throw new AppError(400, "Maximum 5 photos allowed");

      const url = await uploadToCloudinary(req.file.buffer, `nammal/profiles/${profile.id}`);
      const photo = await prisma.profilePhoto.create({
        data: { profileId: profile.id, url, isPrimary: photoCount === 0 },
      });

      // Photo changes trigger re-verification
      await prisma.user.update({ where: { id: req.userId! }, data: { status: "PENDING" } });

      res.status(201).json(photo);
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/profiles — browse verified profiles (opposite gender)
profileRouter.get("/", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    if (!user || user.status !== "VERIFIED") throw new AppError(403, "Profile not verified");

    const { page = "1", limit = "20", minAge, maxAge, district, religion } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const now = new Date();
    const where: Record<string, unknown> = {
      user: { status: "VERIFIED", gender: user.gender === "MALE" ? "FEMALE" : "MALE" },
      isDeactivated: false,
      isMatchFound: false,
    };

    if (minAge) {
      const maxDob = new Date(now);
      maxDob.setFullYear(maxDob.getFullYear() - parseInt(minAge as string));
      where.dateOfBirth = { ...((where.dateOfBirth as object) || {}), lte: maxDob };
    }
    if (maxAge) {
      const minDob = new Date(now);
      minDob.setFullYear(minDob.getFullYear() - parseInt(maxAge as string) - 1);
      where.dateOfBirth = { ...((where.dateOfBirth as object) || {}), gte: minDob };
    }
    if (district) where.district = district;
    if (religion) where.religion = religion;

    const [profiles, total] = await Promise.all([
      prisma.profile.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        include: { photos: { where: { isPrimary: true }, take: 1 } },
        orderBy: { user: { verifiedAt: "desc" } },
      }),
      prisma.profile.count({ where }),
    ]);

    res.json({ profiles, total, page: parseInt(page as string) });
  } catch (err) {
    next(err);
  }
});

// GET /api/profiles/:id — view single profile
profileRouter.get("/:id", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    if (!user || user.status !== "VERIFIED") throw new AppError(403, "Profile not verified");

    const profile = await prisma.profile.findUnique({
      where: { id: req.params.id },
      include: {
        photos: true,
        user: { select: { status: true, gender: true, lastActiveAt: true } },
      },
    });
    if (!profile || profile.user.status !== "VERIFIED") throw new AppError(404, "Profile not found");

    res.json(profile);
  } catch (err) {
    next(err);
  }
});
