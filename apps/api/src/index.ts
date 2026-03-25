import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import helmet from "helmet";
import { authRouter } from "./routes/auth.js";
import { profileRouter } from "./routes/profile.js";
import { interestRouter } from "./routes/interest.js";
import { chatRouter } from "./routes/chat.js";
import { adminRouter } from "./routes/admin.js";
import { registerSocketHandlers } from "./socket/index.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { startInterestExpiryScheduler } from "./jobs/expireInterests.js";

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.WEB_URL || "http://localhost:3000",
    credentials: true,
  },
});

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.WEB_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/auth", authRouter);
app.use("/api/profile", profileRouter);
app.use("/api/profiles", profileRouter);
app.use("/api/interests", interestRouter);
app.use("/api/chats", chatRouter);
app.use("/api/admin", adminRouter);

// Socket.io
registerSocketHandlers(io);

// Error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`[api] Server running on port ${PORT}`);
  startInterestExpiryScheduler();
});

export { io };
