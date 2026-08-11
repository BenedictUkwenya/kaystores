import { readFile } from "fs/promises";
import path from "path";
import QRCode from "qrcode";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { getEmailSiteUrl } from "@/lib/site";

export function revealUrl(token: string): string {
  return `${getEmailSiteUrl()}/reveal/${token}`;
}

/** High-ECC QR PNG (logo is composited in PDF sticker / client UI). */
export async function generateRevealQrPng(
  token: string,
  size = 512,
): Promise<Buffer> {
  const url = revealUrl(token);
  return QRCode.toBuffer(url, {
    type: "png",
    width: size,
    margin: 2,
    errorCorrectionLevel: "H",
    color: {
      dark: "#1a1a1a",
      light: "#f9f7f2",
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
  const qrPng = await generateRevealQrPng(input.token, 640);
  const pdf = await PDFDocument.create();
  // ~2.5" square sticker-ish at 72dpi ≈ 180pt; use larger for crisp print
  const page = pdf.addPage([220, 260]);
  const { width, height } = page.getSize();

  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height,
    color: rgb(0.976, 0.969, 0.949), // kay cream
  });

  const qrImage = await pdf.embedPng(qrPng);
  const qrSize = 170;
  const qrX = (width - qrSize) / 2;
  const qrY = 55;
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
      const logoSize = 36;
      const pad = 4;
      const lx = qrX + (qrSize - logoSize) / 2;
      const ly = qrY + (qrSize - logoSize) / 2;
      page.drawRectangle({
        x: lx - pad,
        y: ly - pad,
        width: logoSize + pad * 2,
        height: logoSize + pad * 2,
        color: rgb(0.976, 0.969, 0.949),
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
    y: 28,
    size: fontSize,
    font,
    color: rgb(0.4, 0.4, 0.4),
  });
  page.drawText("Kay Reveal", {
    x: (width - font.widthOfTextAtSize("Kay Reveal", 8)) / 2,
    y: 14,
    size: 8,
    font,
    color: rgb(0.72, 0.6, 0.42),
  });

  const bytes = await pdf.save();
  return Buffer.from(bytes);
}
