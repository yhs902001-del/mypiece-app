import { useState } from "react";
import Head from "next/head";
import Link from "next/link";

const CONTENT = {
  ko: {
    title: "이용약관",
    updated: "시행일: 2026년 4월 24일",
    intro: "본 약관은 MyPiece(이하 \"회사\")가 제공하는 온라인 매칭 서비스의 이용조건과 이용자의 권리·의무를 규정합니다. 서비스에 가입하거나 이용함으로써 본 약관에 동의한 것으로 간주됩니다.",
    sections: [
      {
        h: "제1조 (목적)",
        b: [
          "본 약관은 회사가 운영하는 MyPiece 서비스(이하 \"서비스\") 이용에 관한 회사와 이용자의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.",
        ],
      },
      {
        h: "제2조 (서비스 소개)",
        b: [
          "MyPiece는 이용자가 자신의 매력 포인트(\"피스\")와 관심 부위를 설정하고, 유사한 취향을 가진 사람을 찾아 소통할 수 있는 온라인 매칭 서비스입니다.",
          "서비스는 무료로 제공됨을 원칙으로 하며, 추후 일부 기능을 유료화할 수 있습니다. 유료화 시 사전 고지합니다.",
        ],
      },
      {
        h: "제3조 (가입 자격 및 성인 인증)",
        b: [
          "만 19세 이상인 자에 한하여 가입할 수 있습니다.",
          "허위 나이로 가입한 경우 발견 즉시 계정이 정지되며, 관련 법령에 따른 법적 책임은 전적으로 이용자 본인에게 있습니다.",
          "가입 시 본인은 만 19세 이상임을 스스로 확인하고 서약해야 합니다.",
        ],
      },
      {
        h: "제4조 (회원 의무)",
        b: [
          "이용자는 타인의 명의로 가입하거나 허위 정보를 입력해서는 안 됩니다.",
          "이용자는 본인의 계정 정보를 제3자에게 공유해서는 안 되며, 관리 소홀로 인한 손해의 책임은 이용자 본인에게 있습니다.",
          "이용자는 서비스 내에서 상대방을 존중하고, 예의를 지켜야 합니다.",
        ],
      },
      {
        h: "제5조 (금지행위)",
        b: [
          "다음 행위는 엄격히 금지되며, 발견 시 경고 없이 계정 정지·삭제 및 법적 조치가 이루어질 수 있습니다:",
          "• 얼굴, 나체, 성적 노출, 음란 콘텐츠 업로드",
          "• 미성년자의 이용 또는 미성년자 대상 접근",
          "• 타인의 사진·신원 도용 및 사칭",
          "• 스팸, 광고, 상업적 목적의 메시지 발송",
          "• 회사 또는 다른 이용자에 대한 허위 사실 유포, 명예훼손, 모욕",
          "• 실제 만남의 강요, 금품·선물 요구, 대출·투자 권유 등 사기성 행위",
          "• 해킹, 자동화 도구, 봇을 이용한 서비스 이용",
          "• 본 약관 및 관련 법령 위반 행위",
        ],
      },
      {
        h: "제6조 (콘텐츠 모니터링 및 신고)",
        b: [
          "회사는 서비스 내 업로드된 이미지·메시지에 대해 자동 이미지 필터링 및 운영자 검수를 진행하며, 이용자 신고 기반 사후 조치도 병행합니다.",
          "부적절한 콘텐츠 또는 금지행위를 발견한 이용자는 신고 기능을 통해 즉시 신고할 수 있으며, 회사는 접수된 신고를 합리적인 기간 내에 검토합니다.",
          "신고가 사실로 확인될 경우 경고, 기능 제한, 계정 정지, 계정 삭제 등의 조치를 취할 수 있습니다.",
        ],
      },
      {
        h: "제7조 (계정 정지 및 삭제)",
        b: [
          "회사는 이용자가 본 약관 또는 관련 법령을 위반한 경우, 사전 통지 없이 계정을 정지하거나 삭제할 수 있습니다.",
          "이용자는 언제든지 설정 메뉴를 통해 계정을 삭제할 수 있으며, 삭제 즉시 프로필·채팅·사진 등 관련 데이터가 삭제됩니다(법령상 보존 의무가 있는 정보는 제외).",
        ],
      },
      {
        h: "제8조 (지적재산권)",
        b: [
          "이용자가 서비스에 업로드한 콘텐츠의 저작권은 이용자 본인에게 있습니다.",
          "회사는 서비스 운영·홍보·개선 목적 범위 내에서만 해당 콘텐츠를 사용할 수 있으며, 제3자에게 양도하지 않습니다.",
          "서비스의 로고, 디자인, 상표, 코드 등 회사가 제작한 요소는 회사의 지적재산이며, 무단 복제·배포·역공학은 금지됩니다.",
        ],
      },
      {
        h: "제9조 (면책)",
        b: [
          "회사는 이용자 간의 개인적인 만남·거래·분쟁에 대해 어떠한 책임도 지지 않으며, 이는 전적으로 이용자 본인의 판단과 책임하에 이루어집니다.",
          "천재지변, 서비스 장애, 기술적 문제, 제3자 서비스(Firebase, Vercel 등)의 장애로 인한 서비스 중단에 대해 회사는 고의 또는 중과실이 없는 한 책임지지 않습니다.",
          "회사는 서비스를 통해 매칭된 상대방의 신원·인격·의도를 보증하지 않습니다. 이용자는 개인정보 공유·만남 시 각별한 주의를 기울여야 합니다.",
        ],
      },
      {
        h: "제10조 (약관의 변경)",
        b: [
          "회사는 필요 시 본 약관을 변경할 수 있으며, 변경 시 시행 최소 7일 전에 공지합니다. 이용자에게 불리한 변경의 경우 30일 전 공지합니다.",
          "변경된 약관에 동의하지 않는 이용자는 계정 삭제를 통해 서비스 이용을 중단할 수 있습니다. 변경 이후 서비스 이용을 계속하는 경우 변경 약관에 동의한 것으로 간주됩니다.",
        ],
      },
      {
        h: "제11조 (준거법 및 관할)",
        b: [
          "본 약관은 대한민국 법률에 따라 해석됩니다.",
          "서비스 이용과 관련하여 분쟁이 발생한 경우 회사와 이용자는 성실히 협의하여 해결하되, 협의가 이루어지지 않을 경우 민사소송법상의 관할법원에 제기합니다.",
        ],
      },
      {
        h: "제12조 (문의처)",
        b: [
          "이메일: yhs902001@gmail.com",
          "서비스 이용·계정·신고·문의 등은 위 연락처로 접수해 주시기 바랍니다.",
        ],
      },
    ],
    back: "돌아가기",
    footer: "본 약관은 범용 템플릿을 기반으로 작성되었습니다. 유료 서비스 전환 또는 일반 공개 전에는 법무 전문가의 검토를 받으시기 바랍니다.",
  },
  en: {
    title: "Terms of Service",
    updated: "Effective: April 24, 2026",
    intro: "These Terms of Service govern your use of MyPiece (\"we\", \"the Service\"). By signing up or using the Service, you agree to these Terms.",
    sections: [
      {
        h: "Article 1. Purpose",
        b: [
          "These Terms set forth the rights, obligations, and responsibilities between MyPiece and its users regarding the use of the Service.",
        ],
      },
      {
        h: "Article 2. About the Service",
        b: [
          "MyPiece is an online matching service that lets users set their charm points (\"Pieces\") and interests, and connect with people who share similar preferences.",
          "The Service is provided free of charge in principle. Paid features may be introduced in the future with prior notice.",
        ],
      },
      {
        h: "Article 3. Eligibility and Age Verification",
        b: [
          "Only users aged 19 or older may sign up.",
          "If we discover that an account was created using a false age, the account will be suspended immediately, and the user shall bear full legal responsibility.",
          "Users must self-certify that they are 19 or older at signup.",
        ],
      },
      {
        h: "Article 4. User Obligations",
        b: [
          "Users shall not sign up under another person's identity or submit false information.",
          "Users shall not share account credentials with third parties; the user is solely responsible for damages caused by negligent account management.",
          "Users shall treat others with respect and courtesy within the Service.",
        ],
      },
      {
        h: "Article 5. Prohibited Conduct",
        b: [
          "The following are strictly prohibited; violations may result in suspension, deletion, and legal action without prior warning:",
          "• Uploading faces, nudity, sexual exposure, or obscene content",
          "• Use by minors or approaching minors",
          "• Identity theft, impersonation, or using another's photos",
          "• Spam, advertising, or commercial messaging",
          "• False statements, defamation, or insults against the company or other users",
          "• Coercing in-person meetings, soliciting money or gifts, fraud (loans, investment schemes)",
          "• Hacking, automated tools, or bots",
          "• Any conduct violating these Terms or applicable law",
        ],
      },
      {
        h: "Article 6. Content Moderation and Reporting",
        b: [
          "Uploaded images and messages are subject to automated image filtering and operator review, supplemented by user-report-based post-moderation.",
          "Users can report inappropriate content or prohibited conduct. We will review reports within a reasonable period.",
          "Verified violations may result in warnings, feature restrictions, suspension, or account deletion.",
        ],
      },
      {
        h: "Article 7. Account Suspension and Deletion",
        b: [
          "We may suspend or delete accounts for violations of these Terms or applicable law, without prior notice.",
          "Users may delete their account at any time from Settings. Upon deletion, profile, chat, and photo data are removed (except where retention is legally required).",
        ],
      },
      {
        h: "Article 8. Intellectual Property",
        b: [
          "Copyright to content uploaded by users remains with the user.",
          "We may use such content solely for operating, promoting, and improving the Service, and will not transfer it to third parties.",
          "Our logo, design, trademarks, and code are our intellectual property. Unauthorized copying, distribution, or reverse engineering is prohibited.",
        ],
      },
      {
        h: "Article 9. Disclaimers",
        b: [
          "We are not responsible for personal meetings, transactions, or disputes between users. Such interactions are entirely at users' own risk and discretion.",
          "We are not liable for service interruptions caused by force majeure, technical issues, or third-party services (e.g., Firebase, Vercel), absent our intent or gross negligence.",
          "We do not guarantee the identity, character, or intentions of matched users. Exercise caution when sharing personal information or meeting in person.",
        ],
      },
      {
        h: "Article 10. Changes to Terms",
        b: [
          "We may modify these Terms with at least 7 days' prior notice (30 days for changes unfavorable to users).",
          "Users who disagree with changes may delete their account. Continued use after changes take effect constitutes acceptance.",
        ],
      },
      {
        h: "Article 11. Governing Law and Jurisdiction",
        b: [
          "These Terms are governed by the laws of the Republic of Korea.",
          "Disputes will be resolved in good faith; if not resolved, they will be submitted to the competent court under Korean Civil Procedure Act.",
        ],
      },
      {
        h: "Article 12. Contact",
        b: [
          "Email: yhs902001@gmail.com",
          "For inquiries, account issues, or reports, please contact us.",
        ],
      },
    ],
    back: "Back",
    footer: "These Terms are based on a general template. Legal review is strongly recommended before transitioning to paid services or public launch.",
  },
};

const A = "#FF6B45";
const AS = "#FF9B7A";
const SF = "#faf6f3";
const SL = "#fff3ee";
const BD = "#e8d5c8";

export default function Terms() {
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
