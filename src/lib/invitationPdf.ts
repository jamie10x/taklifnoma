import { readFile } from 'fs/promises';
import path from 'path';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export function normalizeFirstName(value: unknown, fallback = ''): string {
  if (typeof value !== 'string') return fallback;
  return value.trim().replace(/\s+/g, ' ') || fallback;
}

export function getSafeInvitationFileName(firstName: string) {
  const safeName = firstName.replace(/[^a-zA-Z0-9\u0400-\u04FF\s-]/g, '').trim().replace(/\s+/g, '_') || 'mehmon';
  return `taklifnoma-${safeName}.pdf`;
}

export async function createInvitationPdfBytes(firstName: string): Promise<Uint8Array> {
  const templatePath = path.join(process.cwd(), 'public', 'taklifnoma.pdf');
  const existingPdfBytes = await readFile(templatePath);

  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  const timesBoldItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanBoldItalic);

  const firstPage = pdfDoc.getPages()[0];
  const { width, height } = firstPage.getSize();
  const fontSize = 10;
  const textWidth = timesBoldItalic.widthOfTextAtSize(firstName, fontSize);

  firstPage.drawText(firstName, {
    x: width / 2 - textWidth / 2,
    y: height * 0.34,
    size: fontSize,
    font: timesBoldItalic,
    color: rgb(107 / 255, 17 / 255, 26 / 255),
  });

  return pdfDoc.save();
}

export function copyBytesToArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const arrayBuffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(arrayBuffer).set(bytes);
  return arrayBuffer;
}

export async function createInvitationPdfBlob(firstName: string): Promise<Blob> {
  const pdfBytes = await createInvitationPdfBytes(firstName);
  return new Blob([copyBytesToArrayBuffer(pdfBytes)], { type: 'application/pdf' });
}
