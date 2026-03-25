import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

// Lazy-init Firebase Admin once
function getAdmin() {
  if (getApps().length === 0) {
    initializeApp({
      credential: cert({
        projectId:    process.env.FIREBASE_PROJECT_ID!,
        clientEmail:  process.env.FIREBASE_CLIENT_EMAIL!,
        privateKey:   process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
      }),
    });
  }
  return getMessaging();
}

export type FcmPayload = {
  title: string;
  body: string;
  data?: Record<string, string>;
};

/**
 * Send a push notification to a single FCM token.
 * Silently ignores invalid / stale tokens.
 */
export async function sendPush(token: string, payload: FcmPayload): Promise<void> {
  if (!process.env.FIREBASE_PROJECT_ID) return; // skip if not configured
  try {
    await getAdmin().send({
      token,
      notification: { title: payload.title, body: payload.body },
      data: payload.data,
      webpush: {
        notification: {
          title: payload.title,
          body: payload.body,
          icon: "/icons/icon-192x192.png",
          badge: "/icons/icon-192x192.png",
          ...payload.data,
        },
        fcmOptions: { link: payload.data?.url ?? "/browse" },
      },
    });
  } catch (err: unknown) {
    // Token expired or unregistered — ignore
    const code = (err as { code?: string }).code;
    if (code !== "messaging/registration-token-not-registered" &&
        code !== "messaging/invalid-registration-token") {
      console.error("[FCM]", err);
    }
  }
}

/**
 * Send push to multiple tokens concurrently.
 */
export async function sendPushToMany(tokens: string[], payload: FcmPayload): Promise<void> {
  if (!tokens.length || !process.env.FIREBASE_PROJECT_ID) return;
  await Promise.allSettled(tokens.map((t) => sendPush(t, payload)));
}
