import { Redis } from "@upstash/redis";
import axios from "axios";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const OTP_TTL = 600; // 10 minutes in seconds

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendOtp(phone: string): Promise<void> {
  const otp = generateOtp();

  // Store in Redis with 10-min expiry (overwrites previous OTP for same phone)
  await redis.set(`otp:${phone}`, otp, { ex: OTP_TTL });

  if (process.env.NODE_ENV !== "production") {
    console.log(`[OTP DEV] +91${phone} → ${otp}`);
    return;
  }

  // Fast2SMS OTP route
  const { data } = await axios.post(
    "https://www.fast2sms.com/dev/bulkV2",
    {
      route: "otp",
      variables_values: otp,
      numbers: phone,
      flash: 0,
    },
    {
      headers: {
        authorization: process.env.FAST2SMS_API_KEY!,
        "Content-Type": "application/json",
      },
    }
  );

  if (!data.return) {
    throw new Error(data.message?.[0] ?? "Failed to send OTP via Fast2SMS");
  }
}

export async function verifyOtp(phone: string, otp: string): Promise<boolean> {
  const stored = await redis.get<string>(`otp:${phone}`);
  if (!stored) return false;
  if (stored !== otp) return false;
  // Delete immediately — one-time use
  await redis.del(`otp:${phone}`);
  return true;
}
