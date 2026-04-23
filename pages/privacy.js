import { useState } from "react";
import Head from "next/head";
import Link from "next/link";

const CONTENT = {
  ko: {
    title: "개인정보처리방침",
    updated: "시행일: 2026년 4월 24일",
    intro: "MyPiece(이하 \"회사\")는 이용자의 개인정보를 소중하게 생각하며, 「개인정보 보호법」을 비롯한 관계 법령을 준수합니다. 본 방침은 회사가 수집·이용·보관·파기하는 개인정보에 대한 내용을 담고 있습니다.",
    sections: [
      {
        h: "1. 수집하는 개인정보 항목",
        b: [
          "필수: 이메일, 비밀번호(암호화 저장), 닉네임, 만 19세 이상 여부, 프로필 사진(인증용), 자신있는 피스 / 관심있는 피스 선택값",
          "자동 수집: 접속 로그, 기기 정보(브라우저 종류, OS), FCM 푸시 토큰(푸시 알림 동의 시), 쿠키",
          "선택: 성별, 지역, 자기소개 등 이용자가 직접 프로필에 입력한 정보",
        ],
      },
      {
        h: "2. 수집·이용 목적",
        b: [
          "회원 식별 및 본인 인증",
          "매칭 서비스 제공 및 프로필 표시",
          "채팅 및 푸시 알림 전송",
          "부적절한 콘텐츠·허위정보에 대한 모니터링 및 제재",
          "신고 처리 및 분쟁 해결",
        ],
      },
      {
        h: "3. 보유 및 이용 기간",
        b: [
          "회원 탈퇴 시 보유 정보는 즉시 삭제합니다. 단, 관련 법령에 의해 보존 필요한 정보는 아래 기간 동안 보관합니다.",
          "• 신고·분쟁 기록: 3년 (전자상거래법 등)",
          "• 접속 로그: 3개월 (통신비밀보호법)",
          "• 부정 이용 방지 기록: 1년",
        ],
      },
      {
        h: "4. 제3자 제공 및 처리 위탁",
        b: [
          "회사는 이용자의 동의 없이 개인정보를 제3자에게 제공하지 않습니다.",
          "서비스 운영을 위해 아래 업체에 개인정보 처리를 위탁하고 있습니다:",
          "• Google LLC (Firebase Authentication, Realtime Database, Cloud Storage, Cloud Messaging) — 회원 인증, 데이터 저장, 푸시 알림",
          "• Vercel Inc. — 서비스 호스팅",
        ],
      },
      {
        h: "5. 이용자의 권리",
        b: [
          "이용자는 언제든지 아래 권리를 행사할 수 있습니다:",
          "• 개인정보 열람·정정·삭제 요청",
          "• 처리 정지 요청",
          "• 동의 철회 (회원 탈퇴)",
          "설정 메뉴에서 직접 변경하거나, 아래 연락처로 문의하시면 지체 없이 처리합니다.",
        ],
      },
      {
        h: "6. 민감정보 및 사진 처리",
        b: [
          "MyPiece는 매칭을 위해 신체 부위가 포함된 사진을 수집할 수 있습니다. 해당 사진은 AI 검열 시스템(또는 수동 검수)을 통해 부적절 콘텐츠 여부를 확인한 뒤 저장됩니다.",
          "본 서비스는 만 19세 이상만 이용할 수 있으며, 미성년자의 가입은 금지됩니다.",
          "얼굴, 나체, 성적 노출이 포함된 사진 업로드는 금지되며 발견 시 즉시 삭제·계정 정지 조치합니다.",
        ],
      },
      {
        h: "7. 쿠키 및 자동 수집 장치",
        b: [
          "서비스는 로그인 상태 유지 및 분석을 위해 쿠키와 로컬스토리지를 사용합니다. 브라우저 설정에서 쿠키 저장을 거부할 수 있으나, 이 경우 서비스 이용이 제한될 수 있습니다.",
        ],
      },
      {
        h: "8. 개인정보의 안전성 확보 조치",
        b: [
          "비밀번호는 단방향 해시로 암호화 저장됩니다.",
          "중요 통신 구간은 HTTPS(SSL)로 암호화됩니다.",
          "개인정보 접근 권한은 최소화하여 운영됩니다.",
        ],
      },
      {
        h: "9. 개인정보 보호책임자",
        b: [
          "이메일: yhs902001@gmail.com",
          "이용자의 개인정보 관련 문의·불만·피해구제 사항은 위 연락처로 접수해 주시기 바랍니다.",
        ],
      },
      {
        h: "10. 권익침해 구제방법",
        b: [
          "개인정보분쟁조정위원회: 1833-6972 (www.kopico.go.kr)",
          "개인정보침해신고센터: 118 (privacy.kisa.or.kr)",
          "대검찰청 사이버수사과: 1301 (www.spo.go.kr)",
          "경찰청 사이버수사국: 182 (ecrm.cyber.go.kr)",
        ],
      },
      {
        h: "11. 고지의 의무",
        b: [
          "본 개인정보처리방침의 내용 추가·삭제 및 수정이 있을 시 시행 최소 7일 전부터 공지사항을 통해 고지합니다. 중대한 변경이 있을 경우 30일 전에 고지합니다.",
        ],
      },
    ],
    back: "돌아가기",
    footer: "본 방침은 범용 템플릿을 기반으로 작성되었습니다. 유료 서비스 전환 또는 일반 공개 전에는 법무 전문가의 검토를 받으시기 바랍니다.",
  },
  en: {
    title: "Privacy Policy",
    updated: "Effective: April 24, 2026",
    intro: "MyPiece (\"we\", \"our\") values your privacy and complies with the Personal Information Protection Act of Korea and other applicable laws. This policy describes what personal information we collect, how we use it, and how we protect it.",
    sections: [
      {
        h: "1. Information We Collect",
        b: [
          "Required: Email, password (stored hashed), nickname, age 19+ confirmation, profile photos (for verification), selected pieces and interests",
          "Automatically collected: access logs, device info (browser, OS), FCM push tokens (if permitted), cookies",
          "Optional: gender, region, bio, and other profile details you provide",
        ],
      },
      {
        h: "2. Purpose of Use",
        b: [
          "Account identification and verification",
          "Matching service and profile display",
          "Chat and push notifications",
          "Monitoring inappropriate content and fraud prevention",
          "Report handling and dispute resolution",
        ],
      },
      {
        h: "3. Retention Period",
        b: [
          "Personal data is deleted immediately upon account deletion, except as required by law:",
          "• Report and dispute records: 3 years",
          "• Access logs: 3 months",
          "• Abuse prevention records: 1 year",
        ],
      },
      {
        h: "4. Third-Party Sharing and Processors",
        b: [
          "We do not share personal data with third parties without your consent.",
          "We use the following processors:",
          "• Google LLC (Firebase) — authentication, database, storage, push messaging",
          "• Vercel Inc. — hosting",
        ],
      },
      {
        h: "5. Your Rights",
        b: [
          "You may at any time:",
          "• Request access, correction, or deletion of your data",
          "• Request processing to stop",
          "• Withdraw consent (delete account)",
          "You can manage most of these from the Settings menu, or contact us.",
        ],
      },
      {
        h: "6. Sensitive Information and Photo Handling",
        b: [
          "MyPiece may collect photos including body parts for matching. These photos are reviewed for inappropriate content by AI moderation (or manual review) before storage.",
          "This service is restricted to users aged 19 or older.",
          "Uploading faces, nudity, or sexually explicit images is prohibited and will result in immediate removal and account suspension.",
        ],
      },
      {
        h: "7. Cookies",
        b: [
          "We use cookies and local storage to maintain login sessions and analyze usage. You may disable cookies in your browser, but some features may not work.",
        ],
      },
      {
        h: "8. Security",
        b: [
          "Passwords are stored using one-way hashing.",
          "Sensitive traffic is encrypted via HTTPS/SSL.",
          "Access to personal data is restricted on a need-to-know basis.",
        ],
      },
      {
        h: "9. Data Protection Officer",
        b: [
          "Email: yhs902001@gmail.com",
          "For any privacy-related questions or requests, please contact us.",
        ],
      },
      {
        h: "10. Dispute Resolution (Korea)",
        b: [
          "Personal Information Dispute Mediation Committee: 1833-6972",
          "Korea Internet & Security Agency (KISA): 118",
          "Supreme Prosecutors' Office Cybercrime: 1301",
          "Korean National Police Cyber Bureau: 182",
        ],
      },
      {
        h: "11. Changes to This Policy",
        b: [
          "We will notify users at least 7 days before any change takes effect, or 30 days for significant changes.",
        ],
      },
    ],
    back: "Back",
    footer: "This policy is based on a general template. Legal review is strongly recommended before transitioning to paid services or public launch.",
  },
};

