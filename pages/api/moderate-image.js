// Google Cloud Vision SafeSearch 기반 이미지 검열.
// VISION_API_KEY 환경변수가 세팅돼 있으면 실호출, 없으면 mock 폴백(85% OK).
// 배포 시 GCP Console에서 Cloud Vision API 활성화 + API Key 발급 후 env에 넣으면 즉시 전환됨.

import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";

if (!getApps().length) {
  try {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    });
  } catch { /* admin 미설정 시 uid 검증만 스킵 */ }
}

const VISION_API_URL = "https://vision.googleapis.com/v1/images:annotate";
const BAD_LEVELS = new Set(["LIKELY", "VERY_LIKELY"]);
const VISION_DAILY_LIMIT_SERVER = 12; // 클라(10)보다 약간 여유 (네트워크 재시도 흡수)

// IP별 분당 호출 한도 (서버 메모리 기반 — Vercel 콜드스타트 시 리셋되므로 진짜 보호는 클라이언트+Firebase Rules에서)
const IP_LIMIT_PER_MIN = 5;
const ipLog = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const log = (ipLog.get(ip) || []).filter(t => now - t < 60_000);
  if (log.length >= IP_LIMIT_PER_MIN) return true;
  log.push(now);
  ipLog.set(ip, log);
  // 메모리 누수 방지 — 100개 IP 이상이면 가장 오래된 것 제거
  if (ipLog.size > 100) {
    const oldest = [...ipLog.entries()].sort((a,b) => (a[1][0]||0) - (b[1][0]||0))[0];
    if (oldest) ipLog.delete(oldest[0]);
  }
  return false;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const ip = (req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown").split(",")[0].trim();
  if (rateLimited(ip)) {
    return res.status(429).json({ ok: false, reason: "너무 잦은 요청 (분당 5회 제한)" });
  }

  const { imageUrl, uid } = req.body || {};
  if (!imageUrl || typeof imageUrl !== "string") {
    return res.status(400).json({ ok: false, reason: "imageUrl required" });
  }
  // 임의 URL 검열 차단 — Firebase Storage URL만 허용 (악용 방지: Vision API가 임의 URL 다운로드)
  if (!imageUrl.startsWith("https://firebasestorage.googleapis.com/") &&
      !imageUrl.startsWith("https://storage.googleapis.com/")) {
    return res.status(400).json({ ok: false, reason: "허용되지 않은 이미지 호스트" });
  }

  // uid 기반 일일 한도 검증 (localStorage 우회 방지)
  if (uid && getApps().length) {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const adb = getDatabase();
      const snap = await adb.ref(`apiUsage/${uid}/vision/${today}`).get();
      const count = snap.val() || 0;
      if (count > VISION_DAILY_LIMIT_SERVER) {
        return res.status(429).json({ ok: false, reason: "일일 검증 한도 초과 (서버측)" });
      }
    } catch { /* 검증 실패 시에도 진행 — 클라측 한도가 1차 방어선 */ }
  }

  const apiKey = process.env.VISION_API_KEY;

  // Fallback: mock. VISION_API_KEY 미설정 시 개발·베타 단계용.
  if (!apiKey) {
    await new Promise(r => setTimeout(r, 1200));
    const ok = Math.random() > 0.15;
    return res.status(200).json({
      ok,
      reason: ok ? null : "이미지 검증 실패 (mock)",
      mode: "mock",
    });
  }

  // 실검열: Vision API SafeSearch + Face Detection
  try {
    const resp = await fetch(`${VISION_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [
          {
            image: { source: { imageUri: imageUrl } },
            features: [
              { type: "SAFE_SEARCH_DETECTION" },
              { type: "FACE_DETECTION", maxResults: 1 },
            ],
          },
        ],
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      return res.status(502).json({
        ok: false,
        reason: `Vision API 오류 (${resp.status})`,
        detail: text.slice(0, 200),
        mode: "vision",
      });
    }

    const data = await resp.json();
    const r = (data.responses && data.responses[0]) || {};
    const safe = r.safeSearchAnnotation || {};
    const faces = r.faceAnnotations || [];

    const reasons = [];
    if (BAD_LEVELS.has(safe.adult)) reasons.push("성인 콘텐츠 감지");
    if (safe.racy === "VERY_LIKELY") reasons.push("노출 수위 높음");
    if (BAD_LEVELS.has(safe.violence)) reasons.push("폭력성 감지");
    if (faces.length > 0) reasons.push("얼굴이 포함된 이미지는 업로드 불가");

    const ok = reasons.length === 0;
    return res.status(200).json({
      ok,
      reason: ok ? null : reasons.join(" · "),
      mode: "vision",
    });
  } catch (e) {
    return res.status(500).json({
      ok: false,
      reason: "검증 서비스 네트워크 오류",
      detail: e.message,
      mode: "vision-error",
    });
  }
}
