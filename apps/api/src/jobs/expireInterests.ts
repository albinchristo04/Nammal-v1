import { prisma } from "@nammal/db";

// Phase 1: simple in-process scheduler — no Redis/BullMQ needed.
// Runs every 5 minutes and expires any PENDING interests past their expiresAt.
export function startInterestExpiryScheduler() {
  const run = async () => {
    try {
      const { count } = await prisma.interest.updateMany({
        where: { status: "PENDING", expiresAt: { lt: new Date() } },
        data: { status: "EXPIRED" },
      });
      if (count > 0) console.log(`[jobs] Expired ${count} interest(s)`);
    } catch (err) {
      console.error("[jobs] Interest expiry error:", err);
    }
  };

  run(); // run once on startup to catch any missed expirations
  setInterval(run, 5 * 60 * 1000);
}

// No-op kept for call-site compatibility in interest.ts
export async function addToInterestExpiryQueue(_interestId: string, _expiresAt: Date) {
  // Expiry is handled by the scheduler; nothing to enqueue.
}
