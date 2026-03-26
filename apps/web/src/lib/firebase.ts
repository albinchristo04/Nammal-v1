import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, onMessage, type MessagePayload } from "firebase/messaging";
import {
  getAuth,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  type ConfirmationResult,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// ─── Phone Auth ──────────────────────────────────────────────────────────────

/**
 * Send OTP to the given 10-digit Indian phone number via Firebase Phone Auth.
 * Returns a ConfirmationResult that must be passed to confirmPhoneOtp().
 * containerId: id of an existing DOM element for the invisible reCAPTCHA widget.
 */
export async function sendPhoneOtp(
  phone: string,
  containerId: string,
  existingVerifier?: RecaptchaVerifier | null
): Promise<{ confirmationResult: ConfirmationResult; verifier: RecaptchaVerifier }> {
  const auth = getAuth(app);
  // Clear old verifier to allow re-use of the same container
  if (existingVerifier) {
    try { existingVerifier.clear(); } catch { /* ignore */ }
  }
  const verifier = new RecaptchaVerifier(auth, containerId, { size: "invisible" });
  const confirmationResult = await signInWithPhoneNumber(auth, `+91${phone}`, verifier);
  return { confirmationResult, verifier };
}

/**
 * Confirm the OTP entered by the user and return a Firebase ID token.
 * Pass the ID token to POST /api/auth/firebase-phone to receive a JWT.
 */
export async function confirmPhoneOtp(
  confirmationResult: ConfirmationResult,
  otp: string
): Promise<string> {
  const credential = await confirmationResult.confirm(otp);
  return credential.user.getIdToken();
}

// ─── Push Notifications ──────────────────────────────────────────────────────

/**
 * Request notification permission and return the FCM registration token.
 * Returns null if the browser doesn't support notifications or user denies.
 */
export async function requestNotificationToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  if (!("Notification" in window)) return null;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;

  try {
    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: await navigator.serviceWorker.getRegistration(
        "/firebase-messaging-sw.js"
      ),
    });
    return token ?? null;
  } catch {
    return null;
  }
}

/**
 * Listen for foreground messages (app is open).
 * Call this once in your root layout or chat page.
 */
export function onForegroundMessage(handler: (payload: MessagePayload) => void) {
  if (typeof window === "undefined") return () => {};
  const messaging = getMessaging(app);
  return onMessage(messaging, handler);
}
