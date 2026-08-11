import { readFile } from "fs/promises";
import path from "path";
import QRCode from "qrcode";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { getEmailSiteUrl } from "@/lib/site";

export function revealUrl(token: string): string {
  return `${getEmailSiteUrl()}/reveal/${token}`;
}

const QR_DARK = "#1c1914";
const QR_LIGHT = "#f9f7f2";

/** High-ECC QR PNG (logo composited separately for stickers / client UI). */
export async function generateRevealQrPng(
  token: string,
  size = 512,
): Promise<Buffer> {
  const url = revealUrl(token);
  return QRCode.toBuffer(url, {
    type: "png",
    width: size,
    margin: 3,
    errorCorrectionLevel: "H",
    color: {
      dark: QR_DARK,
      light: QR_LIGHT,
    },
  });
}

export async function generateRevealQrDataUrl(token: string): Promise<string> {
  const buf = await generateRevealQrPng(token, 480);
  return `data:image/png;base64,${buf.toString("base64")}`;
}

async function loadKayIconPng(): Promise<Uint8Array | null> {
  try {
    const iconPath = path.join(process.cwd(), "public", "brand", "icon-512.png");
    const buf = await readFile(iconPath);
    return new Uint8Array(buf);
  } catch {
    return null;
  }
}

/** Printable packing sticker: Kay QR + discreet order ref only. */
export async function generateRevealStickerPdf(input: {
  token: string;
  orderNumber: string;
}): Promise<Buffer> {
  const qrPng = await generateRevealQrPng(input.token, 720);
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([240, 280]);
  const { width, height } = page.getSize();

  const cream = rgb(0.976, 0.969, 0.949);
  const gold = rgb(0.722, 0.604, 0.416);
  const ink = rgb(0.11, 0.1, 0.08);

  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height,
    color: cream,
  });

  const qrImage = await pdf.embedPng(qrPng);
  const qrSize = 180;
  const qrX = (width - qrSize) / 2;
  const qrY = 62;
  page.drawImage(qrImage, {
    x: qrX,
    y: qrY,
    width: qrSize,
    height: qrSize,
  });

  const iconBytes = await loadKayIconPng();
  if (iconBytes) {
    try {
      const logo = await pdf.embedPng(iconBytes);
      const badge = 34;
      const logoSize = 20;
      const lx = qrX + (qrSize - logoSize) / 2;
      const ly = qrY + (qrSize - logoSize) / 2;
      const bx = qrX + (qrSize - badge) / 2;
      const by = qrY + (qrSize - badge) / 2;

      // Soft underlay + white plate + gold ring (approx rounded via inset rects)
      page.drawRectangle({
        x: bx - 2,
        y: by - 2,
        width: badge + 4,
        height: badge + 4,
        color: cream,
      });
      page.drawRectangle({
        x: bx,
        y: by,
        width: badge,
        height: badge,
        color: rgb(1, 1, 1),
        borderColor: gold,
        borderWidth: 1.5,
      });
      page.drawImage(logo, {
        x: lx,
        y: ly,
        width: logoSize,
        height: logoSize,
      });
    } catch {
      // continue without logo if embed fails
    }
  }

  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const label = input.orderNumber;
  const fontSize = 9;
  const textWidth = font.widthOfTextAtSize(label, fontSize);
  page.drawText(label, {
    x: (width - textWidth) / 2,
    y: 34,
    size: fontSize,
    font,
    color: ink,
  });
  page.drawText("Kay Reveal", {
    x: (width - font.widthOfTextAtSize("Kay Reveal", 8)) / 2,
    y: 18,
    size: 8,
    font,
    color: gold,
  });

  const bytes = await pdf.save();
  return Buffer.from(bytes);
}
