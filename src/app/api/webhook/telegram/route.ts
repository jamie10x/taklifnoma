import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export const runtime = 'nodejs';

type TelegramUpdate = {
  message?: {
    text?: string;
    chat?: {
      id?: number | string;
    };
  };
};

function decodeStartPayload(payload: string): string {
  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const decoded = Buffer.from(padded, 'base64').toString('utf8').trim().replace(/\s+/g, ' ');

    return decoded || 'Mehmon';
  } catch (error) {
    console.error('Telegram start payload decode failed:', error);
    return 'Mehmon';
  }
}

function getStartPayload(text: string): string | null {
  const match = text.match(/^\/start(?:@\w+)?\s+([A-Za-z0-9_-]+)\b/);
  return match?.[1] ?? null;
}

function isStartCommand(text: string): boolean {
  return /^\/start(?:@\w+)?(?:\s|$)/.test(text);
}

async function sendTelegramMessage(botToken: string, chatId: number | string, text: string) {
  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      text,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    console.error('Telegram sendMessage failed:', response.status, errorBody);
  }
}

async function createInvitationPdf(firstName: string): Promise<Blob> {
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

  const pdfBytes = await pdfDoc.save();
  const arrayBuffer = new ArrayBuffer(pdfBytes.byteLength);
  new Uint8Array(arrayBuffer).set(pdfBytes);

  return new Blob([arrayBuffer], { type: 'application/pdf' });
}

export async function POST(req: NextRequest) {
  try {
    const update = (await req.json()) as TelegramUpdate;
    const text = update.message?.text ?? '';
    const chatId = update.message?.chat?.id;
    const payload = getStartPayload(text);
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!chatId) {
      return NextResponse.json({ ok: true });
    }

    if (!botToken) {
      console.error('TELEGRAM_BOT_TOKEN is not configured.');
      return NextResponse.json({ ok: true });
    }

    if (!payload) {
      if (isStartCommand(text)) {
        await sendTelegramMessage(
          botToken,
          chatId,
          "Assalomu alaykum! Shaxsiy taklifnomangizni olish uchun taklifnoma sahifasidagi Telegram orqali olish tugmasini bosing."
        );
      }

      return NextResponse.json({ ok: true });
    }

    const firstName = decodeStartPayload(payload);
    const pdfBlob = await createInvitationPdf(firstName);
    const formData = new FormData();

    formData.append('chat_id', String(chatId));
    formData.append('caption', `Tabriklaymiz, ${firstName}! Shaxsiy taklifnomangiz tayyor. Sizni kutamiz!`);
    const safeFileName = firstName.replace(/[^a-zA-Z0-9\u0400-\u04FF\s-]/g, '').trim().replace(/\s+/g, '_') || 'mehmon';
    formData.append('document', pdfBlob, `taklifnoma-${safeFileName}.pdf`);

    const telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendDocument`, {
      method: 'POST',
      body: formData,
    });

    if (!telegramResponse.ok) {
      const errorBody = await telegramResponse.text().catch(() => '');
      console.error('Telegram sendDocument failed:', telegramResponse.status, errorBody);
      await sendTelegramMessage(
        botToken,
        chatId,
        "Kechirasiz, taklifnomani yuborishda xatolik yuz berdi. Iltimos, birozdan so'ng qayta urinib ko'ring."
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({ ok: true });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, route: 'telegram-webhook' });
}
