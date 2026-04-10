import { useState, useEffect, useRef } from "react";
import Head from "next/head";
import { auth, db, storage, getMessagingInstance } from "@/lib/firebase";
import { ref as sRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { getToken, onMessage } from "firebase/messaging";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { ref, set, get, push, onValue } from "firebase/database";

// ─── i18n ───
const LANGS = [
  { code: "ko", flag: "🇰🇷", name: "한국어" },
  { code: "en", flag: "🇺🇸", name: "English" },
  { code: "ja", flag: "🇯🇵", name: "日本語" },
  { code: "zh", flag: "🇨🇳", name: "中文" },
  { code: "es", flag: "🇪🇸", name: "Español" },
  { code: "fr", flag: "🇫🇷", name: "Français" },
  { code: "de", flag: "🇩🇪", name: "Deutsch" },
  { code: "pt", flag: "🇧🇷", name: "Português" },
  { code: "th", flag: "🇹🇭", name: "ไทย" },
  { code: "vi", flag: "🇻🇳", name: "Tiếng Việt" },
];

const L = {
  ko: {
    slogan: "나의 피스를 찾아서",
    start: "시작하기",
    ageTitle: "19세 이상 인증",
    ageDesc: "이 서비스는 만 19세 이상만 이용 가능합니다",
    ageYes: "네, 19세 이상입니다",
    ageNo: "아니요",
    ageBlock: "19세 미만은 이용할 수 없습니다",
    nickTitle: "닉네임",
    nickPh: "닉네임 (2~10자)",
    myPiece: "자신있는 피스",
    myPieceDesc: "매력 포인트 선택 (최대 3개)",
    intPiece: "관심있는 피스",
    intPieceDesc: "끌리는 부위 선택 (최대 3개)",
    verify: "피스미 인증",
    verifyWarn: "얼굴/부적절 부위는 AI가 자동 검열합니다",
    scanning: "AI 검증 중...",
    scanOk: "인증 완료",
    scanFail: "부적절 부위 감지",
    upload: "탭하여 업로드",
    next: "다음",
    done: "완료",
    later: "나중에",
    back: "뒤로",
    home: "홈",
    discover: "디스커버",
    lounge: "라운지",
    chat: "채팅",
    my: "MY",
    swipeHint: "스와이프하여 새로운 피스 찾기",
    pass: "패스",
    like: "좋아요",
    startChat: "채팅 시작",
    matchRate: "매칭률",
    online: "온라인",
    offline: "오프라인",
    verified: "인증",
    badge: "배지",
    noBadge: "미배지",
    msgPh: "메시지...",
    translated: "번역됨",
    report: "신고",
    block: "차단",
    genderFilter: "성별 필터",
    regionFilter: "지역 필터",
    premiumOnly: "구독 전용",
    subscribe: "구독하기",
    logout: "로그아웃",
    settings: "설정",
    lang: "언어",
    reportReasons: ["부적절한 사진", "스팸/광고", "욕설", "사기 의심", "기타"],
    reported: "신고 접수 완료",
    blocked: "차단되었습니다",
    pcs: ["손", "발", "팔", "다리", "목", "어깨", "허리", "등", "손목", "발목", "쇄골", "복근"],
  },
  en: {
    slogan: "Find Your Piece",
    start: "Get Started",
    ageTitle: "Age Verification (19+)",
    ageDesc: "This service is for ages 19+",
    ageYes: "Yes, I'm 19+",
    ageNo: "No",
    ageBlock: "You must be 19+ to use MyPiece",
    nickTitle: "Nickname",
    nickPh: "Nickname (2-10 chars)",
    myPiece: "My Piece",
    myPieceDesc: "Your charm points (up to 3)",
    intPiece: "Interested Piece",
    intPieceDesc: "What attracts you (up to 3)",
    verify: "Verification",
    verifyWarn: "Face/inappropriate parts auto-moderated by AI",
    scanning: "AI verifying...",
    scanOk: "Verified",
    scanFail: "Inappropriate content detected",
    upload: "Tap to upload",
    next: "Next",
    done: "Done",
    later: "Later",
    back: "Back",
    home: "Home",
    discover: "Discover",
    lounge: "Lounge",
    chat: "Chat",
    my: "MY",
    swipeHint: "Swipe to find new pieces",
    pass: "Pass",
    like: "Like",
    startChat: "Chat",
    matchRate: "Match",
    online: "Online",
    offline: "Offline",
    verified: "Verified",
    badge: "Badge",
    noBadge: "No Badge",
    msgPh: "Message...",
    translated: "translated",
    report: "Report",
    block: "Block",
    genderFilter: "Gender Filter",
    regionFilter: "Region Filter",
    premiumOnly: "Subscribers only",
    subscribe: "Subscribe",
    logout: "Log out",
    settings: "Settings",
    lang: "Language",
    reportReasons: ["Inappropriate photo", "Spam", "Abusive language", "Scam", "Other"],
    reported: "Report submitted",
    blocked: "Blocked",
    pcs: ["Hand", "Foot", "Arm", "Leg", "Neck", "Shoulder", "Waist", "Back", "Wrist", "Ankle", "Collarbone", "Abs"],
  },
  ja: {
    slogan: "あなたのピースを見つけよう",
    start: "はじめる",
    ageTitle: "年齢確認 (19歳以上)",
    ageDesc: "このサービスは19歳以上の方が対象です",
    ageYes: "はい、19歳以上です",
    ageNo: "いいえ",
    ageBlock: "19歳未満はご利用いただけません",
    nickTitle: "ニックネーム",
    nickPh: "ニックネーム (2～10文字)",
    myPiece: "自信のあるピース",
    myPieceDesc: "魅力ポイントを選択 (最大3つ)",
    intPiece: "気になるピース",
    intPieceDesc: "惹かれる部位を選択 (最大3つ)",
    verify: "ピース認証",
    verifyWarn: "顔/不適切な部位はAIが自動検閲します",
    scanning: "AI検証中...",
    scanOk: "認証完了",
    scanFail: "不適切なコンテンツを検出",
    upload: "タップしてアップロード",
    next: "次へ",
    done: "完了",
    later: "後で",
    back: "戻る",
    home: "ホーム",
    discover: "ディスカバー",
    lounge: "ラウンジ",
    chat: "チャット",
    my: "MY",
    swipeHint: "スワイプして新しいピースを探す",
    pass: "パス",
    like: "いいね",
    startChat: "チャット開始",
    matchRate: "マッチ率",
    online: "オンライン",
    offline: "オフライン",
    verified: "認証済み",
    badge: "バッジ",
    noBadge: "バッジなし",
    msgPh: "メッセージ...",
    translated: "翻訳済み",
    report: "通報",
    block: "ブロック",
    genderFilter: "性別フィルター",
    regionFilter: "地域フィルター",
    premiumOnly: "サブスク限定",
    subscribe: "登録する",
    logout: "ログアウト",
    settings: "設定",
    lang: "言語",
    reportReasons: ["不適切な写真", "スパム", "暴言", "詐欺の疑い", "その他"],
    reported: "通報を受け付けました",
    blocked: "ブロックしました",
    pcs: ["手", "足", "腕", "脚", "首", "肩", "腰", "背中", "手首", "足首", "鎖骨", "腹筋"],
  },
  zh: {
    slogan: "寻找你的碎片",
    start: "开始",
    ageTitle: "年龄验证 (19岁以上)",
    ageDesc: "此服务仅限19岁以上用户",
    ageYes: "是的，我已满19岁",
    ageNo: "否",
    ageBlock: "未满19岁不能使用",
    nickTitle: "昵称",
    nickPh: "昵称 (2-10字)",
    myPiece: "我的优势",
    myPieceDesc: "选择魅力点 (最多3个)",
    intPiece: "感兴趣的部位",
    intPieceDesc: "选择吸引你的部位 (最多3个)",
    verify: "认证",
    verifyWarn: "面部/不雅部位将由AI自动审核",
    scanning: "AI验证中...",
    scanOk: "验证完成",
    scanFail: "检测到不雅内容",
    upload: "点击上传",
    next: "下一步",
    done: "完成",
    later: "稍后",
    back: "返回",
    home: "主页",
    discover: "发现",
    lounge: "休息室",
    chat: "聊天",
    my: "我的",
    swipeHint: "滑动寻找新碎片",
    pass: "跳过",
    like: "喜欢",
    startChat: "开始聊天",
    matchRate: "匹配率",
    online: "在线",
    offline: "离线",
    verified: "已认证",
    badge: "徽章",
    noBadge: "无徽章",
    msgPh: "消息...",
    translated: "已翻译",
    report: "举报",
    block: "拉黑",
    genderFilter: "性别筛选",
    regionFilter: "地区筛选",
    premiumOnly: "订阅专属",
    subscribe: "订阅",
    logout: "退出登录",
    settings: "设置",
    lang: "语言",
    reportReasons: ["不雅照片", "垃圾信息", "辱骂", "疑似诈骗", "其他"],
    reported: "举报已提交",
    blocked: "已拉黑",
    pcs: ["手", "脚", "手臂", "腿", "脖子", "肩膀", "腰", "背", "手腕", "脚踝", "锁骨", "腹肌"],
  },
  es: {
    slogan: "Encuentra tu pieza",
    start: "Comenzar",
    ageTitle: "Verificación de edad (19+)",
    ageDesc: "Este servicio es para mayores de 19 años",
    ageYes: "Sí, tengo 19+",
    ageNo: "No",
    ageBlock: "Debes tener 19+ para usar MyPiece",
    nickTitle: "Apodo",
    nickPh: "Apodo (2-10 chars)",
    myPiece: "Mi pieza",
    myPieceDesc: "Tus puntos de encanto (hasta 3)",
    intPiece: "Pieza de interés",
    intPieceDesc: "Lo que te atrae (hasta 3)",
    verify: "Verificación",
    verifyWarn: "Cara/partes inapropiadas moderadas por IA",
    scanning: "IA verificando...",
    scanOk: "Verificado",
    scanFail: "Contenido inapropiado detectado",
    upload: "Toca para subir",
    next: "Siguiente",
    done: "Listo",
    later: "Después",
    back: "Volver",
    home: "Inicio",
    discover: "Descubrir",
    lounge: "Salón",
    chat: "Chat",
    my: "YO",
    swipeHint: "Desliza para encontrar nuevas piezas",
    pass: "Pasar",
    like: "Me gusta",
    startChat: "Chatear",
    matchRate: "Match",
    online: "En línea",
    offline: "Desconectado",
    verified: "Verificado",
    badge: "Insignia",
    noBadge: "Sin insignia",
    msgPh: "Mensaje...",
    translated: "traducido",
    report: "Reportar",
    block: "Bloquear",
    genderFilter: "Filtro de género",
    regionFilter: "Filtro de región",
    premiumOnly: "Solo suscriptores",
    subscribe: "Suscribirse",
    logout: "Cerrar sesión",
    settings: "Configuración",
    lang: "Idioma",
    reportReasons: ["Foto inapropiada", "Spam", "Lenguaje abusivo", "Estafa", "Otro"],
    reported: "Reporte enviado",
    blocked: "Bloqueado",
    pcs: ["Mano", "Pie", "Brazo", "Pierna", "Cuello", "Hombro", "Cintura", "Espalda", "Muñeca", "Tobillo", "Clavícula", "Abdomen"],
  },
  fr: {
    slogan: "Trouvez votre pièce",
    start: "Commencer",
    ageTitle: "Vérification d'âge (19+)",
    ageDesc: "Ce service est réservé aux 19 ans et plus",
    ageYes: "Oui, j'ai 19+",
    ageNo: "Non",
    ageBlock: "Vous devez avoir 19+ pour utiliser MyPiece",
    nickTitle: "Pseudo",
    nickPh: "Pseudo (2-10 chars)",
    myPiece: "Ma pièce",
    myPieceDesc: "Vos points de charme (jusqu'à 3)",
    intPiece: "Pièce d'intérêt",
    intPieceDesc: "Ce qui vous attire (jusqu'à 3)",
    verify: "Vérification",
    verifyWarn: "Visage/parties inappropriées modérées par IA",
    scanning: "IA en vérification...",
    scanOk: "Vérifié",
    scanFail: "Contenu inapproprié détecté",
    upload: "Appuyez pour télécharger",
    next: "Suivant",
    done: "Terminé",
    later: "Plus tard",
    back: "Retour",
    home: "Accueil",
    discover: "Découvrir",
    lounge: "Salon",
    chat: "Discussion",
    my: "MOI",
    swipeHint: "Balayez pour trouver de nouvelles pièces",
    pass: "Passer",
    like: "J'aime",
    startChat: "Discuter",
    matchRate: "Match",
    online: "En ligne",
    offline: "Hors ligne",
    verified: "Vérifié",
    badge: "Badge",
    noBadge: "Sans badge",
    msgPh: "Message...",
    translated: "traduit",
    report: "Signaler",
    block: "Bloquer",
    genderFilter: "Filtre genre",
    regionFilter: "Filtre région",
    premiumOnly: "Abonnés seulement",
    subscribe: "S'abonner",
    logout: "Se déconnecter",
    settings: "Paramètres",
    lang: "Langue",
    reportReasons: ["Photo inappropriée", "Spam", "Langage abusif", "Arnaque", "Autre"],
    reported: "Signalement envoyé",
    blocked: "Bloqué",
    pcs: ["Main", "Pied", "Bras", "Jambe", "Cou", "Épaule", "Taille", "Dos", "Poignet", "Cheville", "Clavicule", "Abdos"],
  },
  de: {
    slogan: "Finde dein Stück",
    start: "Loslegen",
    ageTitle: "Altersverifikation (19+)",
    ageDesc: "Dieser Service ist für Personen ab 19 Jahren",
    ageYes: "Ja, ich bin 19+",
    ageNo: "Nein",
    ageBlock: "Du musst 19+ sein, um MyPiece zu nutzen",
    nickTitle: "Spitzname",
    nickPh: "Spitzname (2-10 Zeichen)",
    myPiece: "Mein Stück",
    myPieceDesc: "Deine Charme-Punkte (bis zu 3)",
    intPiece: "Interessantes Stück",
    intPieceDesc: "Was dich anzieht (bis zu 3)",
    verify: "Verifizierung",
    verifyWarn: "Gesicht/unangemessene Teile werden von KI moderiert",
    scanning: "KI verifiziert...",
    scanOk: "Verifiziert",
    scanFail: "Unangemessener Inhalt erkannt",
    upload: "Tippen zum Hochladen",
    next: "Weiter",
    done: "Fertig",
    later: "Später",
    back: "Zurück",
    home: "Start",
    discover: "Entdecken",
    lounge: "Lounge",
    chat: "Chat",
    my: "ICH",
    swipeHint: "Wische, um neue Stücke zu finden",
    pass: "Überspringen",
    like: "Gefällt mir",
    startChat: "Chatten",
    matchRate: "Match",
    online: "Online",
    offline: "Offline",
    verified: "Verifiziert",
    badge: "Abzeichen",
    noBadge: "Kein Abzeichen",
    msgPh: "Nachricht...",
    translated: "übersetzt",
    report: "Melden",
    block: "Blockieren",
    genderFilter: "Geschlechtsfilter",
    regionFilter: "Regionsfilter",
    premiumOnly: "Nur Abonnenten",
    subscribe: "Abonnieren",
    logout: "Abmelden",
    settings: "Einstellungen",
    lang: "Sprache",
    reportReasons: ["Unangemessenes Foto", "Spam", "Beleidigung", "Betrug", "Sonstiges"],
    reported: "Meldung eingereicht",
    blocked: "Blockiert",
    pcs: ["Hand", "Fuß", "Arm", "Bein", "Hals", "Schulter", "Taille", "Rücken", "Handgelenk", "Knöchel", "Schlüsselbein", "Bauch"],
  },
  pt: {
    slogan: "Encontre seu pedaço",
    start: "Começar",
    ageTitle: "Verificação de idade (19+)",
    ageDesc: "Este serviço é para maiores de 19 anos",
    ageYes: "Sim, tenho 19+",
    ageNo: "Não",
    ageBlock: "Você deve ter 19+ para usar o MyPiece",
    nickTitle: "Apelido",
    nickPh: "Apelido (2-10 chars)",
    myPiece: "Meu pedaço",
    myPieceDesc: "Seus pontos de charme (até 3)",
    intPiece: "Pedaço de interesse",
    intPieceDesc: "O que te atrai (até 3)",
    verify: "Verificação",
    verifyWarn: "Rosto/partes inapropriadas moderadas por IA",
    scanning: "IA verificando...",
    scanOk: "Verificado",
    scanFail: "Conteúdo inapropriado detectado",
    upload: "Toque para enviar",
    next: "Próximo",
    done: "Concluído",
    later: "Depois",
    back: "Voltar",
    home: "Início",
    discover: "Descobrir",
    lounge: "Salão",
    chat: "Chat",
    my: "EU",
    swipeHint: "Deslize para encontrar novos pedaços",
    pass: "Passar",
    like: "Curtir",
    startChat: "Conversar",
    matchRate: "Match",
    online: "Online",
    offline: "Offline",
    verified: "Verificado",
    badge: "Distintivo",
    noBadge: "Sem distintivo",
    msgPh: "Mensagem...",
    translated: "traduzido",
    report: "Denunciar",
    block: "Bloquear",
    genderFilter: "Filtro de gênero",
    regionFilter: "Filtro de região",
    premiumOnly: "Apenas assinantes",
    subscribe: "Assinar",
    logout: "Sair",
    settings: "Configurações",
    lang: "Idioma",
    reportReasons: ["Foto inapropriada", "Spam", "Linguagem abusiva", "Golpe", "Outro"],
    reported: "Denúncia enviada",
    blocked: "Bloqueado",
    pcs: ["Mão", "Pé", "Braço", "Perna", "Pescoço", "Ombro", "Cintura", "Costas", "Pulso", "Tornozelo", "Clavícula", "Abdômen"],
  },
  th: {
    slogan: "ค้นหาชิ้นส่วนของคุณ",
    start: "เริ่มต้น",
    ageTitle: "ยืนยันอายุ (19+)",
    ageDesc: "บริการนี้สำหรับผู้ที่มีอายุ 19 ปีขึ้นไป",
    ageYes: "ใช่ ฉันอายุ 19+",
    ageNo: "ไม่",
    ageBlock: "ต้องมีอายุ 19+ เพื่อใช้ MyPiece",
    nickTitle: "ชื่อเล่น",
    nickPh: "ชื่อเล่น (2-10 ตัวอักษร)",
    myPiece: "ชิ้นส่วนของฉัน",
    myPieceDesc: "จุดเด่นของคุณ (สูงสุด 3)",
    intPiece: "ชิ้นส่วนที่สนใจ",
    intPieceDesc: "สิ่งที่ดึงดูดคุณ (สูงสุด 3)",
    verify: "ยืนยัน",
    verifyWarn: "ใบหน้า/ส่วนที่ไม่เหมาะสมจะถูก AI กลั่นกรอง",
    scanning: "AI กำลังตรวจสอบ...",
    scanOk: "ยืนยันแล้ว",
    scanFail: "ตรวจพบเนื้อหาที่ไม่เหมาะสม",
    upload: "แตะเพื่ออัปโหลด",
    next: "ถัดไป",
    done: "เสร็จสิ้น",
    later: "ภายหลัง",
    back: "กลับ",
    home: "หน้าแรก",
    discover: "ค้นพบ",
    lounge: "เลานจ์",
    chat: "แชท",
    my: "ฉัน",
    swipeHint: "สไลด์เพื่อค้นหาชิ้นส่วนใหม่",
    pass: "ข้าม",
    like: "ถูกใจ",
    startChat: "เริ่มแชท",
    matchRate: "แมทช์",
    online: "ออนไลน์",
    offline: "ออฟไลน์",
    verified: "ยืนยันแล้ว",
    badge: "ตรา",
    noBadge: "ไม่มีตรา",
    msgPh: "ข้อความ...",
    translated: "แปลแล้ว",
    report: "รายงาน",
    block: "บล็อก",
    genderFilter: "กรองเพศ",
    regionFilter: "กรองภูมิภาค",
    premiumOnly: "สำหรับสมาชิกเท่านั้น",
    subscribe: "สมัครสมาชิก",
    logout: "ออกจากระบบ",
    settings: "การตั้งค่า",
    lang: "ภาษา",
    reportReasons: ["รูปภาพไม่เหมาะสม", "สแปม", "ภาษาหยาบคาย", "การหลอกลวง", "อื่นๆ"],
    reported: "ส่งรายงานแล้ว",
    blocked: "บล็อกแล้ว",
    pcs: ["มือ", "เท้า", "แขน", "ขา", "คอ", "ไหล่", "เอว", "หลัง", "ข้อมือ", "ข้อเท้า", "กระดูกไหปลาร้า", "หน้าท้อง"],
  },
  vi: {
    slogan: "Tìm mảnh ghép của bạn",
    start: "Bắt đầu",
    ageTitle: "Xác minh tuổi (19+)",
    ageDesc: "Dịch vụ này dành cho người từ 19 tuổi trở lên",
    ageYes: "Có, tôi 19+",
    ageNo: "Không",
    ageBlock: "Bạn phải 19+ để dùng MyPiece",
    nickTitle: "Biệt danh",
    nickPh: "Biệt danh (2-10 ký tự)",
    myPiece: "Mảnh của tôi",
    myPieceDesc: "Điểm hấp dẫn của bạn (tối đa 3)",
    intPiece: "Mảnh quan tâm",
    intPieceDesc: "Điều thu hút bạn (tối đa 3)",
    verify: "Xác minh",
    verifyWarn: "Khuôn mặt/bộ phận không phù hợp sẽ bị AI kiểm duyệt",
    scanning: "AI đang xác minh...",
    scanOk: "Đã xác minh",
    scanFail: "Phát hiện nội dung không phù hợp",
    upload: "Nhấn để tải lên",
    next: "Tiếp theo",
    done: "Hoàn tất",
    later: "Sau",
    back: "Quay lại",
    home: "Trang chủ",
    discover: "Khám phá",
    lounge: "Phòng chờ",
    chat: "Chat",
    my: "TÔI",
    swipeHint: "Vuốt để tìm mảnh ghép mới",
    pass: "Bỏ qua",
    like: "Thích",
    startChat: "Bắt đầu chat",
    matchRate: "Khớp",
    online: "Trực tuyến",
    offline: "Ngoại tuyến",
    verified: "Đã xác minh",
    badge: "Huy hiệu",
    noBadge: "Không có huy hiệu",
    msgPh: "Tin nhắn...",
    translated: "đã dịch",
    report: "Báo cáo",
    block: "Chặn",
    genderFilter: "Lọc giới tính",
    regionFilter: "Lọc khu vực",
    premiumOnly: "Chỉ thuê bao",
    subscribe: "Đăng ký",
    logout: "Đăng xuất",
    settings: "Cài đặt",
    lang: "Ngôn ngữ",
    reportReasons: ["Ảnh không phù hợp", "Spam", "Ngôn ngữ xúc phạm", "Lừa đảo", "Khác"],
    reported: "Đã gửi báo cáo",
    blocked: "Đã chặn",
    pcs: ["Tay", "Chân", "Cánh tay", "Đùi", "Cổ", "Vai", "Eo", "Lưng", "Cổ tay", "Mắt cá", "Xương đòn", "Bụng"],
  },
};

const tx = (lang, k) => (L[lang] && L[lang][k]) ? L[lang][k] : (L.en[k] || k);

const USERS = [
  { id: 1, name: "하늘별", age: 24, g: "F", bio: "손에 자신있어요 ✋", mp: [0], ip: [0, 4], v: true, vp: 0, on: true, lm: "안녕하세요~", ph: true, d: 2.3, la: "3m", pct: 92, badge: true, rep: 0, region: "KR" },
  { id: 2, name: "Luna", age: 22, g: "F", bio: "Ballet dancer 🦰", mp: [1, 3], ip: [1, 3], v: true, vp: 1, on: true, lm: "Hi :)", ph: true, d: 5.1, la: "5m", pct: 87, badge: true, rep: 0, region: "US" },
  { id: 3, name: "夜空", age: 27, g: "M", bio: "筋トレ3年目 💪", mp: [5], ip: [5, 2], v: false, vp: null, on: false, lm: "", ph: false, d: 1.8, la: "2h", pct: 74, badge: false, rep: 0, region: "JP" },
  { id: 4, name: "새벽이슬", age: 25, g: "F", bio: "쇄골 라인이 매력", mp: [10, 6], ip: [10, 6], v: true, vp: 10, on: true, lm: "Good vibes~", ph: true, d: 8.4, la: "1m", pct: 95, badge: true, rep: 0, region: "KR" },
  { id: 5, name: "Cloud", age: 29, g: "M", bio: "Watch lover ⌚", mp: [0, 8], ip: [0, 8], v: true, vp: 0, on: false, lm: "Later!", ph: true, d: 12, la: "1d", pct: 68, badge: false, rep: 0, region: "US" },
  { id: 6, name: "星の庭", age: 23, g: "F", bio: "ヨガインストラクター", mp: [6, 7], ip: [11, 2], v: true, vp: 6, on: true, lm: "", ph: true, d: 3.7, la: "5m", pct: 81, badge: true, rep: 0, region: "JP" },
  { id: 7, name: "María", age: 26, g: "F", bio: "Dancer from Madrid 💃", mp: [3, 1], ip: [6, 10], v: true, vp: 3, on: true, lm: "", ph: true, d: 9200, la: "2m", pct: 78, badge: true, rep: 0, region: "ES" },
  { id: 8, name: "Tom", age: 28, g: "M", bio: "Climber 🧗", mp: [2, 5], ip: [2, 7], v: true, vp: 2, on: false, lm: "Nice arms!", ph: true, d: 4100, la: "3h", pct: 70, badge: false, rep: 0, region: "DE" },
];

const SC = { SPLASH: 0, LANG: 1, AGE: 2, BLOCK: 3, LOGIN: 4, SIGNUP: 5, HOME: 6, CHAT: 7, PROFILE: 8, LOUNGE: 9, REPORT: 10, SETTINGS: 11, UPROF: 12 };
const DB_USERS = "users";
const DB_CHATS = "chats";

export default function App() {
  const [lang, setLang] = useState("ko");
  const [scr, setScr] = useState(SC.SPLASH);
  const [hist, setHist] = useState([]);
  const [user, setUser] = useState(null);
  const [step, setStep] = useState(0);
  const [nick, setNick] = useState("");
  const [myP, setMyP] = useState([]);
  const [intP, setIntP] = useState([]);
  const [vParts, setVParts] = useState([]);
  const [vDone, setVDone] = useState(false);
  const [scans, setScans] = useState({});
  const [chatU, setChatU] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [inp, setInp] = useState("");
  const [matches, setMatches] = useState([]);
  const [liked, setLiked] = useState([]);
  const [blocked, setBlocked] = useState([]);
  const [toast, setToast] = useState("");
  const [swpI, setSwpI] = useState(0);
  const [typing, setTyping] = useState(false);
  const [repT, setRepT] = useState(null);
  const [repR, setRepR] = useState("");
  const [repDone, setRepDone] = useState(false);
  const [gFilter, setGFilter] = useState("all");
  const [showGF, setShowGF] = useState(false);
  const [photoT, setPhotoT] = useState(null);
  const [authUser, setAuthUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMode, setAuthMode] = useState("login"); // "login" | "register"
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [ageCheck1, setAgeCheck1] = useState(false);
  const [ageCheck2, setAgeCheck2] = useState(false);
  const [ageCheck3, setAgeCheck3] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editNick, setEditNick] = useState("");
  const [editMyP, setEditMyP] = useState([]);
  const [editIntP, setEditIntP] = useState([]);
  const [notifOn, setNotifOn] = useState(true);
  const [photoURLs, setPhotoURLs] = useState({});
  const [uploading, setUploading] = useState({});
  const chatEnd = useRef(null);
  const fileRefs = useRef({});

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // FCM 초기화
  useEffect(() => {
    if (!authUser) return;
    const initFCM = async () => {
      const messaging = await getMessagingInstance();
      if (!messaging) return;
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;
        const token = await getToken(messaging, { vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY });
        if (token) {
          await set(ref(db, `${DB_USERS}/${authUser.uid}/fcmToken`), token);
        }
        onMessage(messaging, (payload) => {
          const { title, body } = payload.notification || {};
          st(`🔔 ${title}: ${body}`);
        });
      } catch (e) {
        console.warn("FCM 초기화 실패:", e.message);
      }
    };
    initFCM();
  }, [authUser]);

  const t = (k) => tx(lang, k);
  const P = () => (L[lang] && L[lang].pcs) ? L[lang].pcs : L.en.pcs;
  const mc = (p) => p >= 90 ? "#4ade80" : p >= 75 ? "#fbbf24" : "#888";

  // Firebase Auth 상태 감지
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setAuthUser(fbUser);
        // DB에서 유저 프로필 불러오기
        const snap = await get(ref(db, `${DB_USERS}/${fbUser.uid}`));
        if (snap.exists()) {
          const data = snap.val();
          setNick(data.nickname || "");
          setMyP(data.myPieces || []);
          setIntP(data.intPieces || []);
          setBlocked(data.blocked || []);
          setUser(data);
          const m = USERS.filter(u => (data.intPieces || []).length > 0
            ? u.mp.some(x => (data.intPieces || []).includes(x)) || u.ip.some(x => (data.myPieces || []).includes(x))
            : true
          );
          setMatches(m.length > 0 ? m : USERS.slice(0, 5));
          setScr(SC.HOME);
        } else {
          // 프로필 없으면 → 프로필 설정 플로우로
          setStep(0);
          setScr(SC.SIGNUP);
        }
      } else {
        setAuthUser(null);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (scr === SC.SPLASH) {
      const tm = setTimeout(() => setScr(SC.LANG), 2000);
      return () => clearTimeout(tm);
    }
  }, [scr]);

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  useEffect(() => {
    if (toast) {
      const tm = setTimeout(() => setToast(""), 2500);
      return () => clearTimeout(tm);
    }
  }, [toast]);

  // Firebase 채팅 리스너
  useEffect(() => {
    if (!chatU || !authUser) return;
    const chatId = [authUser.uid, "demo_" + chatU.id].sort().join("_");
    const msgsRef = ref(db, `${DB_CHATS}/${chatId}`);
    const unsub = onValue(msgsRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const arr = Object.values(data).sort((a, b) => a.ts - b.ts);
        setMsgs(arr.map(m => ({ id: m.ts, from: m.uid === authUser.uid ? "me" : "them", text: m.text, time: m.time })));
      }
    });
    return () => unsub();
  }, [chatU, authUser]);

  const go = (s) => { setHist(h => [...h, scr]); setScr(s); };
  const back = () => { const h = [...hist]; const l = h.pop() || SC.HOME; setHist(h); setScr(l); };
  const tog = (list, set, max, p) => set(prev => prev.includes(p) ? prev.filter(x => x !== p) : prev.length < max ? [...prev, p] : prev);
  const st = (m) => setToast(m);

  const handlePhotoUpload = async (partIdx, file) => {
    if (!file || !authUser) return;
    setUploading(u => ({ ...u, [partIdx]: true }));
    try {
      const storageRef = sRef(storage, `verifications/${authUser.uid}/${partIdx}_${Date.now()}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setPhotoURLs(p => ({ ...p, [partIdx]: url }));
      startScan(partIdx);
    } catch (e) {
      st("업로드 실패: " + e.message);
    }
    setUploading(u => ({ ...u, [partIdx]: false }));
  };

  const startScan = (partIdx) => {
    setScans(s => ({ ...s, [partIdx]: "scanning" }));
    setTimeout(() => {
      const ok = Math.random() > 0.15;
      setScans(s => {
        const next = { ...s, [partIdx]: ok ? "ok" : "fail" };
        const allOk = vParts.every(p => next[p] === "ok");
        if (allOk && vParts.length >= 2) setVDone(true);
        return next;
      });
    }, 2500);
  };

  // 프로필 완성 → Firebase 저장
  const complete = async () => {
    const profile = { nickname: nick, myPieces: myP, intPieces: intP, verified: vDone, vParts, photoURLs, badge: false, createdAt: Date.now() };
    setUser(profile);
    if (authUser) {
      await set(ref(db, `${DB_USERS}/${authUser.uid}`), profile);
    }
    const m = USERS.filter(u => !blocked.includes(u.id) && (u.mp.some(x => intP.includes(x)) || u.ip.some(x => myP.includes(x))));
    setMatches(m.length > 0 ? m : USERS.slice(0, 5));
    setScr(SC.HOME);
    st("Welcome to MyPiece! 🎉");
  };

  // Firebase 이메일 회원가입
  const handleRegister = async () => {
    if (!email || !password) return;
    setAuthLoading(true);
    setAuthError("");
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged가 감지해서 처리
    } catch (e) {
      const msgs = {
        "auth/email-already-in-use": "이미 사용 중인 이메일이에요",
        "auth/weak-password": "비밀번호는 6자 이상이어야 해요",
        "auth/invalid-email": "이메일 형식이 올바르지 않아요",
      };
      setAuthError(msgs[e.code] || e.message);
    }
    setAuthLoading(false);
  };

  // Firebase 이메일 로그인
  const handleLogin = async () => {
    if (!email || !password) return;
    setAuthLoading(true);
    setAuthError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e) {
      const msgs = {
        "auth/user-not-found": "가입된 계정이 없어요",
        "auth/wrong-password": "비밀번호가 틀렸어요",
        "auth/invalid-credential": "이메일 또는 비밀번호가 틀렸어요",
        "auth/invalid-email": "이메일 형식이 올바르지 않아요",
      };
      setAuthError(msgs[e.code] || e.message);
    }
    setAuthLoading(false);
  };

  // 푸시 알림 전송
  const sendPush = async (toUid, title, body) => {
    try {
      await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toUid, title, body }),
      });
    } catch (e) { /* 알림 실패해도 앱은 계속 */ }
  };

  // 신고 저장
  const handleReport = async () => {
    if (!repR || !repT) return;
    if (authUser) {
      await set(ref(db, `reports/${repT.id}/${authUser.uid}`), { reason: repR, ts: Date.now() });
    }
    setRepDone(true);
  };

  // 차단 저장
  const handleBlock = async (userId) => {
    const newBlocked = [...blocked, userId];
    setBlocked(newBlocked);
    setMatches(p => p.filter(x => x.id !== userId));
    if (authUser) {
      await set(ref(db, `${DB_USERS}/${authUser.uid}/blocked`), newBlocked);
    }
    st(t("block") + " 완료");
    back();
  };

  // 프로필 수정 저장
  const saveProfile = async () => {
    if (editNick.length < 2) return;
    const updated = { ...user, nickname: editNick, myPieces: editMyP, intPieces: editIntP };
    setUser(updated);
    setNick(editNick); setMyP(editMyP); setIntP(editIntP);
    if (authUser) await set(ref(db, `${DB_USERS}/${authUser.uid}`), updated);
    setEditMode(false);
    st("프로필 저장 완료!");
  };

  // Firebase 로그아웃
  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setAuthUser(null);
    setNick(""); setMyP([]); setIntP([]);
    setScr(SC.LANG);
  };

  const openChat = (u) => {
    setChatU(u);
    setMsgs(u.lm ? [{ id: 1, from: "them", text: u.lm, time: "now" }] : []);
    go(SC.CHAT);
  };

  // Firebase 채팅 메시지 전송
  const sendMsg = async () => {
    if (!inp.trim()) return;
    const now = new Date();
    const h = now.getHours();
    const ts = (h % 12 || 12) + ":" + String(now.getMinutes()).padStart(2, "0") + (h >= 12 ? " PM" : " AM");
    const msgData = { text: inp, uid: authUser?.uid || "guest", time: ts, ts: Date.now() };

    if (authUser && chatU) {
      const chatId = [authUser.uid, "demo_" + chatU.id].sort().join("_");
      await push(ref(db, `${DB_CHATS}/${chatId}`), msgData);
      if (chatU.uid) sendPush(chatU.uid, `${nick || "누군가"}가 메시지를 보냈어요`, inp.slice(0, 50));
    } else {
      setMsgs(p => [...p, { id: Date.now(), from: "me", text: inp, time: ts }]);
    }
    setInp("");
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      const replies = ["Nice! 😊", "🙂", "Tell me more~", "Cool!", "❤️", "Really?", "That's interesting!"];
      const reply = replies[Math.floor(Math.random() * replies.length)];
      setMsgs(p => [...p, { id: Date.now() + 1, from: "them", text: reply, time: ts }]);
    }, 1500);
  };

  const filteredUsers = USERS.filter(u => !blocked.includes(u.id)).filter(u => gFilter === "all" || u.g === gFilter);

  // ─── 색상 테마 ───
  const A = "#e94560", AD = "#c23152", AS = "#ff6b81";
  const SF = "#0f0f17", SL = "#161622", BD = "#1c1c2e";
  const base = {
    minHeight: "100vh",
    background: "#07070b",
    fontFamily: "'Noto Sans KR', system-ui, sans-serif",
    color: "#eee",
    maxWidth: 480,
    margin: "0 auto",
    position: "relative",
    boxShadow: "0 0 60px rgba(0,0,0,0.5)"
  };
  const btnStyle = (on) => ({
    width: "100%", padding: "15px 0", border: "none", borderRadius: 14,
    background: on ? `linear-gradient(135deg,${A},${AD})` : "#333",
    color: "#fff", fontSize: 15, fontWeight: 700,
    cursor: on ? "pointer" : "not-allowed", opacity: on ? 1 : 0.4
  });
  const iB = {
    width: "100%", padding: "14px 16px", border: `1px solid ${BD}`,
    borderRadius: 12, background: SF, color: "#eee", fontSize: 15,
    outline: "none", boxSizing: "border-box"
  };
  const chip = (active, c) => ({
    padding: "10px 18px", borderRadius: 22,
    border: `1px solid ${active ? (c || A) : BD}`,
    background: active ? (c || A) + "18" : SF,
    color: active ? (c || A) : "#777",
    fontSize: 13, fontWeight: 600, cursor: "pointer"
  });

  const Toast = () => toast ? (
    <div style={{
      position: "fixed", top: 60, left: "50%", transform: "translateX(-50%)",
      zIndex: 10000, padding: "12px 24px", borderRadius: 14,
      background: "#222244ee", color: "#fff", fontSize: 13, fontWeight: 600,
      maxWidth: 340, textAlign: "center", whiteSpace: "nowrap"
    }}>{toast}</div>
  ) : null;

  const Badge = ({ has, size = 14 }) => has ? (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 3,
      fontSize: size - 2, color: "#4ade80", background: "#4ade8018",
      padding: "2px 8px", borderRadius: 8, fontWeight: 700
    }}>✓ {t("badge")}</span>
  ) : null;

  const Nav = () => (
    <div style={{
      position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
      width: "100%", maxWidth: 480, display: "flex",
      background: "#0a0a10", borderTop: `1px solid ${BD}`,
      padding: "8px 0 10px", zIndex: 100
    }}>
      {[
        { i: "🏠", l: t("home"), s: SC.HOME },
        { i: "👥", l: t("lounge"), s: SC.LOUNGE },
        { i: "💬", l: t("chat"), s: SC.HOME },
        { i: "👤", l: t("my"), s: SC.PROFILE },
      ].map((tab, i) => (
        <button key={i} onClick={() => go(tab.s)} style={{
          flex: 1, background: "none", border: "none", cursor: "pointer",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
          color: tab.s === scr ? A : "#444", fontSize: 18
        }}>
          <span>{tab.i}</span>
          <span style={{ fontSize: 9, fontWeight: 600 }}>{tab.l}</span>
        </button>
      ))}
    </div>
  );

  // ═══ SPLASH ═══
  if (scr === SC.SPLASH) return (
    <div style={{ ...base, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <Head><title>MyPiece - Find Your Piece</title></Head>
      <style>{`@keyframes pulse{0%,100%{opacity:0.8}50%{opacity:1}}`}</style>
      <div style={{
        fontSize: 52, fontWeight: 900, letterSpacing: -2,
        background: `linear-gradient(135deg,${A},${AS})`,
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        animation: "pulse 2s infinite"
      }}>MyPiece</div>
      <div style={{ color: "#555", fontSize: 13, marginTop: 8, letterSpacing: 2 }}>Find Your Piece</div>
    </div>
  );

  // ═══ 언어 선택 ═══
  if (scr === SC.LANG) return (
    <div style={{ ...base, padding: "60px 28px" }}>
      <Head><title>MyPiece - Language</title></Head>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{
          fontSize: 36, fontWeight: 900,
          background: `linear-gradient(135deg,${A},${AS})`,
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
        }}>MyPiece</div>
        <div style={{ color: "#666", fontSize: 13, marginTop: 8 }}>Select your language</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 28 }}>
        {LANGS.map(l => (
          <button key={l.code} onClick={() => setLang(l.code)} style={{
            padding: "14px 16px", borderRadius: 14,
            border: `1px solid ${lang === l.code ? A : BD}`,
            background: lang === l.code ? A + "15" : SL,
            cursor: "pointer", display: "flex", alignItems: "center", gap: 10
          }}>
            <span style={{ fontSize: 20 }}>{l.flag}</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: lang === l.code ? A : "#bbb" }}>{l.name}</span>
          </button>
        ))}
      </div>
      <button style={btnStyle(true)} onClick={() => setScr(SC.AGE)}>{t("next")}</button>
    </div>
  );

  // ═══ 나이 인증 ═══
  if (scr === SC.AGE) {
    const ageAllChecked = ageCheck1 && ageCheck2 && ageCheck3;
    const checkItem = (checked, onChange, label) => (
      <div onClick={onChange} style={{
        display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 16px",
        background: checked ? "#e9456018" : "#1c1c2e", borderRadius: 12,
        border: `1px solid ${checked ? A : "#1c1c2e"}`, cursor: "pointer", marginBottom: 10
      }}>
        <div style={{
          width: 20, height: 20, borderRadius: 6, border: `2px solid ${checked ? A : "#444"}`,
          background: checked ? A : "transparent", flexShrink: 0, marginTop: 1,
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>{checked && <span style={{ color: "#fff", fontSize: 12, fontWeight: 900 }}>✓</span>}</div>
        <span style={{ fontSize: 13, color: checked ? "#eee" : "#888", lineHeight: 1.5 }}>{label}</span>
      </div>
    );
    return (
      <div style={{ ...base, display: "flex", flexDirection: "column", padding: "60px 28px 32px" }}>
        <Head><title>MyPiece - 성인 인증</title></Head>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🔞</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 8px" }}>{t("ageTitle")}</h2>
          <p style={{ color: "#666", fontSize: 13, lineHeight: 1.6, margin: 0 }}>{t("ageDesc")}</p>
        </div>

        <div style={{ marginBottom: 28 }}>
          {checkItem(ageCheck1, () => setAgeCheck1(v => !v), "본인은 만 19세 이상임을 확인합니다.")}
          {checkItem(ageCheck2, () => setAgeCheck2(v => !v), "성인용 콘텐츠가 포함될 수 있으며, 이에 동의합니다.")}
          {checkItem(ageCheck3, () => setAgeCheck3(v => !v), "허위 정보 입력 시 발생하는 법적 책임은 본인에게 있음을 인지합니다.")}
        </div>

        <button style={btnStyle(ageAllChecked)} onClick={() => { if (ageAllChecked) setScr(SC.LOGIN); }}>
          {t("ageYes")}
        </button>
        <button onClick={() => setScr(SC.BLOCK)} style={{
          width: "100%", padding: 14, background: "none",
          border: `1px solid ${BD}`, borderRadius: 14, color: "#666",
          fontSize: 14, cursor: "pointer", marginTop: 10
        }}>{t("ageNo")}</button>
      </div>
    );
  }

  // ═══ 차단 ═══
  if (scr === SC.BLOCK) return (
    <div style={{ ...base, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 32px" }}>
      <div style={{ fontSize: 64, marginBottom: 20 }}>⛔</div>
      <h2 style={{ fontSize: 20, fontWeight: 800, textAlign: "center" }}>{t("ageBlock")}</h2>
    </div>
  );

  // ═══ 로그인 ═══
  if (scr === SC.LOGIN) return (
    <div style={{ ...base, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 32px" }}>
      <Head><title>MyPiece</title></Head>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{
          fontSize: 48, fontWeight: 900,
          background: `linear-gradient(135deg,${A},${AS})`,
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
        }}>MyPiece</div>
        <div style={{ color: "#444", fontSize: 12, marginTop: 8, letterSpacing: 4 }}>{t("slogan")}</div>
      </div>

      {/* 로그인 / 회원가입 탭 */}
      <div style={{ display: "flex", gap: 0, marginBottom: 24, borderRadius: 12, overflow: "hidden", border: `1px solid ${BD}` }}>
        {["login", "register"].map(m => (
          <button key={m} onClick={() => { setAuthMode(m); setAuthError(""); }} style={{
            flex: 1, padding: "12px 0", border: "none",
            background: authMode === m ? A : SL,
            color: authMode === m ? "#fff" : "#666",
            fontSize: 14, fontWeight: 700, cursor: "pointer"
          }}>{m === "login" ? "로그인" : "회원가입"}</button>
        ))}
      </div>

      <input style={{ ...iB, marginBottom: 12 }} type="email" placeholder="이메일" value={email} onChange={e => setEmail(e.target.value)} />
      <input style={{ ...iB, marginBottom: 8 }} type="password" placeholder="비밀번호 (6자 이상)" value={password} onChange={e => setPassword(e.target.value)}
        onKeyDown={e => e.key === "Enter" && (authMode === "login" ? handleLogin() : handleRegister())} />

      {authError && <div style={{ color: "#ef4444", fontSize: 12, marginBottom: 10, textAlign: "center" }}>{authError}</div>}

      <button style={btnStyle(!authLoading && email && password)}
        onClick={() => authMode === "login" ? handleLogin() : handleRegister()}>
        {authLoading ? "처리 중..." : authMode === "login" ? "로그인" : "회원가입"}
      </button>

      <div style={{ textAlign: "center", marginTop: 20, color: "#555", fontSize: 12 }}>
        이메일/비밀번호로 가입하면 어느 기기에서든 로그인 가능해요
      </div>
    </div>
  );

  // ═══ 회원가입 ═══
  if (scr === SC.SIGNUP) return (
    <div style={{ ...base, padding: "56px 28px 28px" }}>
      <Head><title>MyPiece - Sign Up</title></Head>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <button onClick={() => step > 0 ? setStep(step - 1) : setScr(SC.LOGIN)}
          style={{ background: "none", border: "none", color: "#666", fontSize: 14, cursor: "pointer" }}>
          ← {t("back")}
        </button>
        <button onClick={handleLogout}
          style={{ background: "none", border: "none", color: "#444", fontSize: 12, cursor: "pointer" }}>
          로그아웃
        </button>
      </div>
      <div style={{ display: "flex", gap: 5, marginBottom: 32 }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= step ? A : "#1a1a28" }} />
        ))}
      </div>

      {step === 0 && (
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 24 }}>{t("nickTitle")}</h2>
          <input style={iB} placeholder={t("nickPh")} value={nick}
            onChange={e => setNick(e.target.value)} maxLength={10} />
          <div style={{ height: 20 }} />
          <button style={btnStyle(nick.length >= 2)} onClick={() => nick.length >= 2 && setStep(1)}>
            {t("next")}
          </button>
        </div>
      )}

      {step === 1 && (
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>
            {t("myPiece")} <span style={{ color: A }}>✦</span>
          </h2>
          <p style={{ color: "#555", fontSize: 13, marginBottom: 20 }}>{t("myPieceDesc")}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {P().map((p, i) => (
              <button key={i} style={chip(myP.includes(i), A)} onClick={() => tog(myP, setMyP, 3, i)}>{p}</button>
            ))}
          </div>
          <div style={{ height: 24 }} />
          <button style={btnStyle(myP.length > 0)} onClick={() => myP.length > 0 && setStep(2)}>
            {t("next")} ({myP.length}/3)
          </button>
        </div>
      )}

      {step === 2 && (
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>
            {t("intPiece")} <span style={{ color: AS }}>♡</span>
          </h2>
          <p style={{ color: "#555", fontSize: 13, marginBottom: 20 }}>{t("intPieceDesc")}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {P().map((p, i) => (
              <button key={i} style={chip(intP.includes(i), AS)} onClick={() => tog(intP, setIntP, 3, i)}>{p}</button>
            ))}
          </div>
          <div style={{ height: 24 }} />
          <button style={btnStyle(intP.length > 0)} onClick={() => intP.length > 0 && setStep(3)}>
            {t("next")} ({intP.length}/3)
          </button>
        </div>
      )}

      {step === 3 && (
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>{t("verify")}</h2>
          <div style={{
            color: A + "99", fontSize: 12, marginBottom: 16,
            background: A + "0a", padding: "10px 14px", borderRadius: 12,
            border: `1px solid ${A}22`
          }}>{t("verifyWarn")}</div>

          <p style={{ color: "#666", fontSize: 12, marginBottom: 12 }}>인증할 피스 2개 이상 선택하세요</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
            {myP.map(i => {
              const sel = vParts.includes(i);
              return (
                <button key={i} onClick={() => {
                  setVParts(prev => sel ? prev.filter(x => x !== i) : [...prev, i]);
                  setScans(s => { const n = { ...s }; delete n[i]; return n; });
                  setVDone(false);
                }} style={{
                  padding: "10px 20px", borderRadius: 20,
                  border: `1px solid ${sel ? A : BD}`,
                  background: sel ? A + "18" : SF,
                  color: sel ? A : "#777", fontSize: 14, fontWeight: 600, cursor: "pointer"
                }}>{P()[i]} {sel ? "✓" : ""}</button>
              );
            })}
          </div>

          {vParts.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
              {vParts.map(i => {
                const s = scans[i];
                return (
                  <div key={i}>
                    <div style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>{P()[i]}</div>
                    <input type="file" accept="image/*" style={{ display: "none" }} ref={el => fileRefs.current[i] = el}
                      onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(i, f); }} />
                    <div onClick={() => !s && !uploading[i] && fileRefs.current[i]?.click()} style={{
                      border: `2px dashed ${s === "ok" ? "#4ade80" : s === "fail" ? "#ef4444" : BD}`,
                      borderRadius: 14, padding: "20px 16px", textAlign: "center",
                      cursor: s ? "default" : "pointer", position: "relative", overflow: "hidden"
                    }}>
                      {photoURLs[i] && s === "ok" && (
                        <img src={photoURLs[i]} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.15 }} />
                      )}
                      {uploading[i] && <div><div style={{ fontSize: 22 }}>⬆️</div><div style={{ color: "#888", fontSize: 12, marginTop: 6 }}>업로드 중...</div></div>}
                      {!uploading[i] && s === "scanning" && <div><div style={{ fontSize: 22 }}>🔍</div><div style={{ color: "#888", fontSize: 12, marginTop: 6 }}>{t("scanning")}</div></div>}
                      {!uploading[i] && s === "ok" && <div><div style={{ fontSize: 28, color: "#4ade80" }}>✓</div><div style={{ color: "#4ade80", fontSize: 12, fontWeight: 700, marginTop: 4 }}>{t("scanOk")}</div></div>}
                      {!uploading[i] && s === "fail" && (
                        <div>
                          <div style={{ fontSize: 28, color: "#ef4444" }}>✗</div>
                          <div style={{ color: "#ef4444", fontSize: 12, marginTop: 4 }}>{t("scanFail")}</div>
                          <button onClick={e => { e.stopPropagation(); setScans(sc => { const n = { ...sc }; delete n[i]; return n; }); setPhotoURLs(p => { const n = { ...p }; delete n[i]; return n; }); setVDone(false); }}
                            style={{ color: A, fontSize: 11, marginTop: 6, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>다시 업로드</button>
                        </div>
                      )}
                      {!uploading[i] && !s && <div><div style={{ fontSize: 28, opacity: 0.3 }}>📷</div><div style={{ color: "#555", fontSize: 12, marginTop: 6 }}>탭하여 사진 선택</div></div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {vParts.length < 2 && <div style={{ color: "#555", fontSize: 12, textAlign: "center", marginBottom: 16 }}>최소 2개 선택 필요</div>}

          <button style={btnStyle(vDone)} onClick={() => vDone && complete()}>{t("done")}</button>
          <button onClick={() => { setVDone(false); setVParts([]); setScans({}); complete(); }}
            style={{ width: "100%", padding: 12, background: "none", border: "none", color: "#444", fontSize: 13, cursor: "pointer", marginTop: 8 }}>
            {t("later")}
          </button>
        </div>
      )}
    </div>
  );

  // ═══ PC 전체화면 레이아웃 ═══
  if (isDesktop && user && [SC.HOME, SC.LOUNGE, SC.CHAT].includes(scr)) {
    const pool = filteredUsers.filter(u => u.mp.some(x => intP.includes(x)) || u.ip.some(x => myP.includes(x)));
    const m = pool[swpI % Math.max(pool.length, 1)];
    const panelStyle = { height: "100vh", overflowY: "auto", borderRight: `1px solid ${BD}` };
    return (
      <div style={{ display: "flex", width: "100vw", minHeight: "100vh", background: "#07070b", color: "#eee", fontFamily: "'Noto Sans KR', system-ui, sans-serif" }}>
        <Toast />

        {/* 좌: 디스커버 */}
        <div style={{ ...panelStyle, width: 340, flexShrink: 0, padding: "20px 20px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span style={{ fontSize: 20, fontWeight: 900, background: `linear-gradient(135deg,${A},${AS})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>MyPiece</span>
            <button onClick={() => setShowGF(!showGF)} style={{ padding: "5px 12px", borderRadius: 16, background: SL, border: `1px solid ${BD}`, color: "#aaa", fontSize: 11, cursor: "pointer" }}>
              {gFilter === "all" ? "👥" : gFilter === "F" ? "♀" : "♂"} Filter
            </button>
          </div>
          {showGF && (
            <div style={{ marginBottom: 12, padding: "10px 14px", borderRadius: 12, background: SL, border: `1px solid ${BD}`, display: "flex", gap: 6 }}>
              {[{ v: "all", l: "All" }, { v: "F", l: "♀" }, { v: "M", l: "♂" }].map(o => (
                <button key={o.v} onClick={() => { setGFilter(o.v); setShowGF(false); setSwpI(0); }}
                  style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: `1px solid ${gFilter === o.v ? A : BD}`, background: gFilter === o.v ? A+"18" : "transparent", color: gFilter === o.v ? A : "#888", fontSize: 12, cursor: "pointer" }}>{o.l}</button>
              ))}
            </div>
          )}
          <div style={{ fontSize: 11, color: "#555", textAlign: "center", marginBottom: 10 }}>{t("swipeHint")}</div>
          {m && (
            <div style={{ background: `linear-gradient(160deg,${SF},${SL})`, borderRadius: 20, border: `1px solid ${BD}`, overflow: "hidden" }}>
              <div style={{ height: 160, background: `linear-gradient(135deg,${A}20,${AD}20)`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                <div style={{ width: 72, height: 72, borderRadius: "50%", background: `linear-gradient(135deg,${A},${AD})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 700, color: "#fff" }}>{m.name[0]}</div>
                {m.on && <div style={{ position: "absolute", top: 12, right: 12, width: 10, height: 10, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 6px #4ade8066" }} />}
                <div style={{ position: "absolute", top: 12, left: 12 }}><Badge has={m.badge} /></div>
                <div style={{ position: "absolute", bottom: 12, right: 12, background: "#000a", borderRadius: 8, padding: "3px 10px" }}>
                  <span style={{ fontSize: 15, fontWeight: 900, color: mc(m.pct) }}>{m.pct}%</span>
                </div>
              </div>
              <div style={{ padding: "14px 16px" }}>
                <div style={{ fontSize: 17, fontWeight: 800 }}>{m.name} <span style={{ fontSize: 12, color: "#555", fontWeight: 400 }}>{m.age} {m.g}</span></div>
                <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>{m.region} · {m.on ? t("online") : m.la}</div>
                <p style={{ fontSize: 12, color: "#888", margin: "8px 0", lineHeight: 1.5 }}>{m.bio}</p>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 12 }}>
                  {m.mp.map(i => <span key={"m"+i} style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, background: A+"18", color: A }}>✦ {P()[i]}</span>)}
                  {m.ip.map(i => <span key={"i"+i} style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, background: AS+"18", color: AS }}>♡ {P()[i]}</span>)}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setSwpI(i => i + 1)} style={{ width: 44, height: 44, borderRadius: "50%", background: SL, border: `2px solid ${BD}`, color: "#666", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                  <button onClick={() => { setLiked(p => p.includes(m.id) ? p : [...p, m.id]); st("♡ " + t("like") + "!"); setSwpI(i => i + 1); }}
                    style={{ flex: 1, height: 44, borderRadius: 22, background: `linear-gradient(135deg,${AS},${A})`, border: "none", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                    {liked.includes(m.id) ? "♥" : "♡"} {t("like")}
                  </button>
                  <button onClick={() => { setChatU(m); setMsgs(m.lm ? [{ id: 1, from: "them", text: m.lm, time: "now" }] : []); }}
                    style={{ width: 44, height: 44, borderRadius: "50%", background: `linear-gradient(135deg,${A},${AD})`, border: "none", color: "#fff", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>💬</button>
                </div>
              </div>
            </div>
          )}

          {/* 온라인 NOW */}
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#555", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80", display: "inline-block", boxShadow: "0 0 6px #4ade8099" }} />
              지금 온라인
            </div>
            <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 6 }}>
              {USERS.filter(u => u.on).map(u => (
                <div key={u.id} onClick={() => { setChatU(u); setMsgs(u.lm ? [{ id: 1, from: "them", text: u.lm, time: "now" }] : []); }}
                  style={{ flexShrink: 0, textAlign: "center", cursor: "pointer" }}>
                  <div style={{ position: "relative", width: 46, height: 46, margin: "0 auto 4px" }}>
                    <div style={{ width: 46, height: 46, borderRadius: "50%", background: `linear-gradient(135deg,${A},${AD})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "#fff", border: `2px solid ${A}` }}>{u.name[0]}</div>
                    <div style={{ position: "absolute", bottom: 1, right: 1, width: 10, height: 10, borderRadius: "50%", background: "#4ade80", border: "2px solid #07070b" }} />
                  </div>
                  <div style={{ fontSize: 10, color: "#888", maxWidth: 46, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 매칭 통계 */}
          <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              { label: "좋아요", value: liked.length, icon: "♡", color: A },
              { label: "매칭", value: matches.length, icon: "✦", color: "#fbbf24" },
              { label: "방문자", value: 24, icon: "👁", color: "#60a5fa" },
              { label: "매칭률", value: "78%", icon: "📊", color: "#4ade80" },
            ].map(stat => (
              <div key={stat.label} style={{ background: SL, borderRadius: 12, padding: "12px 14px", border: `1px solid ${BD}` }}>
                <div style={{ fontSize: 18, marginBottom: 4 }}>{stat.icon}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: stat.color }}>{stat.value}</div>
                <div style={{ fontSize: 10, color: "#555", marginTop: 2 }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* 최근 좋아요 */}
          {liked.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#555", marginBottom: 10 }}>내가 좋아요한 사람</div>
              {USERS.filter(u => liked.includes(u.id)).map(u => (
                <div key={u.id} onClick={() => { setChatU(u); setMsgs(u.lm ? [{ id: 1, from: "them", text: u.lm, time: "now" }] : []); }}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${BD}`, cursor: "pointer" }}>
                  <div style={{ width: 34, height: 34, borderRadius: "50%", background: `linear-gradient(135deg,${A},${AD})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{u.name[0]}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{u.name}</div>
                    <div style={{ fontSize: 10, color: "#555" }}>{u.region} · {u.pct}% 매칭</div>
                  </div>
                  <span style={{ color: A, fontSize: 14 }}>♥</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 중: 라운지 */}
        <div style={{ ...panelStyle, flex: 1, padding: "20px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 4px" }}>{t("lounge")}</h2>
              <p style={{ fontSize: 11, color: "#555", margin: 0 }}>Browse profiles</p>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {[{ v: "all", l: "ALL" }, { v: "F", l: "♀" }, { v: "M", l: "♂" }].map(o => (
                <button key={o.v} onClick={() => { setGFilter(o.v); setSwpI(0); }}
                  style={{ padding: "5px 12px", borderRadius: 16, border: `1px solid ${gFilter === o.v ? A : BD}`, background: gFilter === o.v ? A+"18" : "transparent", color: gFilter === o.v ? A : "#666", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>{o.l}</button>
              ))}
            </div>
          </div>

          {/* 인기 피스 태그 */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
            {P().slice(0, 8).map((p, i) => (
              <span key={i} style={{ padding: "4px 10px", borderRadius: 20, background: intP.includes(i) ? A+"22" : SF, border: `1px solid ${intP.includes(i) ? A : BD}`, color: intP.includes(i) ? A : "#666", fontSize: 11, cursor: "pointer" }}>#{p}</span>
            ))}
          </div>

          {/* 유저 그리드 */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
            {filteredUsers.map(u => (
              <div key={u.id} onClick={() => { setPhotoT(u); setScr(SC.UPROF); }}
                style={{ borderRadius: 14, background: SL, border: `1px solid ${BD}`, cursor: "pointer", overflow: "hidden" }}>
                <div style={{ height: 90, background: `linear-gradient(135deg,${A}15,${AD}15)`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: u.v ? `linear-gradient(135deg,${A},${AD})` : "#2a2a3a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "#fff" }}>{u.name[0]}</div>
                  {u.on && <div style={{ position: "absolute", top: 6, right: 6, width: 8, height: 8, borderRadius: "50%", background: "#4ade80" }} />}
                  {u.badge && <div style={{ position: "absolute", top: 6, left: 6, fontSize: 8, color: "#4ade80", background: "#4ade8018", padding: "1px 5px", borderRadius: 5 }}>✓</div>}
                  <div style={{ position: "absolute", bottom: 6, right: 6, fontSize: 11, fontWeight: 800, color: mc(u.pct) }}>{u.pct}%</div>
                </div>
                <div style={{ padding: "8px 10px" }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{u.name} <span style={{ fontSize: 10, color: "#555" }}>{u.age}</span></div>
                  <div style={{ fontSize: 10, color: "#555", marginTop: 1 }}>{u.region}</div>
                  <div style={{ display: "flex", gap: 3, marginTop: 5, flexWrap: "wrap" }}>
                    {u.mp.slice(0, 2).map(i => <span key={i} style={{ fontSize: 8, padding: "1px 5px", borderRadius: 4, background: A+"18", color: A }}>{P()[i]}</span>)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 나를 봤을 수도 있는 사람 (블러 프리미엄) */}
          <div style={{ marginTop: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#555" }}>👁 나를 본 사람</div>
              <span style={{ fontSize: 10, color: "#555" }}>클릭해서 프로필 보기</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {USERS.slice(0, 4).map(u => (
                <div key={u.id} onClick={() => { setPhotoT(u); setScr(SC.UPROF); }} style={{ flexShrink: 0, textAlign: "center", cursor: "pointer" }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: `linear-gradient(135deg,${A},${AD})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: "#fff", margin: "0 auto 4px", filter: "blur(5px)", transition: "filter 0.2s" }}
                    onMouseEnter={e => e.currentTarget.style.filter = "none"}
                    onMouseLeave={e => e.currentTarget.style.filter = "blur(5px)"}
                  >{u.name[0]}</div>
                  <div style={{ fontSize: 9, color: "#444" }}>?</div>
                </div>
              ))}
            </div>
          </div>

          {/* 추천 매치 */}
          <div style={{ marginTop: 24, marginBottom: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#555", marginBottom: 10 }}>✦ 추천 매치</div>
            {USERS.filter(u => u.pct >= 80).map(u => (
              <div key={u.id} onClick={() => { setPhotoT(u); setScr(SC.UPROF); }}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 12, background: SL, border: `1px solid ${BD}`, marginBottom: 8, cursor: "pointer" }}>
                <div style={{ width: 42, height: 42, borderRadius: "50%", background: `linear-gradient(135deg,${A},${AD})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, color: "#fff", flexShrink: 0, position: "relative" }}>
                  {u.name[0]}
                  {u.on && <div style={{ position: "absolute", bottom: 0, right: 0, width: 10, height: 10, borderRadius: "50%", background: "#4ade80", border: "2px solid #1c1c2e" }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{u.name} <span style={{ fontSize: 10, color: "#555" }}>{u.age} {u.g}</span></div>
                  <div style={{ fontSize: 11, color: "#777", marginTop: 2 }}>{u.bio}</div>
                </div>
                <div style={{ fontSize: 15, fontWeight: 900, color: mc(u.pct) }}>{u.pct}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* 우: 채팅 */}
        <div style={{ ...panelStyle, width: 340, flexShrink: 0, borderRight: "none", display: "flex", flexDirection: "column" }}>
          {!chatU ? (
            <div style={{ padding: "20px 20px" }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 14px" }}>{t("chat")}</h2>
              {matches.filter(u => u.lm).map(u => (
                <div key={u.id} onClick={() => { setChatU(u); setMsgs(u.lm ? [{ id: 1, from: "them", text: u.lm, time: "now" }] : []); }}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: `1px solid ${BD}`, cursor: "pointer" }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: `linear-gradient(135deg,${A},${AD})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#fff", flexShrink: 0, position: "relative" }}>
                    {u.name[0]}
                    {u.on && <div style={{ position: "absolute", bottom: 0, right: 0, width: 10, height: 10, borderRadius: "50%", background: "#4ade80", border: "2px solid #07070b" }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontWeight: 700, fontSize: 13 }}>{u.name} {u.badge && <span style={{ color: "#4ade80", fontSize: 10 }}>✓</span>}</span>
                      <span style={{ fontSize: 10, color: "#444" }}>{u.la}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "#555", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.lm}</div>
                  </div>
                </div>
              ))}
              {matches.filter(u => u.lm).length === 0 && (
                <div style={{ textAlign: "center", color: "#444", fontSize: 13, marginTop: 40 }}>아직 채팅이 없어요</div>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
              <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, borderBottom: `1px solid ${BD}`, background: "#0a0a10" }}>
                <button onClick={() => setChatU(null)} style={{ background: "none", border: "none", color: "#666", fontSize: 18, cursor: "pointer" }}>←</button>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg,${A},${AD})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff" }}>{chatU.name[0]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{chatU.name}</div>
                  <div style={{ fontSize: 10, color: chatU.on ? "#4ade80" : "#555" }}>{chatU.on ? t("online") : t("offline")}</div>
                </div>
                <button onClick={() => { setRepT(chatU); setRepDone(false); setRepR(""); go(SC.REPORT); }}
                  style={{ background: SL, border: `1px solid ${BD}`, borderRadius: 8, padding: "4px 10px", color: "#555", fontSize: 12, cursor: "pointer" }}>···</button>
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ textAlign: "center", padding: "4px 12px", borderRadius: 8, background: SF, color: "#444", fontSize: 10, alignSelf: "center", marginBottom: 4 }}>MyPiece Match · {chatU.pct}%</div>
                {msgs.map(msg => (
                  <div key={msg.id} style={{ alignSelf: msg.from === "me" ? "flex-end" : "flex-start", maxWidth: "78%" }}>
                    <div style={{ padding: "9px 14px", borderRadius: 18, background: msg.from === "me" ? `linear-gradient(135deg,${A},${AD})` : SL, color: "#fff", fontSize: 13, lineHeight: 1.5, borderBottomRightRadius: msg.from === "me" ? 4 : 18, borderBottomLeftRadius: msg.from === "me" ? 18 : 4 }}>{msg.text}</div>
                    <div style={{ fontSize: 9, color: "#333", marginTop: 1, textAlign: msg.from === "me" ? "right" : "left" }}>{msg.time}</div>
                  </div>
                ))}
                {typing && (
                  <div style={{ alignSelf: "flex-start", padding: "10px 14px", borderRadius: 18, background: SL, borderBottomLeftRadius: 4 }}>
                    <div style={{ display: "flex", gap: 3 }}>
                      {[0,1,2].map(i => <div key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: "#555", animation: `td 1s ${i*0.2}s infinite` }} />)}
                    </div>
                  </div>
                )}
                <div ref={chatEnd} />
              </div>
              <div style={{ padding: "8px 12px", display: "flex", gap: 6, alignItems: "center", borderTop: `1px solid ${BD}`, background: "#0a0a10" }}>
                <input style={{ flex: 1, padding: "10px 16px", borderRadius: 20, background: SF, border: `1px solid ${BD}`, color: "#eee", fontSize: 13, outline: "none" }}
                  placeholder={t("msgPh")} value={inp} onChange={e => setInp(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMsg()} />
                <button onClick={sendMsg} style={{ width: 38, height: 38, borderRadius: "50%", background: inp.trim() ? `linear-gradient(135deg,${A},${AD})` : SL, border: "none", color: "#fff", fontSize: 17, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>↑</button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ═══ HOME — 스와이프 디스커버 ═══
  if (scr === SC.HOME) {
    const pool = filteredUsers.filter(u => u.mp.some(x => intP.includes(x)) || u.ip.some(x => myP.includes(x)));
    const m = pool[swpI % Math.max(pool.length, 1)];
    return (
      <div style={{ ...base, paddingBottom: 72 }}>
        <Head><title>MyPiece - Discover</title></Head>
        <Toast />
        <div style={{ padding: "16px 24px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{
            fontSize: 24, fontWeight: 900,
            background: `linear-gradient(135deg,${A},${AS})`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
          }}>MyPiece</span>
          <button onClick={() => setShowGF(!showGF)} style={{
            padding: "6px 14px", borderRadius: 20, background: SL,
            border: `1px solid ${BD}`, color: "#aaa", fontSize: 12, cursor: "pointer"
          }}>
            {gFilter === "all" ? "👥" : gFilter === "F" ? "♀" : "♂"} Filter
          </button>
        </div>

        {showGF && (
          <div style={{ margin: "0 24px 12px", padding: "12px 16px", borderRadius: 14, background: SL, border: `1px solid ${BD}`, display: "flex", gap: 8 }}>
            {[{ v: "all", l: "All" }, { v: "F", l: "♀ Female" }, { v: "M", l: "♂ Male" }].map(o => (
              <button key={o.v} onClick={() => { setGFilter(o.v); setShowGF(false); setSwpI(0); }}
                style={{
                  flex: 1, padding: "10px 0", borderRadius: 10,
                  border: `1px solid ${gFilter === o.v ? A : BD}`,
                  background: gFilter === o.v ? A + "18" : "transparent",
                  color: gFilter === o.v ? A : "#888", fontSize: 13, fontWeight: 600, cursor: "pointer"
                }}>{o.l}</button>
            ))}
          </div>
        )}

        <div style={{ padding: "0 24px" }}>
          <div style={{ fontSize: 12, color: "#555", textAlign: "center", marginBottom: 12 }}>{t("swipeHint")}</div>
          {m && (
            <div style={{
              background: `linear-gradient(160deg,${SF},${SL})`,
              borderRadius: 24, border: `1px solid ${BD}`, overflow: "hidden"
            }}>
              <div style={{
                height: 200, background: `linear-gradient(135deg,${A}20,${AD}20)`,
                display: "flex", alignItems: "center", justifyContent: "center", position: "relative"
              }}>
                <div style={{
                  width: 90, height: 90, borderRadius: "50%",
                  background: `linear-gradient(135deg,${A},${AD})`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 36, fontWeight: 700, color: "#fff"
                }}>{m.name[0]}</div>
                {m.on && (
                  <div style={{
                    position: "absolute", top: 16, right: 16,
                    width: 12, height: 12, borderRadius: "50%",
                    background: "#4ade80", boxShadow: "0 0 8px #4ade8066"
                  }} />
                )}
                <div style={{ position: "absolute", top: 16, left: 16 }}>
                  <Badge has={m.badge} />
                </div>
                <div style={{
                  position: "absolute", bottom: 16, right: 16,
                  background: "#000a", borderRadius: 10, padding: "4px 12px"
                }}>
                  <span style={{ fontSize: 18, fontWeight: 900, color: mc(m.pct) }}>{m.pct}%</span>
                </div>
              </div>
              <div style={{ padding: "16px 20px" }}>
                <div style={{ fontSize: 20, fontWeight: 800 }}>
                  {m.name} <span style={{ fontSize: 14, color: "#555", fontWeight: 400 }}>{m.age} {m.g}</span>
                </div>
                <div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>
                  {m.region} · {m.on ? t("online") : m.la}
                </div>
                <p style={{ fontSize: 13, color: "#999", margin: "10px 0", lineHeight: 1.5 }}>{m.bio}</p>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
                  {m.mp.map(i => (
                    <span key={"m"+i} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 8, background: A+"18", color: A }}>✦ {P()[i]}</span>
                  ))}
                  {m.ip.map(i => (
                    <span key={"i"+i} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 8, background: AS+"18", color: AS }}>♡ {P()[i]}</span>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => setSwpI(i => i + 1)} style={{
                    width: 54, height: 54, borderRadius: "50%", background: SL,
                    border: `2px solid ${BD}`, color: "#666", fontSize: 24,
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
                  }}>✕</button>
                  <button onClick={() => {
                    setLiked(p => p.includes(m.id) ? p : [...p, m.id]);
                    st("♡ " + t("like") + "!");
                    setSwpI(i => i + 1);
                  }} style={{
                    flex: 1, height: 54, borderRadius: 27,
                    background: `linear-gradient(135deg,${AS},${A})`,
                    border: "none", color: "#fff", fontSize: 16, fontWeight: 700,
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6
                  }}>
                    {liked.includes(m.id) ? "♥" : "♡"} {t("like")}
                  </button>
                  <button onClick={() => openChat(m)} style={{
                    width: 54, height: 54, borderRadius: "50%",
                    background: `linear-gradient(135deg,${A},${AD})`,
                    border: "none", color: "#fff", fontSize: 22,
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
                  }}>💬</button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: "20px 24px" }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: "#555" }}>{t("chat")}</h3>
          {matches.filter(u => u.lm).slice(0, 4).map(u => (
            <div key={u.id} onClick={() => openChat(u)} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "10px 0", borderBottom: `1px solid ${BD}`, cursor: "pointer"
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: "50%",
                background: `linear-gradient(135deg,${A},${AD})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, fontWeight: 700, color: "#fff", position: "relative", flexShrink: 0
              }}>
                {u.name[0]}
                {u.on && (
                  <div style={{
                    position: "absolute", bottom: 0, right: 0,
                    width: 11, height: 11, borderRadius: "50%",
                    background: "#4ade80", border: "2px solid #07070b"
                  }} />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>
                    {u.name} {u.badge && <span style={{ color: "#4ade80", fontSize: 10 }}>✓</span>}
                  </span>
                  <span style={{ fontSize: 11, color: "#444" }}>{u.la}</span>
                </div>
                <div style={{ fontSize: 12, color: "#555", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.lm}</div>
              </div>
            </div>
          ))}
        </div>
        <Nav />
      </div>
    );
  }

  // ═══ 채팅 ═══
  if (scr === SC.CHAT && chatU) return (
    <div style={{ ...base, display: "flex", flexDirection: "column", height: "100vh" }}>
      <Head><title>MyPiece - Chat</title></Head>
      <Toast />
      <div style={{
        padding: "12px 16px", display: "flex", alignItems: "center", gap: 12,
        borderBottom: `1px solid ${BD}`, background: "#0a0a10"
      }}>
        <button onClick={back} style={{ background: "none", border: "none", color: "#666", fontSize: 22, cursor: "pointer" }}>←</button>
        <div onClick={() => { setPhotoT(chatU); go(SC.UPROF); }}
          style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, cursor: "pointer" }}>
          <div style={{
            width: 38, height: 38, borderRadius: "50%",
            background: `linear-gradient(135deg,${A},${AD})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 700, color: "#fff"
          }}>{chatU.name[0]}</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>
              {chatU.name} {chatU.badge && <span style={{ color: "#4ade80", fontSize: 10 }}>✓</span>}
            </div>
            <div style={{ fontSize: 10, color: chatU.on ? "#4ade80" : "#555" }}>
              {chatU.on ? t("online") : t("offline")}
            </div>
          </div>
        </div>
        <button onClick={() => { setRepT(chatU); setRepDone(false); setRepR(""); go(SC.REPORT); }}
          style={{ background: SL, border: `1px solid ${BD}`, borderRadius: 10, padding: "6px 12px", color: "#555", fontSize: 13, cursor: "pointer" }}>
          ···
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{
          textAlign: "center", padding: "6px 14px", borderRadius: 10,
          background: SF, color: "#444", fontSize: 11, alignSelf: "center", marginBottom: 6
        }}>MyPiece Match · {chatU.pct}%</div>
        {msgs.map(msg => (
          <div key={msg.id} style={{ alignSelf: msg.from === "me" ? "flex-end" : "flex-start", maxWidth: "78%" }}>
            <div style={{
              padding: "10px 16px", borderRadius: 20,
              background: msg.from === "me" ? `linear-gradient(135deg,${A},${AD})` : SL,
              color: "#fff", fontSize: 14, lineHeight: 1.5,
              borderBottomRightRadius: msg.from === "me" ? 6 : 20,
              borderBottomLeftRadius: msg.from === "me" ? 20 : 6
            }}>{msg.text}</div>
            <div style={{ fontSize: 10, color: "#333", marginTop: 2, textAlign: msg.from === "me" ? "right" : "left" }}>{msg.time}</div>
          </div>
        ))}
        {typing && (
          <div style={{ alignSelf: "flex-start", padding: "12px 16px", borderRadius: 20, background: SL, borderBottomLeftRadius: 6 }}>
            <div style={{ display: "flex", gap: 4 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#555", animation: `td 1s ${i * 0.2}s infinite` }} />
              ))}
            </div>
            <style>{`@keyframes td{0%,100%{opacity:0.3}50%{opacity:1}}`}</style>
          </div>
        )}
        <div ref={chatEnd} />
      </div>

      <div style={{ padding: "10px 14px", display: "flex", gap: 8, alignItems: "center", borderTop: `1px solid ${BD}`, background: "#0a0a10" }}>
        <input
          style={{ flex: 1, padding: "12px 18px", borderRadius: 24, background: SF, border: `1px solid ${BD}`, color: "#eee", fontSize: 14, outline: "none" }}
          placeholder={t("msgPh")}
          value={inp}
          onChange={e => setInp(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMsg()}
        />
        <button onClick={sendMsg} style={{
          width: 44, height: 44, borderRadius: "50%",
          background: inp.trim() ? `linear-gradient(135deg,${A},${AD})` : SL,
          border: "none", color: "#fff", fontSize: 20,
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
        }}>↑</button>
      </div>
    </div>
  );

  // ═══ 라운지 ═══
  if (scr === SC.LOUNGE) return (
    <div style={{ ...base, paddingBottom: 72 }}>
      <Head><title>MyPiece - Lounge</title></Head>
      <Toast />
      <div style={{ padding: "20px 24px 12px" }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>{t("lounge")}</h2>
        <p style={{ fontSize: 12, color: "#555", marginTop: 4 }}>Browse profiles</p>
      </div>
      <div style={{ padding: "0 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {filteredUsers.map(u => (
            <div key={u.id} onClick={() => { setPhotoT(u); go(SC.UPROF); }}
              style={{ borderRadius: 16, background: SL, border: `1px solid ${BD}`, cursor: "pointer", overflow: "hidden" }}>
              <div style={{
                height: 110, background: `linear-gradient(135deg,${A}15,${AD}15)`,
                display: "flex", alignItems: "center", justifyContent: "center", position: "relative"
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: "50%",
                  background: u.v ? `linear-gradient(135deg,${A},${AD})` : "#2a2a3a",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20, fontWeight: 700, color: "#fff"
                }}>{u.name[0]}</div>
                {u.on && <div style={{ position: "absolute", top: 8, right: 8, width: 9, height: 9, borderRadius: "50%", background: "#4ade80" }} />}
                {u.badge && <div style={{ position: "absolute", top: 8, left: 8, fontSize: 9, color: "#4ade80", background: "#4ade8018", padding: "2px 6px", borderRadius: 6 }}>✓</div>}
                <div style={{ position: "absolute", bottom: 8, right: 8, fontSize: 12, fontWeight: 800, color: mc(u.pct) }}>{u.pct}%</div>
              </div>
              <div style={{ padding: "10px 12px" }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{u.name} <span style={{ fontSize: 11, color: "#555" }}>{u.age}</span></div>
                <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>{u.region}</div>
                <div style={{ display: "flex", gap: 3, marginTop: 6, flexWrap: "wrap" }}>
                  {u.mp.slice(0, 2).map(i => (
                    <span key={i} style={{ fontSize: 9, padding: "2px 6px", borderRadius: 6, background: A+"18", color: A }}>{P()[i]}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Nav />
    </div>
  );

  // ═══ 유저 프로필 ═══
  if (scr === SC.UPROF && photoT) {
    const u = photoT;
    return (
      <div style={{ ...base, padding: "56px 28px" }}>
        <button onClick={back} style={{ background: "none", border: "none", color: "#666", fontSize: 14, cursor: "pointer", marginBottom: 20 }}>
          ← {t("back")}
        </button>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{
            width: 88, height: 88, borderRadius: "50%", margin: "0 auto 16px",
            background: `linear-gradient(135deg,${A},${AD})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 32, fontWeight: 700, color: "#fff"
          }}>{u.name[0]}</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>
            {u.name} <span style={{ fontSize: 14, color: "#555" }}>{u.age} {u.g}</span>
          </h2>
          <div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>{u.region} · {u.on ? t("online") : u.la}</div>
          <div style={{ marginTop: 8 }}><Badge has={u.badge} size={14} /></div>
          {u.v && <div style={{ fontSize: 12, color: A, marginTop: 4 }}>✓ {P()[u.vp]} {t("verified")}</div>}
        </div>
        <div style={{ background: SL, borderRadius: 14, padding: 16, marginBottom: 12, border: `1px solid ${BD}` }}>
          <div style={{ fontSize: 14, color: "#bbb", lineHeight: 1.6 }}>{u.bio}</div>
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <div style={{ flex: 1, background: SF, borderRadius: 14, padding: 12 }}>
            <div style={{ fontSize: 11, color: "#555", marginBottom: 6 }}>✦ {t("myPiece")}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {u.mp.map(i => <span key={i} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 8, background: A+"18", color: A }}>{P()[i]}</span>)}
            </div>
          </div>
          <div style={{ flex: 1, background: SF, borderRadius: 14, padding: 12 }}>
            <div style={{ fontSize: 11, color: "#555", marginBottom: 6 }}>♡ {t("intPiece")}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {u.ip.map(i => <span key={i} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 8, background: AS+"18", color: AS }}>{P()[i]}</span>)}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <button onClick={() => { setLiked(p => p.includes(u.id) ? p : [...p, u.id]); st(t("like") + "!"); }}
            style={{ flex: 1, padding: "14px 0", borderRadius: 14, background: AS+"15", border: `1px solid ${AS}33`, color: AS, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
            {liked.includes(u.id) ? "♥" : "♡"} {t("like")}
          </button>
          <button onClick={() => openChat(u)}
            style={{ flex: 1, padding: "14px 0", borderRadius: 14, background: `linear-gradient(135deg,${A},${AD})`, border: "none", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
            {t("startChat")}
          </button>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => { setRepT(u); setRepDone(false); setRepR(""); go(SC.REPORT); }}
            style={{ flex: 1, padding: 12, borderRadius: 12, background: "transparent", border: `1px solid ${BD}`, color: "#555", fontSize: 13, cursor: "pointer" }}>
            {t("report")}
          </button>
          <button onClick={() => handleBlock(u.id)}
            style={{ flex: 1, padding: 12, borderRadius: 12, background: "transparent", border: `1px solid ${BD}`, color: "#555", fontSize: 13, cursor: "pointer" }}>
            {t("block")}
          </button>
        </div>
      </div>
    );
  }

  // ═══ 신고 ═══
  if (scr === SC.REPORT) return (
    <div style={{ ...base, padding: "56px 28px" }}>
      <button onClick={back} style={{ background: "none", border: "none", color: "#666", fontSize: 14, cursor: "pointer", marginBottom: 20 }}>← {t("back")}</button>
      {repDone ? (
        <div style={{ textAlign: "center", paddingTop: 40 }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>✓</div>
          <h2 style={{ fontSize: 20, fontWeight: 800 }}>{t("reported")}</h2>
          <button onClick={back} style={{ ...btnStyle(true), marginTop: 24 }}>{t("back")}</button>
        </div>
      ) : (
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20 }}>{t("report")}</h2>
          {(L[lang]?.reportReasons || L.en.reportReasons).map(r => (
            <button key={r} onClick={() => setRepR(r)} style={{
              width: "100%", padding: "14px 16px", borderRadius: 12, marginBottom: 8, textAlign: "left",
              background: repR === r ? A+"15" : SL, border: `1px solid ${repR === r ? A : BD}`,
              color: repR === r ? A : "#bbb", fontSize: 14, cursor: "pointer"
            }}>{r}</button>
          ))}
          <button style={btnStyle(!!repR)} onClick={() => repR && handleReport()}>{t("report")}</button>
        </div>
      )}
    </div>
  );

  // ═══ 설정 ═══
  if (scr === SC.SETTINGS) return (
    <div style={{ ...base, padding: "56px 28px", paddingBottom: 80 }}>
      <button onClick={back} style={{ background: "none", border: "none", color: "#666", fontSize: 14, cursor: "pointer", marginBottom: 20 }}>← {t("back")}</button>
      <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 24 }}>{t("settings")}</h2>

      {/* 알림 */}
      <div style={{ background: SF, borderRadius: 16, padding: "4px 0", marginBottom: 12 }}>
        <div style={{ padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${BD}` }}>
          <span style={{ fontSize: 14, color: "#bbb" }}>🔔 알림</span>
          <div onClick={() => setNotifOn(v => !v)} style={{
            width: 44, height: 24, borderRadius: 12, background: notifOn ? A : "#333",
            position: "relative", cursor: "pointer", transition: "background 0.2s"
          }}>
            <div style={{ position: "absolute", top: 2, left: notifOn ? 22 : 2, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
          </div>
        </div>
        <div style={{ padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 14, color: "#bbb" }}>🚫 차단 목록 ({blocked.length}명)</span>
          {blocked.length > 0 && (
            <button onClick={() => { setBlocked([]); if (authUser) set(ref(db, `${DB_USERS}/${authUser.uid}/blocked`), []); st("차단 목록 초기화"); }}
              style={{ fontSize: 12, color: "#ef4444", background: "none", border: "none", cursor: "pointer" }}>전체 해제</button>
          )}
        </div>
      </div>

      {/* 언어 */}
      <div style={{ background: SF, borderRadius: 16, padding: 20, marginBottom: 12 }}>
        <div style={{ fontSize: 13, color: "#666", fontWeight: 600, marginBottom: 14 }}>{t("lang")}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {LANGS.map(l => (
            <button key={l.code} onClick={() => setLang(l.code)} style={{
              padding: "10px 12px", borderRadius: 12,
              border: `1px solid ${lang === l.code ? A : BD}`,
              background: lang === l.code ? A+"15" : SL,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 8
            }}>
              <span style={{ fontSize: 18 }}>{l.flag}</span>
              <span style={{ fontSize: 13, color: lang === l.code ? A : "#bbb" }}>{l.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 계정 */}
      <div style={{ background: SF, borderRadius: 16, padding: "4px 0" }}>
        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${BD}` }}>
          <span style={{ fontSize: 13, color: "#555" }}>이메일</span>
          <div style={{ fontSize: 14, color: "#bbb", marginTop: 2 }}>{authUser?.email || "-"}</div>
        </div>
        <div onClick={() => { if (confirm("정말 탈퇴하시겠어요?")) handleLogout(); }}
          style={{ padding: "14px 20px", cursor: "pointer" }}>
          <span style={{ fontSize: 14, color: "#ef4444" }}>회원 탈퇴</span>
        </div>
      </div>
    </div>
  );

  // ═══ 내 프로필 ═══
  if (scr === SC.PROFILE) return (
    <div style={{ ...base, padding: "56px 28px", paddingBottom: 80 }}>
      <Head><title>MyPiece - Profile</title></Head>
      <Toast />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div style={{ textAlign: "center", flex: 1 }}>
          <div style={{
            width: 88, height: 88, borderRadius: "50%", margin: "0 auto 12px",
            background: `linear-gradient(135deg,${A},${AD})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 32, fontWeight: 700, color: "#fff"
          }}>{user?.nickname?.[0] || "?"}</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>{user?.nickname || "User"}</h2>
          {user?.verified && <div style={{ fontSize: 12, color: A, marginTop: 4 }}>✓ {(user.vParts || []).map(i => P()[i]).join(", ")} {t("verified")}</div>}
        </div>
        <button onClick={() => { setEditMode(true); setEditNick(user?.nickname || ""); setEditMyP(user?.myPieces || []); setEditIntP(user?.intPieces || []); }}
          style={{ position: "absolute", right: 28, top: 60, background: SL, border: `1px solid ${BD}`, borderRadius: 10, padding: "6px 14px", color: "#888", fontSize: 13, cursor: "pointer" }}>
          수정
        </button>
      </div>

      {editMode ? (
        <div style={{ background: SF, borderRadius: 16, padding: 20, marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: "#666", marginBottom: 8 }}>닉네임</div>
          <input style={{ ...iB, marginBottom: 16 }} value={editNick} onChange={e => setEditNick(e.target.value)} maxLength={10} placeholder="닉네임 (2~10자)" />

          <div style={{ fontSize: 13, color: "#666", marginBottom: 8 }}>✦ 자신있는 피스 (최대 3개)</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
            {P().map((p, i) => (
              <button key={i} style={chip(editMyP.includes(i), A)} onClick={() => setEditMyP(prev => prev.includes(i) ? prev.filter(x => x !== i) : prev.length < 3 ? [...prev, i] : prev)}>{p}</button>
            ))}
          </div>

          <div style={{ fontSize: 13, color: "#666", marginBottom: 8 }}>♡ 관심있는 피스 (최대 3개)</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
            {P().map((p, i) => (
              <button key={i} style={chip(editIntP.includes(i), AS)} onClick={() => setEditIntP(prev => prev.includes(i) ? prev.filter(x => x !== i) : prev.length < 3 ? [...prev, i] : prev)}>{p}</button>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button style={btnStyle(editNick.length >= 2)} onClick={saveProfile}>저장</button>
            <button onClick={() => setEditMode(false)} style={{ flex: 1, padding: 14, borderRadius: 14, background: "none", border: `1px solid ${BD}`, color: "#666", fontSize: 14, cursor: "pointer" }}>취소</button>
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <div style={{ flex: 1, background: SF, borderRadius: 14, padding: 12 }}>
              <div style={{ fontSize: 11, color: "#555", marginBottom: 6 }}>✦ {t("myPiece")}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {user?.myPieces?.map(i => <span key={i} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 8, background: A+"18", color: A }}>{P()[i]}</span>)}
              </div>
            </div>
            <div style={{ flex: 1, background: SF, borderRadius: 14, padding: 12 }}>
              <div style={{ fontSize: 11, color: "#555", marginBottom: 6 }}>♡ {t("intPiece")}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {user?.intPieces?.map(i => <span key={i} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 8, background: AS+"18", color: AS }}>{P()[i]}</span>)}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {[
              { n: liked.length, l: "Likes", c: AS },
              { n: matches.length, l: "Match", c: "#4ade80" }
            ].map((s, i) => (
              <div key={i} style={{ flex: 1, background: SF, borderRadius: 14, padding: "14px 8px", textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.c }}>{s.n}</div>
                <div style={{ fontSize: 10, color: "#555", marginTop: 2 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </>
      )}

      <div style={{ background: SF, borderRadius: 16, overflow: "hidden" }}>
        {[
          { l: t("settings"), a: () => go(SC.SETTINGS) },
          { l: t("logout"), a: handleLogout },
        ].map((item, i, arr) => (
          <div key={i} onClick={item.a} style={{
            padding: "15px 20px", display: "flex", justifyContent: "space-between",
            borderBottom: i < arr.length - 1 ? `1px solid ${BD}` : "none",
            cursor: "pointer", color: item.l === t("logout") ? A : "#bbb"
          }}>
            <span style={{ fontSize: 14 }}>{item.l}</span>
            <span style={{ color: "#333" }}>›</span>
          </div>
        ))}
      </div>
      <Nav />
    </div>
  );

  return null;
}
