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

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { toUid, title, body } = req.body;
  if (!toUid || !title) return res.status(400).json({ error: "missing fields" });

  try {
    const db = getDatabase();
    const snap = await db.ref(`users/${toUid}/fcmToken`).get();
    const token = snap.val();
    if (!token) return res.status(200).json({ sent: false, reason: "no token" });

    await getMessaging().send({
      token,
      notification: { title, body: body || "" },
      webpush: { fcmOptions: { link: "/" } },
    });

    res.status(200).json({ sent: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
