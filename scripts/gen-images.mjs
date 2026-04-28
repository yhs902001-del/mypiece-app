import sharp from "sharp";
import { writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "..", "public");

// ─── OG Image 1200×630 ───────────────────────────────────────────────────────
const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#fff8f3"/>
      <stop offset="60%" stop-color="#fff3ee"/>
      <stop offset="100%" stop-color="#fde8dc"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="45%" r="55%">
      <stop offset="0%" stop-color="#FF9B7A" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="#FF9B7A" stop-opacity="0"/>
    </radialGradient>
    <filter id="shadow">
      <feDropShadow dx="0" dy="4" stdDeviation="12" flood-color="#FF6B45" flood-opacity="0.18"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#glow)"/>

  <!-- Decorative circles -->
  <circle cx="120" cy="120" r="180" fill="#FF6B45" opacity="0.06"/>
  <circle cx="1100" cy="520" r="220" fill="#FF6B45" opacity="0.07"/>
  <circle cx="1050" cy="80" r="100" fill="#FF9B7A" opacity="0.08"/>
  <circle cx="180" cy="560" r="130" fill="#FF9B7A" opacity="0.06"/>

  <!-- Piece dots — decorative -->
  <circle cx="340" cy="490" r="8" fill="#FF6B45" opacity="0.3"/>
  <circle cx="380" cy="510" r="5" fill="#FF6B45" opacity="0.2"/>
  <circle cx="820" cy="140" r="6" fill="#FF6B45" opacity="0.25"/>
  <circle cx="860" cy="160" r="4" fill="#FF6B45" opacity="0.18"/>

  <!-- Brand mark — puzzle piece shape -->
  <g transform="translate(460, 130)" filter="url(#shadow)">
    <rect x="0" y="0" width="90" height="90" rx="20" fill="#FF6B45"/>
    <rect x="95" y="0" width="90" height="90" rx="20" fill="#FF6B45" opacity="0.75"/>
    <rect x="0" y="95" width="90" height="90" rx="20" fill="#FF6B45" opacity="0.75"/>
    <rect x="95" y="95" width="90" height="90" rx="20" fill="#FF9B7A"/>
    <!-- connector dots -->
    <circle cx="92.5" cy="45" r="14" fill="#fff8f3"/>
    <circle cx="45" cy="92.5" r="14" fill="#fff8f3"/>
    <circle cx="142.5" cy="92.5" r="14" fill="#FF6B45" opacity="0.85"/>
    <circle cx="92.5" cy="140" r="14" fill="#fff8f3"/>
  </g>

  <!-- M + P letters inside mark -->
  <text x="490" y="200" font-family="Georgia, serif" font-size="52" font-weight="bold" fill="white" opacity="0.95">M</text>
  <text x="585" y="200" font-family="Georgia, serif" font-size="52" font-weight="bold" fill="white" opacity="0.95">P</text>

  <!-- App name -->
  <text x="600" y="320" font-family="Georgia, 'Times New Roman', serif" font-size="96" font-weight="bold"
        fill="#1a1a1a" text-anchor="middle" letter-spacing="-2">MyPiece</text>

  <!-- Tagline -->
  <text x="600" y="388" font-family="-apple-system, Helvetica Neue, sans-serif" font-size="32"
        fill="#FF6B45" text-anchor="middle" letter-spacing="1">Find Your Piece</text>

  <!-- Sub description -->
  <text x="600" y="448" font-family="-apple-system, Helvetica Neue, sans-serif" font-size="22"
        fill="#8a6a5a" text-anchor="middle">Attraction starts with what you love about yourself</text>

  <!-- Bottom bar -->
  <rect x="0" y="590" width="1200" height="40" fill="#FF6B45" opacity="0.12"/>
  <text x="600" y="614" font-family="-apple-system, Helvetica Neue, sans-serif" font-size="18"
        fill="#c04a25" text-anchor="middle" letter-spacing="0.5">mypiece.app</text>
</svg>`;

// ─── Icon 512×512 ─────────────────────────────────────────────────────────────
const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="ibg" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FF9B7A"/>
      <stop offset="100%" stop-color="#E8502A"/>
    </linearGradient>
    <radialGradient id="iglow" cx="38%" cy="30%" r="60%">
      <stop offset="0%" stop-color="white" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="white" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Rounded square background -->
  <rect width="512" height="512" rx="112" fill="url(#ibg)"/>
  <rect width="512" height="512" rx="112" fill="url(#iglow)"/>

  <!-- 2×2 puzzle piece grid -->
  <g transform="translate(80, 80)">
    <!-- TL -->
    <rect x="0" y="0" width="148" height="148" rx="28" fill="white" opacity="0.95"/>
    <!-- TR -->
    <rect x="204" y="0" width="148" height="148" rx="28" fill="white" opacity="0.78"/>
    <!-- BL -->
    <rect x="0" y="204" width="148" height="148" rx="28" fill="white" opacity="0.78"/>
    <!-- BR -->
    <rect x="204" y="204" width="148" height="148" rx="28" fill="white" opacity="0.60"/>

    <!-- Connectors (knobs) -->
    <circle cx="176" cy="74" r="26" fill="white" opacity="0.9"/>
    <circle cx="74" cy="176" r="26" fill="white" opacity="0.9"/>
    <circle cx="278" cy="176" r="26" fill="white" opacity="0.72"/>
    <circle cx="176" cy="278" r="26" fill="white" opacity="0.72"/>
  </g>
</svg>`;

async function generate() {
  await sharp(Buffer.from(ogSvg)).png({ quality: 95 }).toFile(path.join(publicDir, "og-image.png"));
  console.log("✓ og-image.png (1200×630)");

  await sharp(Buffer.from(iconSvg)).png({ quality: 95 }).toFile(path.join(publicDir, "icon.png"));
  console.log("✓ icon.png (512×512)");
}

generate().catch(console.error);
