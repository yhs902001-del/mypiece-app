import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { getDatabase } from "firebase-admin/database";

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  });
}

// IP별 분당 30회 — 정상 채팅엔 충분, 스팸엔 제동
const PUSH_LIMIT_PER_MIN = 30;
const ipLog = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const log = (ipLog.get(ip) || []).filter(t => now - t < 60_000);
  if (log.length >= PUSH_LIMIT_PER_MIN) return true;
  log.push(now);
  ipLog.set(ip, log);
  if (ipLog.size > 200) {
    const oldest = [...ipLog.entries()].sort((a,b) => (a[1][0]||0) - (b[1][0]||0))[0];
    if (oldest) ipLog.delete(oldest[0]);
  }
  return false;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const ip = (req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown").split(",")[0].trim();
  if (rateLimited(ip)) return res.status(429).json({ error: "rate limit (분당 30회 초과)" });

  const { toUid, title, body } = req.body;
  if (!toUid || !title) return res.status(400).json({ error: "missing fields" });
  // 알림 텍스트 길이 제한 (FCM 비용은 무료지만 페이로드는 제한)
  const safeTitle = String(title).slice(0, 80);
  const safeBody = body ? String(body).slice(0, 200) : "";

  try {
    const db = getDatabase();
    const snap = await db.ref(`users/${toUid}/fcmToken`).get();
    const token = snap.val();
    if (!token) return res.status(200).json({ sent: false, reason: "no token" });

    await getMessaging().send({
      token,
      notification: { title: safeTitle, body: safeBody },
      webpush: { fcmOptions: { link: "/" } },
    });

    res.status(200).json({ sent: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
