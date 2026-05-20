import { NextRequest, NextResponse } from 'next/server';
import {
  createInvitationPdfBlob,
  getSafeInvitationFileName,
} from '@/lib/invitationPdf';
import {
  getTelegramBotToken,
  getTelegramConfigStatus,
  sendTelegramDocument,
  sendTelegramLocation,
  sendTelegramMessage,
} from '@/lib/telegram';
import {
  GOOGLE_MAPS_URL,
  VENUE_ADDRESS,
  VENUE_LATITUDE,
  VENUE_LONGITUDE,
  VENUE_NAME,
  YANDEX_MAPS_URL,
} from '@/lib/venue';

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

export async function POST(req: NextRequest) {
  try {
    const update = (await req.json()) as TelegramUpdate;
    const text = update.message?.text ?? '';
    const chatId = update.message?.chat?.id;
    const payload = getStartPayload(text);
    const botToken = getTelegramBotToken();

    if (!chatId) {
      return NextResponse.json({ ok: true });
    }

    if (!botToken) {
      console.error('Telegram webhook skipped:', getTelegramConfigStatus());
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

    try {
      const firstName = decodeStartPayload(payload);
      const pdfBlob = await createInvitationPdfBlob(firstName);
      const telegramResult = await sendTelegramDocument(
        botToken,
        chatId,
        pdfBlob,
        getSafeInvitationFileName(firstName),
        `Tabriklaymiz, ${firstName}! Shaxsiy taklifnomangiz tayyor. Sizni kutamiz!`
      );

      if (telegramResult.ok) {
        const locationResult = await sendTelegramLocation(
          botToken,
          chatId,
          VENUE_LATITUDE,
          VENUE_LONGITUDE
        );

        if (!locationResult.ok) {
          console.error('Telegram sendLocation failed:', locationResult.status, locationResult.body);
        }

        const mapLinksResult = await sendTelegramMessage(
          botToken,
          chatId,
          `To'yxona manzili:\n${VENUE_NAME}\n${VENUE_ADDRESS}\n\nGoogle Maps: ${GOOGLE_MAPS_URL}\nYandex Navigator: ${YANDEX_MAPS_URL}`
        );

        if (!mapLinksResult.ok) {
          console.error('Telegram venue links failed:', mapLinksResult.status, mapLinksResult.body);
        }

        return NextResponse.json({ ok: true });
      }

      console.error('Telegram sendDocument failed:', telegramResult.status, telegramResult.body);
    } catch (error) {
      console.error('Telegram invitation delivery failed:', error);
    }

    try {
      await sendTelegramMessage(
        botToken,
        chatId,
        "Kechirasiz, taklifnomani yuborishda xatolik yuz berdi. Iltimos, birozdan so'ng qayta urinib ko'ring."
      );
    } catch (error) {
      console.error('Telegram fallback error message failed:', error);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({ ok: true });
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    route: 'telegram-webhook',
    ...getTelegramConfigStatus(),
  });
}
