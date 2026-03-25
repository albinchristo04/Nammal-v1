import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "./errorHandler.js";

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: "user" | "admin";
}

export function requireAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(new AppError(401, "Unauthorized"));
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      sub: string;
      role: "user" | "admin";
    };
    req.userId = payload.sub;
    req.userRole = payload.role;
    return next();
  } catch {
    return next(new AppError(401, "Invalid or expired token"));
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, (err) => {
    if (err) return next(err);
    if (req.userRole !== "admin") return next(new AppError(403, "Forbidden"));
    return next();
  });
}
