// Google Cloud Vision SafeSearch 기반 이미지 검열.
// VISION_API_KEY 환경변수가 세팅돼 있으면 실호출, 없으면 mock 폴백(85% OK).
// 배포 시 GCP Console에서 Cloud Vision API 활성화 + API Key 발급 후 env에 넣으면 즉시 전환됨.

const VISION_API_URL = "https://vision.googleapis.com/v1/images:annotate";
const BAD_LEVELS = new Set(["LIKELY", "VERY_LIKELY"]);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { imageUrl } = req.body || {};
  if (!imageUrl || typeof imageUrl !== "string") {
    return res.status(400).json({ ok: false, reason: "imageUrl required" });
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
