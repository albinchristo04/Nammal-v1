import axios from "axios";

// In-memory OTP store (use Redis in production via Upstash)
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendOtp(phone: string): Promise<void> {
  const otp = generateOtp();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
  otpStore.set(phone, { otp, expiresAt });

  if (process.env.NODE_ENV === "development") {
    console.log(`[OTP] +91${phone} → ${otp}`);
    return;
  }

  // Fast2SMS integration
  const apiKey = process.env.FAST2SMS_API_KEY!;
  await axios.post(
    "https://www.fast2sms.com/dev/bulkV2",
    {
      route: "otp",
      variables_values: otp,
      numbers: phone,
    },
    {
      headers: {
        authorization: apiKey,
        "Content-Type": "application/json",
      },
    }
  );
}

export async function verifyOtp(phone: string, otp: string): Promise<boolean> {
  const record = otpStore.get(phone);
  if (!record) return false;
  if (Date.now() > record.expiresAt) {
    otpStore.delete(phone);
    return false;
  }
  if (record.otp !== otp) return false;
  otpStore.delete(phone);
  return true;
}