const A = "#FF6B45";
const AS = "#FF9B7A";
const SF = "#faf6f3";
const SL = "#fff3ee";
const BD = "#e8d5c8";

export default function Privacy() {
  const [lang, setLang] = useState("ko");
  const c = CONTENT[lang];

  return (
    <div style={{
      minHeight: "100vh",
      background: "#ffffff",
      color: "#1a1a1a",
      fontFamily: "'Noto Sans KR', system-ui, sans-serif",
      maxWidth: 720,
      margin: "0 auto",
      padding: "40px 24px 80px",
    }}>
      <Head>
        <title>{c.title} · MyPiece</title>
        <meta name="description" content={c.intro.slice(0, 140)} />
        <meta name="robots" content="index,follow" />
      </Head>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <Link href="/" style={{ color: "#666", fontSize: 14, textDecoration: "none" }}>‹ {c.back}</Link>
        <div style={{ display: "flex", gap: 4, background: SL, borderRadius: 20, padding: 3, border: `1px solid ${BD}` }}>
          {["ko", "en"].map(code => (
            <button key={code} onClick={() => setLang(code)} style={{
              padding: "6px 14px", borderRadius: 18, border: "none",
              background: lang === code ? A : "transparent",
              color: lang === code ? "#fff" : "#666",
              fontSize: 12, fontWeight: 700, cursor: "pointer",
            }}>{code.toUpperCase()}</button>
          ))}
        </div>
      </div>

      <h1 style={{
        fontSize: 28, fontWeight: 900, margin: "0 0 8px",
        background: `linear-gradient(135deg,${A},${AS})`,
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
      }}>{c.title}</h1>
      <div style={{ fontSize: 12, color: "#888", marginBottom: 24 }}>{c.updated}</div>

      <p style={{ fontSize: 14, lineHeight: 1.7, color: "#444", marginBottom: 32 }}>{c.intro}</p>

      {c.sections.map((s, i) => (
        <section key={i} style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 12px", color: "#1a1a1a" }}>{s.h}</h2>
          <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
            {s.b.map((line, j) => (
              <li key={j} style={{
                fontSize: 13, lineHeight: 1.7, color: "#555",
                padding: "6px 14px", marginBottom: 6,
                background: SF, borderRadius: 10,
                borderLeft: `3px solid ${A}66`,
              }}>{line}</li>
            ))}
          </ul>
        </section>
      ))}

      <div style={{
        marginTop: 40, padding: "16px 18px", borderRadius: 12,
        background: `${A}0a`, border: `1px solid ${A}22`, fontSize: 12,
        color: "#777", lineHeight: 1.6,
      }}>⚠️ {c.footer}</div>
    </div>
  );
}
