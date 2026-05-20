import { NextRequest, NextResponse } from 'next/server';
import {
  copyBytesToArrayBuffer,
  createInvitationPdfBytes,
  getSafeInvitationFileName,
  normalizeFirstName,
} from '@/lib/invitationPdf';
import {
  getTelegramAdminChatId,
  getTelegramBotToken,
  getTelegramConfigStatus,
  sendTelegramMessage,
} from '@/lib/telegram';

export const runtime = 'nodejs';

function normalizeAttendance(value: unknown): 'yes' | 'no' | null {
  if (value === 'yes' || value === 'no') return value;
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const firstName = normalizeFirstName(body?.firstName);
    const attendance = normalizeAttendance(body?.attendance);
    const isRegenerate = Boolean(body?.isRegenerate);

    if (!firstName || !attendance) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Send Telegram notification unless this is a regeneration request.
    if (!isRegenerate) {
      const botToken = getTelegramBotToken();
      const chatId = getTelegramAdminChatId();

      if (botToken && chatId) {
        const safeAttendance = attendance === 'yes' ? 'Ha, albatta boraman ✅' : 'Yoq, afsuski ❌';
        const message = `🎉 Yangi RSVP!\n\nIsm: ${firstName}\nQatnashish: ${safeAttendance}`;

        try {
          const telegramResult = await sendTelegramMessage(botToken, chatId, message);

          if (!telegramResult.ok) {
            console.error('RSVP Telegram notification failed:', telegramResult.status, telegramResult.body);
          }
        } catch (err) {
          console.error('RSVP Telegram notification error:', err);
        }
      } else {
        console.warn('RSVP Telegram notification skipped:', getTelegramConfigStatus());
      }
    }

    // Generate PDF if attending.
    if (attendance === 'yes') {
      try {
        const pdfBytes = await createInvitationPdfBytes(firstName);

        return new NextResponse(copyBytesToArrayBuffer(pdfBytes), {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${getSafeInvitationFileName(firstName)}"`,
          },
        });
      } catch (pdfError) {
        console.error('Error generating PDF:', pdfError);
        return NextResponse.json({ error: 'Failed to generate PDF. Make sure /public/taklifnoma.pdf exists.' }, { status: 500 });
      }
    }

    // If not attending, return a success response without attachment.
    return NextResponse.json({ success: true, message: 'RSVP received.' }, { status: 200 });
  } catch (error) {
    console.error('RSVP error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const firstName = normalizeFirstName(url.searchParams.get('firstName'));
    const attendance = normalizeAttendance(url.searchParams.get('attendance'));

    if (!firstName || attendance !== 'yes') {
      return NextResponse.json({ error: 'Missing or invalid params' }, { status: 400 });
    }

    // Generate personalized PDF (reuse POST logic)
    const pdfBytes = await createInvitationPdfBytes(firstName);

    return new NextResponse(copyBytesToArrayBuffer(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${getSafeInvitationFileName(firstName)}"`,
        'Cache-Control': 'public, max-age=60',
      },
    });
  } catch (err) {
    console.error('GET RSVP error:', err);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
