import { useState, useEffect, useRef } from "react";
import Head from "next/head";
import Link from "next/link";
import { auth, db, storage, getMessagingInstance } from "@/lib/firebase";
import { ref as sRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { getToken, onMessage } from "firebase/messaging";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { ref, set, get, push, onValue, remove, query, limitToLast } from "firebase/database";

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
    manifesto: "모두에게는 빛나는 한 부분이 있어요. 당신만의 매력 포인트를 드러내고, 취향이 맞는 사람과 만나세요.",
    safetyNote: "모든 프로필은 19+ 인증과 AI 이미지 필터를 거쳐요. 부적절한 콘텐츠는 자동 차단됩니다.",
    start: "시작하기",
    ageTitle: "19세 이상 인증",
    ageDesc: "이 서비스는 만 19세 이상만 이용 가능합니다",
    ageYes: "네, 19세 이상입니다",
    ageNo: "아니요",
    ageBlock: "19세 미만은 이용할 수 없습니다",
    nickTitle: "닉네임",
    nickPh: "닉네임 (2~10자)",
    myPiece: "나의 매력 포인트",
    myPieceDesc: "자신 있는 시그니처를 골라주세요 (최대 3개)",
    intPiece: "끌리는 매력 포인트",
    intPieceDesc: "어떤 매력에 끌리는지 알려주세요 (최대 3개)",
    verify: "프로필 인증",
    verifyWarn: "안전한 커뮤니티를 위해 부적절한 이미지는 자동 필터링됩니다. 얼굴 식별 정보는 저장되지 않아요.",
    scanning: "이미지 확인 중...",
    scanOk: "인증 완료",
    scanFail: "업로드할 수 없는 이미지예요",
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
    swipeHint: "스와이프하여 새로운 매력 만나기",
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
    manifesto: "Everyone has a feature that shines. Express your signature charm and meet people who truly appreciate it.",
    safetyNote: "Every profile passes 19+ verification and AI image moderation. Inappropriate content is auto-blocked.",
    start: "Get Started",
    ageTitle: "Age Verification (19+)",
    ageDesc: "This service is for ages 19+",
    ageYes: "Yes, I'm 19+",
    ageNo: "No",
    ageBlock: "You must be 19+ to use MyPiece",
    nickTitle: "Nickname",
    nickPh: "Nickname (2-10 chars)",
    myPiece: "My Charm Points",
    myPieceDesc: "Choose your signature features (up to 3)",
    intPiece: "Interested In",
    intPieceDesc: "What kind of charm attracts you (up to 3)",
    verify: "Profile Verification",
    verifyWarn: "Inappropriate images are auto-filtered for community safety. Facial identity is not stored.",
    scanning: "Checking image...",
    scanOk: "Verified",
    scanFail: "This image cannot be uploaded",
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
    swipeHint: "Swipe to discover new charm",
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
    manifesto: "誰にでも輝く魅力があります。あなたのシグネチャーを表現し、価値観の合う相手と出会いましょう。",
    safetyNote: "全てのプロフィールは19歳以上認証とAI画像モデレーションを経ています。不適切なコンテンツは自動ブロックされます。",
    start: "はじめる",
    ageTitle: "年齢確認 (19歳以上)",
    ageDesc: "このサービスは19歳以上の方が対象です",
    ageYes: "はい、19歳以上です",
    ageNo: "いいえ",
    ageBlock: "19歳未満はご利用いただけません",
    nickTitle: "ニックネーム",
    nickPh: "ニックネーム (2～10文字)",
    myPiece: "私の魅力ポイント",
    myPieceDesc: "自信のあるシグネチャーを選択 (最大3つ)",
    intPiece: "惹かれる魅力",
    intPieceDesc: "どんな魅力に惹かれますか (最大3つ)",
    verify: "プロフィール認証",
    verifyWarn: "安全なコミュニティのため不適切な画像は自動フィルタリングされます。顔情報は保存されません。",
    scanning: "画像確認中...",
    scanOk: "認証完了",
    scanFail: "この画像はアップロードできません",
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
    manifesto: "每个人都有闪光的一面。展现你独特的魅力，与欣赏它的人相遇。",
    safetyNote: "每份资料均经过19岁以上验证和AI图像审核。不当内容将自动屏蔽。",
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
    verifyWarn: "为保障社区安全，不当图像将自动过滤。面部识别信息不会被保存。",
    scanning: "图像审核中...",
    scanOk: "验证完成",
    scanFail: "无法上传此图像",
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
    manifesto: "Todos tienen un rasgo que brilla. Expresa tu encanto único y conoce a quien lo valore.",
    safetyNote: "Cada perfil pasa verificación 19+ y moderación con IA. El contenido inapropiado se bloquea automáticamente.",
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
    verifyWarn: "Las imágenes inapropiadas se filtran automáticamente para la seguridad de la comunidad. La identidad facial no se almacena.",
    scanning: "Revisando imagen...",
    scanOk: "Verificado",
    scanFail: "Esta imagen no se puede subir",
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
    manifesto: "Chacun a un trait qui brille. Exprimez votre charme unique et rencontrez ceux qui l'apprécient.",
    safetyNote: "Chaque profil passe la vérification 19+ et la modération IA. Le contenu inapproprié est bloqué automatiquement.",
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
    verifyWarn: "Les images inappropriées sont filtrées automatiquement pour la sécurité de la communauté. L'identité faciale n'est pas stockée.",
    scanning: "Vérification de l'image...",
    scanOk: "Vérifié",
    scanFail: "Cette image ne peut être téléchargée",
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
    manifesto: "Jeder hat eine Facette, die strahlt. Zeige deinen Charme und triff Menschen, die ihn schätzen.",
    safetyNote: "Jedes Profil durchläuft 19+ Verifizierung und KI-Moderation. Unangemessene Inhalte werden automatisch blockiert.",
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
    verifyWarn: "Unangemessene Bilder werden zur Sicherheit der Community automatisch gefiltert. Gesichtsdaten werden nicht gespeichert.",
    scanning: "Bildprüfung...",
    scanOk: "Verifiziert",
    scanFail: "Dieses Bild kann nicht hochgeladen werden",
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
    manifesto: "Todos têm um traço que brilha. Expresse seu charme único e conheça quem o valoriza.",
    safetyNote: "Cada perfil passa por verificação 19+ e moderação por IA. Conteúdo inapropriado é bloqueado automaticamente.",
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
    verifyWarn: "Imagens inapropriadas são filtradas automaticamente para a segurança da comunidade. Identidade facial não é armazenada.",
    scanning: "Verificando imagem...",
    scanOk: "Verificado",
    scanFail: "Esta imagem não pode ser enviada",
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
    manifesto: "ทุกคนมีเสน่ห์ในแบบของตัวเอง แสดงเอกลักษณ์ของคุณและพบคนที่ชื่นชม",
    safetyNote: "ทุกโปรไฟล์ผ่านการยืนยัน 19+ และการกลั่นกรองด้วย AI เนื้อหาไม่เหมาะสมจะถูกบล็อกอัตโนมัติ",
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
    verifyWarn: "รูปภาพที่ไม่เหมาะสมจะถูกกรองอัตโนมัติเพื่อความปลอดภัยของชุมชน ข้อมูลใบหน้าจะไม่ถูกจัดเก็บ",
    scanning: "กำลังตรวจสอบรูปภาพ...",
    scanOk: "ยืนยันแล้ว",
    scanFail: "ไม่สามารถอัปโหลดรูปภาพนี้ได้",
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
    manifesto: "Ai cũng có một nét tỏa sáng riêng. Hãy thể hiện sức hút của bạn và gặp người trân trọng nó.",
    safetyNote: "Mọi hồ sơ đều qua xác minh 19+ và kiểm duyệt AI. Nội dung không phù hợp sẽ tự động bị chặn.",
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
    verifyWarn: "Hình ảnh không phù hợp sẽ được tự động lọc để đảm bảo an toàn cộng đồng. Danh tính khuôn mặt không được lưu trữ.",
    scanning: "Đang kiểm tra ảnh...",
    scanOk: "Đã xác minh",
    scanFail: "Không thể tải lên hình ảnh này",
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

// 매칭률 = 내 관심과 상대 피스의 교집합 + 내 피스와 상대 관심의 교집합 비율
const computeMatchPct = (otherMp = [], otherIp = [], myMp = [], myIp = []) => {
  const s1 = otherMp.filter(x => myIp.includes(x)).length;
  const s2 = otherIp.filter(x => myMp.includes(x)).length;
  const base = Math.max((myMp.length || 0) + (myIp.length || 0), 1);
  return Math.min(99, 45 + Math.round(((s1 + s2) / base) * 55));
};

// DB 프로필 → 스와이프 카드 형식으로 변환
const profileToCard = (uid, data, myMp = [], myIp = []) => {
  if (!data || !data.nickname) return null;
  const mp = data.myPieces || [];
  const ip = data.intPieces || [];
  return {
    id: uid,
    uid,
    name: data.nickname,
    age: data.age || 0,
    g: data.gender || "",
    bio: data.bio || "",
    mp,
    ip,
    v: !!data.verified,
    vp: Array.isArray(data.vParts) && data.vParts.length > 0 ? data.vParts[0] : null,
    on: false,
    lm: "",
    ph: !!(data.photoURLs && Object.keys(data.photoURLs).length > 0),
    d: 0,
    la: "",
    pct: computeMatchPct(mp, ip, myMp, myIp),
    badge: !!data.badge,
    rep: 0,
    region: data.region || "",
    photoURLs: data.photoURLs || {},
  };
};

const SC = { SPLASH: 0, LANG: 1, AGE: 2, BLOCK: 3, LOGIN: 4, SIGNUP: 5, HOME: 6, CHAT: 7, PROFILE: 8, LOUNGE: 9, REPORT: 10, SETTINGS: 11, UPROF: 12, CHATLIST: 13 };
const DB_USERS = "users";
const DB_CHATS = "chats";
const DB_USERCHATS = "userChats";
const DB_RECEIVED_LIKES = "receivedLikes";
const DB_LIKES = "likes";
const DB_MATCHES = "matches";

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
  const [users, setUsers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [liked, setLiked] = useState([]);
  const [blocked, setBlocked] = useState([]);
  const [showMatch, setShowMatch] = useState(false);
  const [matchUser, setMatchUser] = useState(null);
  const [toast, setToast] = useState("");
  const [swpI, setSwpI] = useState(0);
  const [dragX, setDragX] = useState(0);
  const dragStartX = useRef(null);
  const dragXRef = useRef(0);
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
  const [signupAge, setSignupAge] = useState("");
  const [signupGender, setSignupGender] = useState("");
  const [signupBio, setSignupBio] = useState("");
  const [editAge, setEditAge] = useState("");
  const [editGender, setEditGender] = useState("");
  const [editBio, setEditBio] = useState("");
  const [chatPartners, setChatPartners] = useState([]);
  const [receivedLikes, setReceivedLikes] = useState({}); // {likerUid: ts}
  const [lastVisit, setLastVisit] = useState({ home: 0, chat: 0 });
  const [showChatMenu, setShowChatMenu] = useState(false);
  const myPRef = useRef([]);
  const intPRef = useRef([]);
  const [notifOn, setNotifOn] = useState(true);
  const [photoURLs, setPhotoURLs] = useState({});
  const [uploading, setUploading] = useState({});
  const chatEnd = useRef(null);
  const fileRefs = useRef({});
  const matchesSeenRef = useRef(new Set());
  const initialMatchesLoadedRef = useRef(false);

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
          st(body ? `${title} · ${body}` : title);
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
          const myMp = data.myPieces || [];
          const myIp = data.intPieces || [];
          const blockedList = data.blocked || [];
          setNick(data.nickname || "");
          setMyP(myMp);
          setIntP(myIp);
          setBlocked(blockedList);
          setUser(data);
          setSignupAge(data.age ? String(data.age) : "");
          setSignupGender(data.gender || "");
          setSignupBio(data.bio || "");
          await loadUsersAndRelations(fbUser.uid, myMp, myIp, blockedList);
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

  // DB에서 전체 유저 / 좋아요 / 매칭 불러오기
  const loadUsersAndRelations = async (uid, myMp, myIp, blockedList) => {
    try {
      const [usersSnap, likesSnap, matchesSnap] = await Promise.all([
        get(ref(db, DB_USERS)),
        get(ref(db, `${DB_LIKES}/${uid}`)),
        get(ref(db, `${DB_MATCHES}/${uid}`)),
      ]);

      const allUsers = usersSnap.exists() ? usersSnap.val() : {};
      const likesData = likesSnap.exists() ? likesSnap.val() : {};
      const matchesData = matchesSnap.exists() ? matchesSnap.val() : {};

      const list = Object.entries(allUsers)
        .filter(([otherUid]) => otherUid !== uid && !blockedList.includes(otherUid))
        .map(([otherUid, data]) => profileToCard(otherUid, data, myMp, myIp))
        .filter(u => u !== null)
        .sort((a, b) => b.pct - a.pct);

      setUsers(list);
      setLiked(Object.keys(likesData));
      setMatches(list.filter(u => matchesData[u.id]));
    } catch (e) {
      console.warn("유저 목록 로드 실패:", e.message);
    }
  };

  useEffect(() => {
    if (scr === SC.SPLASH) {
      const tm = setTimeout(() => setScr(SC.LANG), 1200);
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

  // Firebase 채팅 리스너 + 채팅 진입 시 userChats 인덱스 갱신
  useEffect(() => {
    if (!chatU || !authUser) return;
    const otherUid = chatU.uid || String(chatU.id);
    const chatId = [authUser.uid, otherUid].sort().join("_");
    // 페이지네이션 — 최근 100개 메시지만 (DB 다운로드 비용 절감)
    const msgsRef = query(ref(db, `${DB_CHATS}/${chatId}`), limitToLast(100));
    const unsub = onValue(msgsRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const arr = Object.values(data).sort((a, b) => a.ts - b.ts);
        setMsgs(arr.map(m => ({ id: m.ts, from: m.uid === authUser.uid ? "me" : "them", text: m.text, time: m.time })));
        // 기존 채팅 마이그레이션: 메시지가 있으면 내 인덱스에 등록
        const last = arr[arr.length - 1];
        if (last) {
          set(ref(db, `${DB_USERCHATS}/${authUser.uid}/${otherUid}`), {
            lastTs: last.ts, lastText: (last.text || "").slice(0, 80)
          }).catch(() => {});
        }
      }
    });
    return () => unsub();
  }, [chatU, authUser]);

  // myP/intP를 ref에 동기화 (effect 의존성에서 빼기 위해)
  useEffect(() => { myPRef.current = myP; }, [myP]);
  useEffect(() => { intPRef.current = intP; }, [intP]);

  // 마지막 방문 시각 localStorage에서 로드
  useEffect(() => {
    if (typeof window === "undefined") return;
    setLastVisit({
      home: parseInt(localStorage.getItem("mp_lastVisitHome") || "0"),
      chat: parseInt(localStorage.getItem("mp_lastVisitChat") || "0"),
    });
  }, []);

  // 화면 진입 시 lastVisit 갱신 (배지 카운트 리셋용)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const now = Date.now();
    if (scr === SC.HOME) {
      localStorage.setItem("mp_lastVisitHome", String(now));
      setLastVisit(p => ({ ...p, home: now }));
    } else if (scr === SC.CHATLIST) {
      localStorage.setItem("mp_lastVisitChat", String(now));
      setLastVisit(p => ({ ...p, chat: now }));
    }
  }, [scr]);

  // 받은 좋아요 실시간 동기화
  useEffect(() => {
    if (!authUser) return;
    const rRef = ref(db, `${DB_RECEIVED_LIKES}/${authUser.uid}`);
    const unsub = onValue(rRef, (snap) => {
      setReceivedLikes(snap.exists() ? snap.val() : {});
    }, () => setReceivedLikes({}));
    return () => unsub();
  }, [authUser]);

  // 채팅 상대 실시간 동기화 — userChats/{내UID} 인덱스 구독
  // (sendMsg에서 양쪽 인덱스를 갱신함)
  useEffect(() => {
    if (!authUser) return;
    const idxRef = ref(db, `${DB_USERCHATS}/${authUser.uid}`);
    const unsub = onValue(idxRef, async (snap) => {
      if (!snap.exists()) { setChatPartners([]); return; }
      const idx = snap.val();
      const otherUids = Object.keys(idx);
      const cards = await Promise.all(otherUids.map(async k => {
        try {
          const pSnap = await get(ref(db, `${DB_USERS}/${k}`));
          if (!pSnap.exists()) return null;
          const pData = pSnap.val();
          if (!pData.nickname) return null;
          const card = profileToCard(k, pData, myPRef.current, intPRef.current);
          if (card && idx[k]) {
            card.lm = idx[k].lastText || "";
            card.lastTs = idx[k].lastTs || 0;
          }
          return card;
        } catch { return null; }
      }));
      const valid = cards.filter(Boolean).sort((a, b) => (b.lastTs || 0) - (a.lastTs || 0));
      setChatPartners(valid);
    }, () => setChatPartners([]));
    return () => unsub();
  }, [authUser]);

  // Firebase 매치 실시간 동기화
  useEffect(() => {
    if (!authUser) return;
    let isFirstSnapshot = true;
    const matchRef = ref(db, `${DB_MATCHES}/${authUser.uid}`);
    const unsub = onValue(matchRef, async (snap) => {
      const data = snap.exists() ? snap.val() : {};
      const keys = Object.keys(data);
      const cards = await Promise.all(
        keys.map(async k => {
          try {
            const pSnap = await get(ref(db, `${DB_USERS}/${k}`));
            if (!pSnap.exists()) return null;
            const pData = pSnap.val();
            if (!pData.nickname) return null;
            return profileToCard(k, pData, myPRef.current, intPRef.current);
          } catch { return null; }
        })
      );
      const validCards = cards.filter(Boolean);
      setMatches(validCards);
      if (!isFirstSnapshot) {
        const newCard = validCards.find(c => !matchesSeenRef.current.has(c.id));
        if (newCard) { setMatchUser(newCard); setShowMatch(true); }
      }
      matchesSeenRef.current = new Set(validCards.map(c => c.id));
      isFirstSnapshot = false;
    });
    return () => unsub();
  }, [authUser]);

  const go = (s) => { setHist(h => [...h, scr]); setScr(s); };
  const back = () => { const h = [...hist]; const l = h.pop() || SC.HOME; setHist(h); setScr(l); };
  const tog = (list, set, max, p) => set(prev => prev.includes(p) ? prev.filter(x => x !== p) : prev.length < max ? [...prev, p] : prev);
  const st = (m) => setToast(m);

  // 이미지 압축 (Storage 비용 절감) — 1024px 이내, JPEG 82%
  const compressImage = (file, maxSize = 1024, quality = 0.82) => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let { width, height } = img;
      if (width > maxSize || height > maxSize) {
        const ratio = Math.min(maxSize / width, maxSize / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);
      canvas.toBlob(b => b ? resolve(b) : reject(new Error("compress failed")), "image/jpeg", quality);
    };
    img.onerror = () => reject(new Error("invalid image"));
    img.src = URL.createObjectURL(file);
  });

  const handlePhotoUpload = async (partIdx, file) => {
    if (!file || !authUser) return;
    // 사이즈 제한 — 원본 10MB 초과 거부 (악의적/실수 방지)
    if (file.size > 10 * 1024 * 1024) {
      st("이미지가 너무 큽니다 (최대 10MB)");
      return;
    }
    if (!file.type.startsWith("image/")) {
      st("이미지 파일만 업로드 가능합니다");
      return;
    }
    setUploading(u => ({ ...u, [partIdx]: true }));
    try {
      // 압축: 평균 5MB → 200~400KB로 감소 (Storage 90%+ 절감)
      const blob = await compressImage(file, 1024, 0.82);
      const storageRef = sRef(storage, `verifications/${authUser.uid}/${partIdx}_${Date.now()}.jpg`);
      await uploadBytes(storageRef, blob, { contentType: "image/jpeg" });
      const url = await getDownloadURL(storageRef);
      setPhotoURLs(p => ({ ...p, [partIdx]: url }));
      startScan(partIdx, url);
    } catch (e) {
      st("업로드 실패: " + e.message);
    }
    setUploading(u => ({ ...u, [partIdx]: false }));
  };

  // 이미지 검열 — /api/moderate-image. 일일 호출 한도 적용 (Vision API 비용 보호)
  const VISION_DAILY_LIMIT = 10; // 사용자당 하루 최대 10번
  const checkVisionQuota = () => {
    if (typeof window === "undefined") return true;
    const today = new Date().toISOString().slice(0, 10);
    let usage;
    try { usage = JSON.parse(localStorage.getItem("mp_vision_usage") || "{}"); } catch { usage = {}; }
    if (usage.date !== today) usage = { date: today, count: 0 };
    if (usage.count >= VISION_DAILY_LIMIT) return false;
    usage.count++;
    localStorage.setItem("mp_vision_usage", JSON.stringify(usage));
    return true;
  };

  const startScan = async (partIdx, imageUrl) => {
    if (!checkVisionQuota()) {
      st(`오늘 검증 한도(${VISION_DAILY_LIMIT}회) 초과. 내일 다시 시도해주세요`);
      setScans(s => ({ ...s, [partIdx]: "fail" }));
      return;
    }
    setScans(s => ({ ...s, [partIdx]: "scanning" }));
    try {
      const resp = await fetch("/api/moderate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl }),
      });
      const data = await resp.json();
      setScans(s => {
        const next = { ...s, [partIdx]: data.ok ? "ok" : "fail" };
        const allOk = vParts.every(p => next[p] === "ok");
        if (allOk && vParts.length >= 2) setVDone(true);
        return next;
      });
      if (!data.ok && data.reason) st("❌ " + data.reason);
    } catch (e) {
      setScans(s => ({ ...s, [partIdx]: "fail" }));
      st("검증 실패: 네트워크 오류");
    }
  };

  // 프로필 완성 → Firebase 저장
  const complete = async () => {
    const profile = { nickname: nick, age: Number(signupAge) || 0, gender: signupGender, bio: signupBio, myPieces: myP, intPieces: intP, verified: vDone, vParts, photoURLs, badge: false, createdAt: Date.now() };
    setUser(profile);
    if (authUser) {
      await set(ref(db, `${DB_USERS}/${authUser.uid}`), profile);
      await loadUsersAndRelations(authUser.uid, myP, intP, blocked);
    }
    setScr(SC.HOME);
    st("Welcome to MyPiece! 🎉");
  };

  // 좋아요 + 상호 좋아요 시 매칭 처리
  const handleLike = async (u) => {
    if (!u || liked.includes(u.id)) return;
    setLiked(p => [...p, u.id]);
    setSwpI(0);
    if (!authUser) { st("💕 " + t("like") + "!"); return; }
    try {
      await set(ref(db, `${DB_LIKES}/${authUser.uid}/${u.id}`), true);
      // 상대 받은좋아요함에 등록 (배지/카운트용)
      set(ref(db, `${DB_RECEIVED_LIKES}/${u.id}/${authUser.uid}`), Date.now()).catch(() => {});
      const reverse = await get(ref(db, `${DB_LIKES}/${u.id}/${authUser.uid}`));
      if (reverse.exists() && reverse.val()) {
        const ts = Date.now();
        matchesSeenRef.current.add(u.id);
        await Promise.all([
          set(ref(db, `${DB_MATCHES}/${authUser.uid}/${u.id}`), ts),
          set(ref(db, `${DB_MATCHES}/${u.id}/${authUser.uid}`), ts),
        ]);
        setMatches(p => p.some(x => x.id === u.id) ? p : [...p, u]);
        setMatchUser(u);
        setShowMatch(true);
        if (u.uid) sendPush(u.uid, "✨ 매칭!", `${nick || "누군가"}와 서로 좋아요`);
      } else {
        st("💕 " + t("like") + "!");
        // 일방 좋아요 — 상대방에게 알림 (이름 비공개로 호기심 유발)
        if (u.uid) sendPush(u.uid, "💕 새 좋아요", "누군가 당신을 좋아해요");
      }
    } catch (e) {
      st("좋아요 실패: " + e.message);
    }
  };

  // 좋아요 취소 + 매치 해제 (양방향)
  const handleUnlike = async (u) => {
    if (!u || !authUser) return;
    setLiked(p => p.filter(id => id !== u.id));
    setMatches(p => p.filter(x => x.id !== u.id));
    matchesSeenRef.current.delete(u.id);
    try {
      await Promise.all([
        remove(ref(db, `${DB_LIKES}/${authUser.uid}/${u.id}`)),
        remove(ref(db, `${DB_MATCHES}/${authUser.uid}/${u.id}`)),
        remove(ref(db, `${DB_MATCHES}/${u.id}/${authUser.uid}`)),
        remove(ref(db, `${DB_RECEIVED_LIKES}/${u.id}/${authUser.uid}`)),
      ]);
      st("좋아요 취소했어요");
    } catch (e) {
      st("취소 실패: " + e.message);
    }
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
    const updated = { ...user, nickname: editNick, age: Number(editAge) || user?.age || 0, gender: editGender || user?.gender || "", bio: editBio, myPieces: editMyP, intPieces: editIntP };
    setUser(updated);
    setNick(editNick); setMyP(editMyP); setIntP(editIntP);
    setSignupAge(String(updated.age)); setSignupGender(updated.gender); setSignupBio(updated.bio);
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
    setSignupAge(""); setSignupGender(""); setSignupBio("");
    setScr(SC.LANG);
  };

  const openChat = (u) => {
    setChatU(u);
    setMsgs(u.lm ? [{ id: 1, from: "them", text: u.lm, time: "now" }] : []);
    go(SC.CHAT);
  };

  // Firebase 채팅 메시지 전송
  const sendMsg = async () => {
    const text = inp.trim().slice(0, 500); // 메시지 500자 제한 (DB 비용 + 악용 방지)
    if (!text) return;
    const now = new Date();
    const h = now.getHours();
    const ts = (h % 12 || 12) + ":" + String(now.getMinutes()).padStart(2, "0") + (h >= 12 ? " PM" : " AM");
    const msgData = { text, uid: authUser?.uid || "guest", time: ts, ts: Date.now() };

    if (authUser && chatU) {
      const otherUid = chatU.uid || String(chatU.id);
      const chatId = [authUser.uid, otherUid].sort().join("_");
      await push(ref(db, `${DB_CHATS}/${chatId}`), msgData);
      // 양쪽 채팅 인덱스 갱신 (탭에 채팅 목록 표시용)
      const meta = { lastTs: msgData.ts, lastText: text.slice(0, 80) };
      try {
        await Promise.all([
          set(ref(db, `${DB_USERCHATS}/${authUser.uid}/${otherUid}`), meta),
          set(ref(db, `${DB_USERCHATS}/${otherUid}/${authUser.uid}`), meta),
        ]);
      } catch { /* 인덱스 실패해도 메시지는 전송됨 */ }
      if (chatU.uid) sendPush(chatU.uid, `💌 ${nick || "누군가"}`, text.slice(0, 40));
    } else {
      setMsgs(p => [...p, { id: Date.now(), from: "me", text, time: ts }]);
    }
    setInp("");
  };

  const filteredUsers = users.filter(u => !blocked.includes(u.id)).filter(u => gFilter === "all" || !u.g || u.g === gFilter);

  // ─── 색상 테마 ───
  const A = "#FF6B45", AD = "#E8502A", AS = "#FF9B7A";
  const SF = "#faf6f3", SL = "#fff3ee", BD = "#e8d5c8";
  const base = {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #fff8f3 0%, #ffffff 520px)",
    fontFamily: "'Noto Sans KR', system-ui, sans-serif",
    color: "#1a1a1a",
    maxWidth: 480,
    margin: "0 auto",
    position: "relative",
    boxShadow: "0 0 60px rgba(232, 145, 106, 0.18)"
  };
  const btnStyle = (on) => ({
    width: "100%", padding: "15px 0", border: "none", borderRadius: 14,
    background: on ? `linear-gradient(135deg,${A},${AD})` : "#e0d8d4",
    color: on ? "#fff" : "#aaa", fontSize: 15, fontWeight: 700,
    cursor: on ? "pointer" : "not-allowed", opacity: on ? 1 : 0.7
  });
  const iB = {
    width: "100%", padding: "14px 16px", border: `1px solid ${BD}`,
    borderRadius: 12, background: SF, color: "#1a1a1a", fontSize: 15,
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
      zIndex: 10000, padding: "12px 18px", borderRadius: 14,
      background: `${A}ee`, color: "#fff", fontSize: 13, fontWeight: 600,
      maxWidth: "calc(100vw - 32px)", width: "auto", textAlign: "center",
      lineHeight: 1.4, wordBreak: "keep-all", boxShadow: "0 6px 20px rgba(0,0,0,0.18)"
    }}>{toast}</div>
  ) : null;

  const Badge = ({ has, size = 14 }) => has ? (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 3,
      fontSize: size - 2, color: "#4ade80", background: "#4ade8018",
      padding: "2px 8px", borderRadius: 8, fontWeight: 700
    }}>⭐ {t("badge")}</span>
  ) : null;

  const Nav = () => {
    // 새 좋아요 + 새 매치 카운트 (홈 마지막 방문 이후)
    const newLikes = Object.values(receivedLikes).filter(ts => ts > lastVisit.home).length;
    const newMatches = matches.filter(m => (receivedLikes[m.id] || 0) > lastVisit.home).length;
    const homeBadge = newLikes; // 받은 좋아요 = 매치 후보
    const chatBadge = chatPartners.filter(p => (p.lastTs || 0) > lastVisit.chat).length;
    const tabs = [
      { i: "✨", l: t("home"), s: SC.HOME, badge: homeBadge },
      { i: "🌟", l: t("lounge"), s: SC.LOUNGE, badge: 0 },
      { i: "💌", l: t("chat"), s: SC.CHATLIST, badge: chatBadge },
      { i: "🌸", l: t("my"), s: SC.PROFILE, badge: 0 },
    ];
    return (
      <div style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 480, display: "flex",
        background: "rgba(255, 248, 243, 0.96)", backdropFilter: "blur(10px)",
        borderTop: `1px solid ${BD}`,
        padding: "8px 0 10px", zIndex: 100
      }}>
        {tabs.map((tab, i) => (
          <button key={i} onClick={() => go(tab.s)} style={{
            flex: 1, background: "none", border: "none", cursor: "pointer",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
            color: (tab.s === scr || (tab.s === SC.CHATLIST && scr === SC.CHAT)) ? A : "#666", fontSize: 18,
            position: "relative"
          }}>
            <span style={{ position: "relative" }}>
              {tab.i}
              {tab.badge > 0 && (
                <span style={{
                  position: "absolute", top: -4, right: -10,
                  minWidth: 16, height: 16, padding: "0 4px",
                  borderRadius: 8, background: "#ef4444", color: "#fff",
                  fontSize: 9, fontWeight: 800,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: "1.5px solid #fff8f3", lineHeight: 1
                }}>{tab.badge > 99 ? "99+" : tab.badge}</span>
              )}
            </span>
            <span style={{ fontSize: 9, fontWeight: 600 }}>{tab.l}</span>
          </button>
        ))}
      </div>
    );
  };

  const MatchModal = () => (showMatch && matchUser) ? (
    <div style={{ position: "fixed", inset: 0, zIndex: 99999, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.88)", padding: "0 24px" }}>
      <style>{`
        @keyframes matchPop{0%{transform:scale(0.4);opacity:0}65%{transform:scale(1.08)}100%{transform:scale(1);opacity:1}}
        @keyframes heartFloat{0%{transform:translateY(0);opacity:1}100%{transform:translateY(-60px);opacity:0}}
        @keyframes matchGlow{0%,100%{box-shadow:0 0 0px ${A}00}50%{box-shadow:0 0 40px ${A}88}}
      `}</style>
      {/* 닫기 X 버튼 */}
      <button onClick={() => setShowMatch(false)} aria-label="닫기" style={{
        position: "fixed", top: 20, right: 20, zIndex: 100000,
        width: 40, height: 40, borderRadius: "50%",
        background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)",
        color: "#fff", fontSize: 22, fontWeight: 300, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        lineHeight: 1, padding: 0
      }}>×</button>
      <div style={{ animation: "matchPop 0.55s cubic-bezier(0.34,1.56,0.64,1) both", textAlign: "center", width: "100%", maxWidth: 360 }}>
        {/* 하트 */}
        <div style={{ fontSize: 52, marginBottom: 8 }}>💕</div>
        <div style={{ fontSize: 34, fontWeight: 900, color: "#fff", marginBottom: 6, letterSpacing: -1 }}>It's a Match!</div>
        <div style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", marginBottom: 32 }}>You and <b style={{ color: AS }}>{matchUser.name}</b> liked each other ✨</div>

        {/* 두 아바타 */}
        <div style={{ display: "flex", gap: 28, justifyContent: "center", alignItems: "center", marginBottom: 32 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 76, height: 76, borderRadius: "50%", background: `linear-gradient(135deg,${A},${AD})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 800, color: "#fff", border: "3px solid #fff", margin: "0 auto 6px", animation: "matchGlow 2s infinite" }}>나</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>You</div>
          </div>
          <div style={{ fontSize: 28 }}>❤️</div>
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 76, height: 76, borderRadius: "50%", background: `linear-gradient(135deg,${AS},${A})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 800, color: "#fff", border: "3px solid #fff", margin: "0 auto 6px", animation: "matchGlow 2s 0.3s infinite" }}>{matchUser.name[0]}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>{matchUser.name}</div>
          </div>
        </div>

        {/* 피스 공통점 */}
        {(() => {
          const common = matchUser.mp.filter(x => intP.includes(x));
          return common.length > 0 ? (
            <div style={{ marginBottom: 24, padding: "10px 16px", borderRadius: 12, background: `${A}22`, border: `1px solid ${A}44` }}>
              <div style={{ fontSize: 12, color: AS, fontWeight: 600 }}>✨ Piece Match: {common.map(i => P()[i]).join(", ")}</div>
            </div>
          ) : null;
        })()}

        <button onClick={() => { setShowMatch(false); setChatU(matchUser); setMsgs(matchUser.lm ? [{ id: 1, from: "them", text: matchUser.lm, time: "now" }] : []); go(SC.CHAT); }}
          style={{ width: "100%", padding: "16px 0", borderRadius: 28, background: `linear-gradient(135deg,${A},${AD})`, border: "none", color: "#fff", fontSize: 16, fontWeight: 800, cursor: "pointer", marginBottom: 12 }}>
          💌 Send Message
        </button>
        <button onClick={() => setShowMatch(false)}
          style={{ width: "100%", padding: "12px 0", borderRadius: 20, background: "transparent", border: "1px solid rgba(255,255,255,0.25)", color: "rgba(255,255,255,0.55)", fontSize: 14, cursor: "pointer" }}>
          Keep Swiping
        </button>
      </div>
    </div>
  ) : null;

  // ═══ SPLASH ═══
  if (scr === SC.SPLASH) return (
    <div style={{ ...base, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative" }}>
      <Head><title>MyPiece - Find Your Piece</title></Head>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:0.85}50%{opacity:1}}
      `}</style>

      {/* 따뜻한 배경 글로우 */}
      <div style={{ position:"absolute", width:560, height:560, borderRadius:"50%", background:`radial-gradient(circle, ${AS}26 0%, ${A}10 40%, transparent 70%)`, top:"5%", left:"50%", transform:"translateX(-50%)", pointerEvents:"none" }} />

      {/* 세 개의 조각상 — 클래식 르네상스 대리석 갤러리 */}
      <div style={{ display:"flex", alignItems:"flex-end", gap:12, marginBottom:40, animation:"fadeUp 1s ease both" }}>

        {/* ───── 1. 상반신 토르소 ───── */}
        <div style={{ transform:"rotate(-4deg) translateY(14px)", position:"relative" }}>
          <div style={{
            width:96, height:140, borderRadius:12, overflow:"hidden",
            boxShadow:`0 16px 34px rgba(200, 130, 90, 0.28), 0 0 0 1px rgba(232, 145, 106, 0.18), inset 0 1px 0 rgba(255,255,255,0.7)`,
            background:"#faf3ec"
          }}>
            <img
              src="https://images.unsplash.com/photo-1601887389937-0b02c26b602c?w=240&h=350&fit=crop&q=85&auto=format"
              alt="Classical sculpture"
              loading="eager"
              onError={e => { e.target.style.display = "none"; }}
              style={{ width:"100%", height:"100%", objectFit:"cover", display:"block", filter:"sepia(0.06) saturate(1.05) contrast(1.02)" }}
            />
            <div style={{ position:"absolute", inset:0, borderRadius:12, boxShadow:"inset 0 0 24px rgba(200, 130, 90, 0.22), inset 0 0 4px rgba(232, 145, 106, 0.12)", pointerEvents:"none" }}/>
          </div>
        </div>

        {/* ───── 2. 전신 뒷모습 — 척추·등·허리·엉덩이 ───── */}
        <div style={{ transform:"translateY(-6px) scale(1.04)", position:"relative" }}>
          <div style={{
            width:82, height:200, borderRadius:14, overflow:"hidden",
            boxShadow:`0 22px 42px rgba(200, 130, 90, 0.32), 0 0 0 1px rgba(232, 145, 106, 0.22), inset 0 1px 0 rgba(255,255,255,0.7)`,
            background:"#f8efe3", clipPath:"polygon(0 0, 100% 0, 85% 100%, 0 100%)"
          }}>
            <img
              src="https://images.unsplash.com/photo-1609856699475-6fc22afa6d31?w=200&h=480&fit=crop&q=85&auto=format"
              alt="Classical sculpture full body"
              loading="eager"
              onError={e => { e.target.style.display = "none"; }}
              style={{ width:"100%", height:"100%", objectFit:"cover", display:"block", filter:"sepia(0.06) saturate(1.05) contrast(1.02)" }}
            />
            <div style={{ position:"absolute", inset:0, boxShadow:"inset 0 0 28px rgba(200, 130, 90, 0.28), inset 0 0 5px rgba(232, 145, 106, 0.15)", pointerEvents:"none" }}/>
          </div>
        </div>

        {/* ───── 3. 하반신 토르소 — 허리·복근·골반 V라인 ───── */}
        <div style={{ transform:"rotate(4deg) translateY(10px)", position:"relative" }}>
          <div style={{
            width:96, height:130, borderRadius:12, overflow:"hidden",
            boxShadow:`0 16px 34px rgba(200, 130, 90, 0.28), 0 0 0 1px rgba(232, 145, 106, 0.18), inset 0 1px 0 rgba(255,255,255,0.7)`,
            background:"#faf3ec"
          }}>
            <img
              src="https://images.unsplash.com/photo-1572379371012-9e11bfc61b35?w=240&h=320&fit=crop&q=85&auto=format"
              alt="Classical sculpture lower torso"
              loading="eager"
              onError={e => { e.target.style.display = "none"; }}
              style={{ width:"100%", height:"100%", objectFit:"cover", display:"block", filter:"sepia(0.06) saturate(1.05) contrast(1.02)" }}
            />
            <div style={{ position:"absolute", inset:0, borderRadius:12, boxShadow:"inset 0 0 22px rgba(200, 130, 90, 0.22), inset 0 0 4px rgba(232, 145, 106, 0.12)", pointerEvents:"none" }}/>
          </div>
        </div>

      </div>

      {/* 로고 + 태그라인 */}
      <div style={{ textAlign:"center", animation:"fadeUp 1s ease 0.25s both" }}>
        <div style={{
          fontSize:52, fontWeight:900, letterSpacing:-2,
          background:`linear-gradient(135deg,${A},${AS})`,
          WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
          animation:"pulse 2.5s ease-in-out infinite"
        }}>MyPiece</div>
        <div style={{ color:"#666", fontSize:13, marginTop:10, letterSpacing:2, textTransform:"uppercase", fontWeight:600 }}>Find Your Piece</div>
        <div style={{ color:"#888", fontSize:11, marginTop:6 }}>Beauty is in every detail ✨</div>
      </div>
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
            <span style={{ fontSize: 14, fontWeight: 600, color: lang === l.code ? A : "#555" }}>{l.name}</span>
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
        background: checked ? A + "18" : SL, borderRadius: 12,
        border: `1px solid ${checked ? A : BD}`, cursor: "pointer", marginBottom: 10
      }}>
        <div style={{
          width: 20, height: 20, borderRadius: 6, border: `2px solid ${checked ? A : "#444"}`,
          background: checked ? A : "transparent", flexShrink: 0, marginTop: 1,
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>{checked && <span style={{ color: "#fff", fontSize: 12, fontWeight: 900 }}>✓</span>}</div>
        <span style={{ fontSize: 13, color: checked ? "#1a1a1a" : "#888", lineHeight: 1.5 }}>{label}</span>
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
          {checkItem(ageCheck1, () => setAgeCheck1(v => !v), "I confirm I am 19 years of age or older.")}
          {checkItem(ageCheck2, () => setAgeCheck2(v => !v), (
            <>
              I agree to MyPiece's{" "}
              <Link href="/terms" onClick={e => e.stopPropagation()} style={{ color: A, textDecoration: "underline", fontWeight: 700 }}>Terms of Service</Link>
              {" "}and{" "}
              <Link href="/privacy" onClick={e => e.stopPropagation()} style={{ color: A, textDecoration: "underline", fontWeight: 700 }}>Privacy Policy</Link>.
            </>
          ))}
          {checkItem(ageCheck3, () => setAgeCheck3(v => !v), "I understand that providing false information is my sole legal responsibility.")}
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
          ‹ Back
        </button>
        <button onClick={handleLogout}
          style={{ background: "none", border: "none", color: "#444", fontSize: 12, cursor: "pointer" }}>
          로그아웃
        </button>
      </div>
      <div style={{ display: "flex", gap: 5, marginBottom: 32 }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= step ? A : BD }} />
        ))}
      </div>

      {step === 0 && (
        <div>
          {/* 매니페스토 — 리포지셔닝 카드 */}
          <div style={{
            padding: "18px 20px", marginBottom: 24, borderRadius: 16,
            background: `linear-gradient(135deg, ${A}0f, ${AS}0f)`,
            border: `1px solid ${A}33`,
          }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: A, letterSpacing: 2, marginBottom: 6 }}>✨ MYPIECE</div>
            <div style={{ fontSize: 13, lineHeight: 1.65, color: "#444" }}>{t("manifesto")}</div>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20 }}>{t("nickTitle")}</h2>
          <input style={{ ...iB, marginBottom: 14 }} placeholder={t("nickPh")} value={nick}
            onChange={e => setNick(e.target.value)} maxLength={10} />

          {/* 성별 선택 */}
          <div style={{ fontSize: 13, color: "#666", marginBottom: 8 }}>성별</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            {[{ v: "F", l: "👩 여성" }, { v: "M", l: "👨 남성" }].map(o => (
              <button key={o.v} onClick={() => setSignupGender(o.v)} style={{
                flex: 1, padding: "12px 0", borderRadius: 12,
                border: `1px solid ${signupGender === o.v ? A : BD}`,
                background: signupGender === o.v ? A + "18" : SF,
                color: signupGender === o.v ? A : "#888",
                fontSize: 14, fontWeight: 600, cursor: "pointer"
              }}>{o.l}</button>
            ))}
          </div>

          {/* 나이 */}
          <div style={{ fontSize: 13, color: "#666", marginBottom: 8 }}>나이</div>
          <input style={{ ...iB, marginBottom: 14 }} type="number" min="19" max="99"
            placeholder="만 나이 입력 (19세 이상)"
            value={signupAge} onChange={e => setSignupAge(e.target.value)} />

          {/* 자기소개 */}
          <div style={{ fontSize: 13, color: "#666", marginBottom: 8 }}>자기소개 <span style={{ color: "#aaa", fontSize: 11 }}>(선택)</span></div>
          <textarea style={{ ...iB, height: 80, resize: "none", marginBottom: 20, fontFamily: "inherit" }}
            placeholder="나를 한 문장으로 소개해보세요"
            value={signupBio} onChange={e => setSignupBio(e.target.value)} maxLength={100} />

          <button style={btnStyle(nick.length >= 2 && signupGender && Number(signupAge) >= 19)}
            onClick={() => nick.length >= 2 && signupGender && Number(signupAge) >= 19 && setStep(1)}>
            {t("next")}
          </button>
        </div>
      )}

      {step === 1 && (
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>
            {t("myPiece")} <span style={{ color: A }}>✨</span>
          </h2>
          <p style={{ color: "#555", fontSize: 13, marginBottom: 20 }}>{t("myPieceDesc")}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {P().map((p, i) => (
              <button key={i} style={chip(myP.includes(i), A)} onClick={() => tog(myP, setMyP, 3, i)}>{p}</button>
            ))}
          </div>
          <div style={{
            marginTop: 20, padding: "10px 14px", borderRadius: 10,
            background: SL, fontSize: 11, lineHeight: 1.55, color: "#777", border: `1px solid ${BD}`
          }}>🛡️ {t("safetyNote")}</div>
          <div style={{ height: 14 }} />
          <button style={btnStyle(myP.length > 0)} onClick={() => myP.length > 0 && setStep(2)}>
            {t("next")} ({myP.length}/3)
          </button>
        </div>
      )}

      {step === 2 && (
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>
            {t("intPiece")} <span style={{ color: AS }}>🤍</span>
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
                }}>{P()[i]} {sel ? "✨" : ""}</button>
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
                      {uploading[i] && <div><div style={{ fontSize: 22 }}>✨</div><div style={{ color: "#888", fontSize: 12, marginTop: 6 }}>업로드 중...</div></div>}
                      {!uploading[i] && s === "scanning" && <div><div style={{ fontSize: 22 }}>🔮</div><div style={{ color: "#888", fontSize: 12, marginTop: 6 }}>{t("scanning")}</div></div>}
                      {!uploading[i] && s === "ok" && <div><div style={{ fontSize: 28 }}>✅</div><div style={{ color: "#4ade80", fontSize: 12, fontWeight: 700, marginTop: 4 }}>{t("scanOk")}</div></div>}
                      {!uploading[i] && s === "fail" && (
                        <div>
                          <div style={{ fontSize: 28 }}>❌</div>
                          <div style={{ color: "#ef4444", fontSize: 12, marginTop: 4 }}>{t("scanFail")}</div>
                          <button onClick={e => { e.stopPropagation(); setScans(sc => { const n = { ...sc }; delete n[i]; return n; }); setPhotoURLs(p => { const n = { ...p }; delete n[i]; return n; }); setVDone(false); }}
                            style={{ color: A, fontSize: 11, marginTop: 6, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>다시 업로드</button>
                        </div>
                      )}
                      {!uploading[i] && !s && <div><div style={{ fontSize: 28, opacity: 0.4 }}>🤳</div><div style={{ color: "#555", fontSize: 12, marginTop: 6 }}>탭하여 사진 선택</div></div>}
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
  if (isDesktop && user && [SC.HOME, SC.LOUNGE, SC.CHAT, SC.CHATLIST].includes(scr)) {
    const pool = filteredUsers.filter(u => !liked.includes(u.id) && (u.mp.some(x => intP.includes(x)) || u.ip.some(x => myP.includes(x))));
    const m = pool[swpI % Math.max(pool.length, 1)];
    return (
      <div style={{ display: "flex", width: "100vw", height: "100vh", background: "linear-gradient(180deg, #fff8f3 0%, #ffffff 520px)", color: "#1a1a1a", fontFamily: "'Noto Sans KR', system-ui, sans-serif", overflow: "hidden" }}>
        <Toast />
        <MatchModal />

        {/* 좌: MyPiece + Lounge (세로 분할) */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden", borderRight: `1px solid ${BD}` }}>

          {/* 상단 MyPiece (30vh) */}
          <div style={{ height: "30vh", overflowY: "auto", borderBottom: `1px solid ${BD}`, padding: "16px 20px", display: "flex", gap: 16, alignItems: "flex-start" }}>
            {/* 매치 카드 */}
            <div style={{ flexShrink: 0, width: 200 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 17, fontWeight: 900, background: `linear-gradient(135deg,${A},${AS})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>MyPiece</span>
                <button onClick={() => setShowGF(!showGF)} style={{ padding: "3px 10px", borderRadius: 16, background: SL, border: `1px solid ${BD}`, color: "#666", fontSize: 10, cursor: "pointer" }}>
                  {gFilter === "all" ? "🫂" : gFilter === "F" ? "👩" : "👨"} Filter
                </button>
              </div>
              {showGF && (
                <div style={{ marginBottom: 8, padding: "8px 10px", borderRadius: 10, background: SL, border: `1px solid ${BD}`, display: "flex", gap: 4 }}>
                  {[{ v: "all", l: "All" }, { v: "F", l: "👩 Her" }, { v: "M", l: "👨 Him" }].map(o => (
                    <button key={o.v} onClick={() => { setGFilter(o.v); setShowGF(false); setSwpI(0); }}
                      style={{ flex: 1, padding: "6px 0", borderRadius: 6, border: `1px solid ${gFilter === o.v ? A : BD}`, background: gFilter === o.v ? A+"18" : "transparent", color: gFilter === o.v ? A : "#888", fontSize: 11, cursor: "pointer" }}>{o.l}</button>
                  ))}
                </div>
              )}
              {m && (
                <div style={{ background: `linear-gradient(160deg,${SF},${SL})`, borderRadius: 16, border: `1px solid ${BD}`, overflow: "hidden" }}>
                  <div style={{ height: 80, background: `linear-gradient(135deg,${A}20,${AD}20)`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                    <div style={{ width: 44, height: 44, borderRadius: "50%", background: `linear-gradient(135deg,${A},${AD})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: "#fff" }}>{m.name[0]}</div>
                    {m.on && <div style={{ position: "absolute", top: 8, right: 8, width: 8, height: 8, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 6px #4ade8066" }} />}
                    <div style={{ position: "absolute", top: 8, left: 8 }}><Badge has={m.badge} /></div>
                    <div style={{ position: "absolute", bottom: 6, right: 8, background: "#000a", borderRadius: 6, padding: "2px 7px" }}>
                      <span style={{ fontSize: 12, fontWeight: 900, color: mc(m.pct) }}>{m.pct}%</span>
                    </div>
                  </div>
                  <div style={{ padding: "8px 10px" }}>
                    <div style={{ fontSize: 13, fontWeight: 800 }}>{m.name}{(m.age > 0 || m.g) && <span style={{ fontSize: 10, color: "#555", fontWeight: 400 }}> {m.age > 0 ? m.age : ""}{m.age > 0 && m.g ? " " : ""}{m.g}</span>}</div>
                    <div style={{ display: "flex", gap: 5, marginTop: 5 }}>
                      <button onClick={() => setSwpI(i => i + 1)} style={{ width: 34, height: 34, borderRadius: "50%", background: SL, border: `2px solid ${BD}`, color: "#999", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>👋</button>
                      <button onClick={() => { handleLike(m); }}
                        style={{ flex: 1, height: 34, borderRadius: 17, background: `linear-gradient(135deg,${AS},${A})`, border: "none", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                        {liked.includes(m.id) ? "❤️" : "🤍"} {t("like")}
                      </button>
                      <button onClick={() => { setChatU(m); setMsgs(m.lm ? [{ id: 1, from: "them", text: m.lm, time: "now" }] : []); }}
                        style={{ width: 34, height: 34, borderRadius: "50%", background: `linear-gradient(135deg,${A},${AD})`, border: "none", color: "#fff", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>💌</button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 우측: 통계 + 온라인 */}
            <div style={{ flex: 1 }}>
              {/* 매칭 통계 4열 */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6, marginBottom: 10 }}>
                {[
                  { label: "Likes", value: liked.length, icon: "💕", color: A },
                  { label: "Matches", value: matches.length, icon: "✨", color: "#fbbf24" },
                  { label: "Visitors", value: 24, icon: "👀", color: "#60a5fa" },
                  { label: "Match %", value: "78%", icon: "📈", color: "#4ade80" },
                ].map(stat => (
                  <div key={stat.label} style={{ background: SL, borderRadius: 10, padding: "8px 10px", border: `1px solid ${BD}`, textAlign: "center" }}>
                    <div style={{ fontSize: 14, marginBottom: 2 }}>{stat.icon}</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: stat.color }}>{stat.value}</div>
                    <div style={{ fontSize: 9, color: "#555" }}>{stat.label}</div>
                  </div>
                ))}
              </div>
              {/* 신규 멤버 */}
              {users.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#555", marginBottom: 7, display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ fontSize: 11 }}>🌟</span>
                    New Members
                  </div>
                  <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
                    {users.slice(0, 12).map(u => (
                      <div key={u.id}
                        style={{ flexShrink: 0, textAlign: "center" }}>
                        <div style={{ width: 38, height: 38, margin: "0 auto 3px", borderRadius: "50%", background: `linear-gradient(135deg,${A},${AD})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff", border: `2px solid ${A}` }}>{u.name[0]}</div>
                        <div style={{ fontSize: 9, color: "#888", maxWidth: 38, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 하단 Lounge (flex:1) */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 2px" }}>{t("lounge")}</h2>
                <p style={{ fontSize: 10, color: "#555", margin: 0 }}>Browse profiles</p>
              </div>
              <div style={{ display: "flex", gap: 5 }}>
                {[{ v: "all", l: "All" }, { v: "F", l: "👩 Her" }, { v: "M", l: "👨 Him" }].map(o => (
                  <button key={o.v} onClick={() => { setGFilter(o.v); setSwpI(0); }}
                    style={{ padding: "4px 10px", borderRadius: 14, border: `1px solid ${gFilter === o.v ? A : BD}`, background: gFilter === o.v ? A+"18" : "transparent", color: gFilter === o.v ? A : "#666", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>{o.l}</button>
                ))}
              </div>
            </div>

            {/* 인기 피스 태그 */}
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 14 }}>
              {P().slice(0, 8).map((p, i) => (
                <span key={i} style={{ padding: "3px 9px", borderRadius: 20, background: intP.includes(i) ? A+"22" : SF, border: `1px solid ${intP.includes(i) ? A : BD}`, color: intP.includes(i) ? A : "#666", fontSize: 10, cursor: "pointer" }}>#{p}</span>
              ))}
            </div>

            {/* 유저 그리드 */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 8, marginBottom: 20 }}>
              {filteredUsers.map(u => (
                <div key={u.id} onClick={() => { setPhotoT(u); setScr(SC.UPROF); }}
                  style={{ borderRadius: 12, background: SL, border: `1px solid ${BD}`, cursor: "pointer", overflow: "hidden" }}>
                  <div style={{ height: 80, background: `linear-gradient(135deg,${A}15,${AD}15)`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: u.v ? `linear-gradient(135deg,${A},${AD})` : "#e8d8d0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#fff" }}>{u.name[0]}</div>
                    {u.on && <div style={{ position: "absolute", top: 5, right: 5, width: 7, height: 7, borderRadius: "50%", background: "#4ade80" }} />}
                    {u.badge && <div style={{ position: "absolute", top: 5, left: 5, fontSize: 8, background: "#ffffff99", padding: "1px 4px", borderRadius: 4 }}>⭐</div>}
                    <div style={{ position: "absolute", bottom: 5, right: 5, fontSize: 10, fontWeight: 800, color: mc(u.pct) }}>{u.pct}%</div>
                  </div>
                  <div style={{ padding: "6px 8px" }}>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{u.name}{u.age > 0 && <span style={{ fontSize: 9, color: "#555", fontWeight: 400 }}> {u.age}</span>}</div>
                    {u.region && <div style={{ fontSize: 9, color: "#555", marginTop: 1 }}>{u.region}</div>}
                    <div style={{ display: "flex", gap: 3, marginTop: 4, flexWrap: "wrap" }}>
                      {u.mp.slice(0, 2).map(i => <span key={i} style={{ fontSize: 7, padding: "1px 4px", borderRadius: 3, background: A+"18", color: A }}>{P()[i]}</span>)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 나를 봤을 수도 있는 사람 (블러) */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#555" }}>👀 나를 본 사람</div>
                <span style={{ fontSize: 9, color: "#555" }}>클릭해서 프로필 보기</span>
              </div>
              <div style={{ display: "flex", gap: 7 }}>
                {users.slice(0, 4).map(u => (
                  <div key={u.id} onClick={() => { setPhotoT(u); setScr(SC.UPROF); }} style={{ flexShrink: 0, textAlign: "center", cursor: "pointer" }}>
                    <div style={{ width: 44, height: 44, borderRadius: "50%", background: `linear-gradient(135deg,${A},${AD})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "#fff", margin: "0 auto 3px", filter: "blur(5px)", transition: "filter 0.2s" }}
                      onMouseEnter={e => e.currentTarget.style.filter = "none"}
                      onMouseLeave={e => e.currentTarget.style.filter = "blur(5px)"}
                    >{u.name[0]}</div>
                    <div style={{ fontSize: 9, color: "#444" }}>?</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Picks */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#555", marginBottom: 8 }}>✨ Top Picks</div>
              {users.filter(u => u.pct >= 80).map(u => (
                <div key={u.id} onClick={() => { setPhotoT(u); setScr(SC.UPROF); }}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 10, background: SL, border: `1px solid ${BD}`, marginBottom: 6, cursor: "pointer" }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: `linear-gradient(135deg,${A},${AD})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0, position: "relative" }}>
                    {u.name[0]}
                    {u.on && <div style={{ position: "absolute", bottom: 0, right: 0, width: 8, height: 8, borderRadius: "50%", background: "#4ade80", border: "2px solid #ffffff" }} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{u.name}{(u.age > 0 || u.g) && <span style={{ fontSize: 9, color: "#555", fontWeight: 400 }}> {u.age > 0 ? u.age : ""}{u.age > 0 && u.g ? " " : ""}{u.g}</span>}</div>
                    {u.bio && <div style={{ fontSize: 10, color: "#777", marginTop: 1 }}>{u.bio}</div>}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 900, color: mc(u.pct) }}>{u.pct}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 우: 채팅 340px */}
        <div style={{ width: 340, flexShrink: 0, height: "100vh", display: "flex", flexDirection: "column", borderLeft: `1px solid ${BD}` }}>
          {!chatU ? (
            <div style={{ padding: "20px 20px", overflowY: "auto" }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 14px" }}>{t("chat")}</h2>
              {matches.map(u => (
                <div key={u.id} onClick={() => { setChatU(u); setMsgs([]); }}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: `1px solid ${BD}`, cursor: "pointer" }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: `linear-gradient(135deg,${A},${AD})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#fff", flexShrink: 0, position: "relative" }}>
                    {u.name[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontWeight: 700, fontSize: 13 }}>{u.name} {u.badge && <span style={{ fontSize: 10 }}>⭐</span>}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "#555", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.lm || "👋 새 매치 · 대화를 시작해보세요"}</div>
                  </div>
                </div>
              ))}
              {matches.length === 0 && (
                <div style={{ textAlign: "center", color: "#444", fontSize: 13, marginTop: 40 }}>아직 매치가 없어요 · 스와이프해서 좋아요를 눌러보세요 ✨</div>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
              <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, borderBottom: `1px solid ${BD}`, background: SF }}>
                <button onClick={() => setChatU(null)} style={{ background: "none", border: "none", color: "#666", fontSize: 18, cursor: "pointer" }}>‹</button>
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
                    <div style={{ padding: "9px 14px", borderRadius: 18, background: msg.from === "me" ? `linear-gradient(135deg,${A},${AD})` : SL, color: msg.from === "me" ? "#fff" : "#1a1a1a", fontSize: 13, lineHeight: 1.5, borderBottomRightRadius: msg.from === "me" ? 4 : 18, borderBottomLeftRadius: msg.from === "me" ? 18 : 4 }}>{msg.text}</div>
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
              <div style={{ padding: "8px 12px", display: "flex", gap: 6, alignItems: "center", borderTop: `1px solid ${BD}`, background: SF }}>
                <input style={{ flex: 1, padding: "10px 16px", borderRadius: 20, background: SF, border: `1px solid ${BD}`, color: "#1a1a1a", fontSize: 13, outline: "none" }}
                  placeholder={t("msgPh")} maxLength={500} value={inp} onChange={e => setInp(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMsg()} />
                <button onClick={sendMsg} style={{ width: 38, height: 38, borderRadius: "50%", background: inp.trim() ? `linear-gradient(135deg,${A},${AD})` : SL, border: "none", color: "#fff", fontSize: 17, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>🚀</button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ═══ HOME — 스와이프 디스커버 ═══
  if (scr === SC.HOME) {
    const pool = filteredUsers.filter(u => !liked.includes(u.id) && (u.mp.some(x => intP.includes(x)) || u.ip.some(x => myP.includes(x))));
    const m = pool[swpI % Math.max(pool.length, 1)];
    return (
      <div style={{ ...base, paddingBottom: 72 }}>
        <Head><title>MyPiece - Discover</title></Head>
        <Toast />
        <MatchModal />
        <div style={{ padding: "16px 24px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{
            fontSize: 24, fontWeight: 900,
            background: `linear-gradient(135deg,${A},${AS})`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
          }}>MyPiece</span>
          <button onClick={() => setShowGF(!showGF)} style={{
            padding: "6px 14px", borderRadius: 20, background: SL,
            border: `1px solid ${BD}`, color: "#666", fontSize: 12, cursor: "pointer"
          }}>
            {gFilter === "all" ? "🫂" : gFilter === "F" ? "👩" : "👨"} Filter
          </button>
        </div>

        {showGF && (
          <div style={{ margin: "0 24px 12px", padding: "12px 16px", borderRadius: 14, background: SL, border: `1px solid ${BD}`, display: "flex", gap: 8 }}>
            {[{ v: "all", l: "All" }, { v: "F", l: "👩 Female" }, { v: "M", l: "👨 Male" }].map(o => (
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: "#888" }}>{t("swipeHint")}</div>
            <div style={{ fontSize: 11, color: A, fontWeight: 700, background: A+"15", padding: "3px 10px", borderRadius: 10 }}>
              {pool.length} nearby
            </div>
          </div>
          {!m && (
            <div style={{ textAlign: "center", padding: "40px 20px", background: SF, borderRadius: 24, border: `1px solid ${BD}` }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>✨</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#444", marginBottom: 6 }}>모두 확인했어요!</div>
              <div style={{ fontSize: 13, color: "#888" }}>라운지에서 더 많은 사람을 만나보세요</div>
            </div>
          )}
          {m && (
            <div
              onTouchStart={e => { dragStartX.current = e.touches[0].clientX; dragXRef.current = 0; setDragX(0); }}
              onTouchMove={e => {
                if (dragStartX.current === null) return;
                const dx = e.touches[0].clientX - dragStartX.current;
                dragXRef.current = dx;
                setDragX(dx);
              }}
              onTouchEnd={() => {
                const dx = dragXRef.current;
                dragStartX.current = null;
                dragXRef.current = 0;
                setDragX(0);
                if (dx > 80) handleLike(m);
                else if (dx < -80) setSwpI(i => i + 1);
              }}
              style={{
                background: `linear-gradient(160deg,${SF},${SL})`,
                borderRadius: 24, border: `1px solid ${BD}`, overflow: "hidden",
                transform: dragX !== 0 ? `translateX(${dragX * 0.4}px) rotate(${dragX * 0.04}deg)` : "none",
                transition: dragX !== 0 ? "none" : "transform 0.3s ease",
                userSelect: "none",
                position: "relative",
              }}>
              {dragX > 40 && <div style={{ position:"absolute", top:16, left:16, zIndex:10, background:"#4ade80cc", borderRadius:10, padding:"6px 14px", fontSize:15, fontWeight:800, color:"#fff", pointerEvents:"none" }}>❤️ LIKE</div>}
              {dragX < -40 && <div style={{ position:"absolute", top:16, right:16, zIndex:10, background:"#ff444488", borderRadius:10, padding:"6px 14px", fontSize:15, fontWeight:800, color:"#fff", pointerEvents:"none" }}>👋 PASS</div>}
              <div style={{
                height: 260, background: `linear-gradient(160deg,${A}15,${AD}30)`,
                display: "flex", alignItems: "center", justifyContent: "center", position: "relative"
              }}>
                <div style={{
                  width: 110, height: 110, borderRadius: "50%",
                  background: `linear-gradient(135deg,${A},${AD})`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 44, fontWeight: 700, color: "#fff",
                  boxShadow: `0 8px 32px ${A}44`
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
                  background: "rgba(0,0,0,0.55)", borderRadius: 10, padding: "4px 12px"
                }}>
                  <span style={{ fontSize: 18, fontWeight: 900, color: mc(m.pct) }}>{m.pct}%</span>
                </div>
              </div>
              <div style={{ padding: "16px 20px" }}>
                <div style={{ fontSize: 20, fontWeight: 800 }}>
                  {m.name}{(m.age > 0 || m.g) && <span style={{ fontSize: 14, color: "#555", fontWeight: 400 }}> {m.age > 0 ? m.age : ""}{m.age > 0 && m.g ? " " : ""}{m.g}</span>}
                </div>
                <div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>
                  {m.region ? `${m.region} · ` : ""}{m.on ? t("online") : m.la}
                </div>
                {m.bio && <p style={{ fontSize: 13, color: "#999", margin: "10px 0", lineHeight: 1.5 }}>{m.bio}</p>}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
                  {m.mp.map(i => (
                    <span key={"m"+i} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 8, background: A+"18", color: A }}>✨ {P()[i]}</span>
                  ))}
                  {m.ip.map(i => (
                    <span key={"i"+i} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 8, background: AS+"18", color: AS }}>🤍 {P()[i]}</span>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => setSwpI(i => i + 1)} style={{
                    width: 54, height: 54, borderRadius: "50%", background: SL,
                    border: `2px solid ${BD}`, color: "#999", fontSize: 26,
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
                  }}>👋</button>
                  <button onClick={() => { handleLike(m); }} style={{
                    flex: 1, height: 54, borderRadius: 27,
                    background: liked.includes(m.id) ? `${A}88` : `linear-gradient(135deg,${AS},${A})`,
                    border: "none", color: "#fff", fontSize: 16, fontWeight: 700,
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    transition: "all 0.2s"
                  }}>
                    {liked.includes(m.id) ? "❤️ Liked!" : "🤍 " + t("like")}
                  </button>
                  <button onClick={() => openChat(m)} style={{
                    width: 54, height: 54, borderRadius: "50%",
                    background: `linear-gradient(135deg,${A},${AD})`,
                    border: "none", color: "#fff", fontSize: 22,
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
                  }}>💌</button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: "20px 24px" }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: "#555" }}>{t("chat")}</h3>
          {matches.slice(0, 4).map(u => (
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
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>
                    {u.name} {u.badge && <span style={{ fontSize: 10 }}>⭐</span>}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: "#555", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.lm || "👋 새 매치 · 대화를 시작해보세요"}</div>
              </div>
            </div>
          ))}
          {matches.length === 0 && (
            <div style={{ textAlign: "center", color: "#888", fontSize: 13, padding: "20px 0" }}>아직 매치가 없어요 ✨</div>
          )}
        </div>
        <Nav />
      </div>
    );
  }

  // ═══ 채팅 목록 ═══
  if (scr === SC.CHATLIST) {
    // chatPartners(실제 대화한 사람) + matches(매치만 된 사람) 합치되 중복 제거
    const partnerIds = new Set(chatPartners.map(p => p.id));
    const matchOnly = matches.filter(m => !partnerIds.has(m.id));
    const allList = [...chatPartners, ...matchOnly];
    return (
      <div style={{ ...base, paddingBottom: 72 }}>
        <Head><title>MyPiece - Chat</title></Head>
        <Toast />
        <div style={{ padding: "20px 24px 12px" }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>💌 {t("chat")}</h2>
          <p style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
            {chatPartners.length}개 대화 · {matches.length}개 매치
          </p>
        </div>

        <div style={{ padding: "0 24px" }}>
          {allList.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>💌</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#444", marginBottom: 8 }}>아직 대화가 없어요</div>
              <div style={{ fontSize: 13, color: "#888" }}>홈에서 누군가에게 💌를 보내거나 매치되면 여기 표시돼요 ✨</div>
            </div>
          ) : (
            allList.map(u => {
              const isChat = partnerIds.has(u.id);
              return (
                <div key={u.id} onClick={() => openChat(u)} style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "14px 0", borderBottom: `1px solid ${BD}`, cursor: "pointer"
                }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: "50%",
                    background: `linear-gradient(135deg,${A},${AD})`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 20, fontWeight: 700, color: "#fff", flexShrink: 0
                  }}>{u.name[0]}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 700, fontSize: 15 }}>
                        {u.name}{u.badge && <span style={{ fontSize: 11, marginLeft: 4 }}>⭐</span>}
                        {!isChat && <span style={{ fontSize: 9, marginLeft: 6, padding: "2px 6px", borderRadius: 6, background: A+"22", color: A, fontWeight: 700 }}>NEW</span>}
                      </span>
                      <span style={{ fontSize: 11, color: A, fontWeight: 700 }}>{u.pct}%</span>
                    </div>
                    <div style={{ fontSize: 13, color: "#888", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {u.lm || "👋 대화를 시작해보세요"}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <Nav />
      </div>
    );
  }

  // ═══ 채팅 ═══
  if (scr === SC.CHAT && chatU) return (
    <div style={{ ...base, display: "flex", flexDirection: "column", height: "calc(100vh - 62px)", minHeight: 0 }}>
      <Head><title>MyPiece - Chat</title></Head>
      <Toast />
      <div style={{
        padding: "12px 16px", display: "flex", alignItems: "center", gap: 12,
        borderBottom: `1px solid ${BD}`, background: SF
      }}>
        <button onClick={back} style={{ background: "none", border: "none", color: "#666", fontSize: 22, cursor: "pointer" }}>‹</button>
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
              {chatU.name} {chatU.badge && <span style={{ fontSize: 10 }}>⭐</span>}
            </div>
            <div style={{ fontSize: 10, color: chatU.on ? "#4ade80" : "#555" }}>
              {chatU.on ? t("online") : t("offline")}
            </div>
          </div>
        </div>
        <button onClick={() => setShowChatMenu(true)}
          style={{ background: SL, border: `1px solid ${BD}`, borderRadius: 10, padding: "6px 12px", color: "#555", fontSize: 13, cursor: "pointer" }}>
          ···
        </button>
      </div>

      {/* 채팅 메뉴 시트 */}
      {showChatMenu && (
        <div onClick={() => setShowChatMenu(false)} style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", justifyContent: "center"
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            width: "100%", maxWidth: 480, background: SF,
            borderTopLeftRadius: 20, borderTopRightRadius: 20,
            padding: "12px 16px 28px", animation: "matchPop 0.25s ease both"
          }}>
            <div style={{ width: 40, height: 4, background: BD, borderRadius: 2, margin: "0 auto 14px" }} />
            <div style={{ fontSize: 12, color: "#888", textAlign: "center", marginBottom: 10 }}>{chatU.name}</div>
            <button onClick={() => { setShowChatMenu(false); setRepT(chatU); setRepDone(false); setRepR(""); go(SC.REPORT); }}
              style={{ width: "100%", padding: "16px 0", background: SL, border: `1px solid ${BD}`, borderRadius: 12, marginBottom: 8, fontSize: 15, color: "#444", cursor: "pointer" }}>
              🚨 신고하기
            </button>
            <button onClick={() => { setShowChatMenu(false); if (window.confirm(`${chatU.name}님과의 매치를 해제할까요?`)) { handleUnlike(chatU); back(); } }}
              style={{ width: "100%", padding: "16px 0", background: SL, border: `1px solid ${BD}`, borderRadius: 12, marginBottom: 8, fontSize: 15, color: "#444", cursor: "pointer" }}>
              💔 매치 해제 (좋아요 취소)
            </button>
            <button onClick={() => { setShowChatMenu(false); if (window.confirm(`${chatU.name}님을 차단할까요?`)) { handleBlock(chatU.id); } }}
              style={{ width: "100%", padding: "16px 0", background: SL, border: `1px solid ${BD}`, borderRadius: 12, marginBottom: 8, fontSize: 15, color: "#ef4444", cursor: "pointer" }}>
              🚫 차단하기
            </button>
            <button onClick={() => setShowChatMenu(false)}
              style={{ width: "100%", padding: "12px 0", background: "transparent", border: "none", fontSize: 14, color: "#888", cursor: "pointer", marginTop: 4 }}>
              취소
            </button>
          </div>
        </div>
      )}

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
              color: msg.from === "me" ? "#fff" : "#1a1a1a", fontSize: 14, lineHeight: 1.5,
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

      <div style={{ padding: "10px 14px", display: "flex", gap: 8, alignItems: "center", borderTop: `1px solid ${BD}`, background: SF }}>
        <input
          style={{ flex: 1, padding: "12px 18px", borderRadius: 24, background: SF, border: `1px solid ${BD}`, color: "#1a1a1a", fontSize: 14, outline: "none" }}
          placeholder={t("msgPh")}
          maxLength={500}
          value={inp}
          onChange={e => setInp(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMsg()}
        />
        <button onClick={sendMsg} style={{
          width: 44, height: 44, borderRadius: "50%",
          background: inp.trim() ? `linear-gradient(135deg,${A},${AD})` : SL,
          border: "none", color: "#fff", fontSize: 20,
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
        }}>🚀</button>
      </div>
      <Nav />
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
                  background: u.v ? `linear-gradient(135deg,${A},${AD})` : "#e8d8d0",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20, fontWeight: 700, color: "#fff"
                }}>{u.name[0]}</div>
                {u.on && <div style={{ position: "absolute", top: 8, right: 8, width: 9, height: 9, borderRadius: "50%", background: "#4ade80" }} />}
                {u.badge && <div style={{ position: "absolute", top: 8, left: 8, fontSize: 10, background: "#ffffff99", padding: "2px 6px", borderRadius: 6 }}>⭐</div>}
                <div style={{ position: "absolute", bottom: 8, right: 8, fontSize: 12, fontWeight: 800, color: mc(u.pct) }}>{u.pct}%</div>
              </div>
              <div style={{ padding: "10px 12px" }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{u.name}{u.age > 0 && <span style={{ fontSize: 11, color: "#555", fontWeight: 400 }}> {u.age}</span>}</div>
                {u.region && <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>{u.region}</div>}
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
      <div style={{ ...base, padding: "56px 28px 80px" }}>
        <button onClick={back} style={{ background: "none", border: "none", color: "#666", fontSize: 14, cursor: "pointer", marginBottom: 20 }}>
          ‹ Back
        </button>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{
            width: 88, height: 88, borderRadius: "50%", margin: "0 auto 16px",
            background: `linear-gradient(135deg,${A},${AD})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 32, fontWeight: 700, color: "#fff"
          }}>{u.name[0]}</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>
            {u.name}{(u.age > 0 || u.g) && <span style={{ fontSize: 14, color: "#555", fontWeight: 400 }}> {u.age > 0 ? u.age : ""}{u.age > 0 && u.g ? " " : ""}{u.g}</span>}
          </h2>
          <div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>
            {u.region ? `${u.region} · ` : ""}{u.on ? t("online") : u.la}
          </div>
          <div style={{ marginTop: 8 }}><Badge has={u.badge} size={14} /></div>
          {u.v && <div style={{ fontSize: 12, color: A, marginTop: 4 }}>⭐ {P()[u.vp]} {t("verified")}</div>}
        </div>
        {u.bio ? (
          <div style={{ background: SL, borderRadius: 14, padding: 16, marginBottom: 12, border: `1px solid ${BD}` }}>
            <div style={{ fontSize: 14, color: "#555", lineHeight: 1.6 }}>{u.bio}</div>
          </div>
        ) : null}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <div style={{ flex: 1, background: SF, borderRadius: 14, padding: 12 }}>
            <div style={{ fontSize: 11, color: "#555", marginBottom: 6 }}>✨ {t("myPiece")}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {u.mp.map(i => <span key={i} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 8, background: A+"18", color: A }}>{P()[i]}</span>)}
            </div>
          </div>
          <div style={{ flex: 1, background: SF, borderRadius: 14, padding: 12 }}>
            <div style={{ fontSize: 11, color: "#555", marginBottom: 6 }}>🤍 {t("intPiece")}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {u.ip.map(i => <span key={i} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 8, background: AS+"18", color: AS }}>{P()[i]}</span>)}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <button onClick={() => liked.includes(u.id) ? handleUnlike(u) : handleLike(u)}
            style={{ flex: 1, padding: "14px 0", borderRadius: 14,
              background: liked.includes(u.id) ? `${A}22` : AS+"15",
              border: `1px solid ${liked.includes(u.id) ? A : AS+"33"}`,
              color: liked.includes(u.id) ? A : AS,
              fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
            {liked.includes(u.id) ? "❤️ 좋아요 취소" : "🤍 " + t("like")}
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
        <Nav />
      </div>
    );
  }

  // ═══ 신고 ═══
  if (scr === SC.REPORT) return (
    <div style={{ ...base, padding: "56px 28px 80px" }}>
      <button onClick={back} style={{ background: "none", border: "none", color: "#666", fontSize: 14, cursor: "pointer", marginBottom: 20 }}>‹ Back</button>
      {repDone ? (
        <div style={{ textAlign: "center", paddingTop: 40 }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🎉</div>
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
              color: repR === r ? A : "#555", fontSize: 14, cursor: "pointer"
            }}>{r}</button>
          ))}
          <button style={btnStyle(!!repR)} onClick={() => repR && handleReport()}>{t("report")}</button>
        </div>
      )}
      <Nav />
    </div>
  );

  // ═══ 설정 ═══
  if (scr === SC.SETTINGS) return (
    <div style={{ ...base, padding: "56px 28px", paddingBottom: 80 }}>
      <button onClick={back} style={{ background: "none", border: "none", color: "#666", fontSize: 14, cursor: "pointer", marginBottom: 20 }}>‹ Back</button>
      <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 24 }}>{t("settings")}</h2>

      {/* 알림 */}
      <div style={{ background: SF, borderRadius: 16, padding: "4px 0", marginBottom: 12 }}>
        <div style={{ padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${BD}` }}>
          <span style={{ fontSize: 14, color: "#555" }}>🔔 알림</span>
          <div onClick={() => setNotifOn(v => !v)} style={{
            width: 44, height: 24, borderRadius: 12, background: notifOn ? A : "#cccccc",
            position: "relative", cursor: "pointer", transition: "background 0.2s"
          }}>
            <div style={{ position: "absolute", top: 2, left: notifOn ? 22 : 2, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
          </div>
        </div>
        <div style={{ padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 14, color: "#555" }}>🚫 차단 목록 ({blocked.length}명)</span>
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
              <span style={{ fontSize: 13, color: lang === l.code ? A : "#555" }}>{l.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 계정 */}
      <div style={{ background: SF, borderRadius: 16, padding: "4px 0" }}>
        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${BD}` }}>
          <span style={{ fontSize: 13, color: "#555" }}>이메일</span>
          <div style={{ fontSize: 14, color: "#555", marginTop: 2 }}>{authUser?.email || "-"}</div>
        </div>
        <div onClick={() => { if (confirm("정말 탈퇴하시겠어요?")) handleLogout(); }}
          style={{ padding: "14px 20px", cursor: "pointer" }}>
          <span style={{ fontSize: 14, color: "#ef4444" }}>회원 탈퇴</span>
        </div>
      </div>
      <Nav />
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
          {user?.verified && <div style={{ fontSize: 12, color: A, marginTop: 4 }}>⭐ {(user.vParts || []).map(i => P()[i]).join(", ")} {t("verified")}</div>}
        </div>
        <button onClick={() => { setEditMode(true); setEditNick(user?.nickname || ""); setEditMyP(user?.myPieces || []); setEditIntP(user?.intPieces || []); setEditAge(user?.age ? String(user.age) : ""); setEditGender(user?.gender || ""); setEditBio(user?.bio || ""); }}
          style={{ position: "absolute", right: 28, top: 60, background: SL, border: `1px solid ${BD}`, borderRadius: 10, padding: "6px 14px", color: "#888", fontSize: 13, cursor: "pointer" }}>
          수정
        </button>
      </div>

      {editMode ? (
        <div style={{ background: SF, borderRadius: 16, padding: 20, marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: "#666", marginBottom: 8 }}>닉네임</div>
          <input style={{ ...iB, marginBottom: 14 }} value={editNick} onChange={e => setEditNick(e.target.value)} maxLength={10} placeholder="닉네임 (2~10자)" />

          <div style={{ fontSize: 13, color: "#666", marginBottom: 8 }}>성별</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            {[{ v: "F", l: "👩 여성" }, { v: "M", l: "👨 남성" }].map(o => (
              <button key={o.v} onClick={() => setEditGender(o.v)} style={{
                flex: 1, padding: "10px 0", borderRadius: 10,
                border: `1px solid ${editGender === o.v ? A : BD}`,
                background: editGender === o.v ? A + "18" : "transparent",
                color: editGender === o.v ? A : "#888", fontSize: 13, fontWeight: 600, cursor: "pointer"
              }}>{o.l}</button>
            ))}
          </div>

          <div style={{ fontSize: 13, color: "#666", marginBottom: 8 }}>나이</div>
          <input style={{ ...iB, marginBottom: 14 }} type="number" min="19" max="99"
            placeholder="만 나이" value={editAge} onChange={e => setEditAge(e.target.value)} />

          <div style={{ fontSize: 13, color: "#666", marginBottom: 8 }}>자기소개</div>
          <textarea style={{ ...iB, height: 72, resize: "none", marginBottom: 16, fontFamily: "inherit" }}
            placeholder="나를 한 문장으로 소개해보세요" value={editBio}
            onChange={e => setEditBio(e.target.value)} maxLength={100} />

          <div style={{ fontSize: 13, color: "#666", marginBottom: 8 }}>✨ 자신있는 피스 (최대 3개)</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
            {P().map((p, i) => (
              <button key={i} style={chip(editMyP.includes(i), A)} onClick={() => setEditMyP(prev => prev.includes(i) ? prev.filter(x => x !== i) : prev.length < 3 ? [...prev, i] : prev)}>{p}</button>
            ))}
          </div>

          <div style={{ fontSize: 13, color: "#666", marginBottom: 8 }}>🤍 관심있는 피스 (최대 3개)</div>
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
          {(user?.age || user?.gender || user?.bio) && (
            <div style={{ background: SF, borderRadius: 14, padding: "12px 16px", marginBottom: 12 }}>
              {(user?.age || user?.gender) && (
                <div style={{ fontSize: 13, color: "#444", marginBottom: user?.bio ? 6 : 0 }}>
                  {user?.age && <span>{user.age}세</span>}
                  {user?.age && user?.gender && <span> · </span>}
                  {user?.gender && <span>{user.gender === "F" ? "👩 여성" : "👨 남성"}</span>}
                </div>
              )}
              {user?.bio && <div style={{ fontSize: 13, color: "#666", lineHeight: 1.5 }}>{user.bio}</div>}
            </div>
          )}

          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <div style={{ flex: 1, background: SF, borderRadius: 14, padding: 12 }}>
              <div style={{ fontSize: 11, color: "#555", marginBottom: 6 }}>✨ {t("myPiece")}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {user?.myPieces?.map(i => <span key={i} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 8, background: A+"18", color: A }}>{P()[i]}</span>)}
              </div>
            </div>
            <div style={{ flex: 1, background: SF, borderRadius: 14, padding: 12 }}>
              <div style={{ fontSize: 11, color: "#555", marginBottom: 6 }}>🤍 {t("intPiece")}</div>
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
            cursor: "pointer", color: item.l === t("logout") ? A : "#333"
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
