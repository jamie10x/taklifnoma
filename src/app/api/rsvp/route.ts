import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { readFile } from 'fs/promises';
import path from 'path';

function normalizeAttendance(value: unknown): 'yes' | 'no' | null {
  if (value === 'yes' || value === 'no') return value;
  return null;
}

function normalizeFirstName(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/\s+/g, ' ');
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
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      const chatId = process.env.CHAT_ID;

      if (botToken && chatId) {
        const safeAttendance = attendance === 'yes' ? 'Ha, albatta ✅' : 'Yoq, afsuski ❌';
        const message = `🎉 Yangi RSVP!\n\nIsm: ${firstName}\nQatnashish: ${safeAttendance}`;

        try {
          const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              chat_id: chatId,
              text: message,
            }),
          });
          
          if (!tgRes.ok) {
            const errorData = await tgRes.json();
            console.error('Telegram API error details:', errorData);
          }
        } catch (err) {
          console.error('Telegram fetch failed:', err);
        }
      } else {
        console.warn('Telegram credentials not found in environment variables.');
      }
    }

    // Generate PDF if attending.
    if (attendance === 'yes') {
      try {
        const templatePath = path.join(process.cwd(), 'public', 'taklifnoma.pdf');
        const existingPdfBytes = await readFile(templatePath);

        const pdfDoc = await PDFDocument.load(existingPdfBytes);
        const timesBoldItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanBoldItalic);

        const pages = pdfDoc.getPages();
        const firstPage = pages[0];
        const { width, height } = firstPage.getSize();

        const fontSize = 10;
        const textWidth = timesBoldItalic.widthOfTextAtSize(firstName, fontSize);
        const safeFileName = firstName.replace(/[^a-zA-Z0-9\u0400-\u04FF\s-]/g, '').trim().replace(/\s+/g, '_') || 'guest';

        firstPage.drawText(firstName, {
          x: width / 2 - textWidth / 2,
          y: height * 0.34,
          size: fontSize,
          font: timesBoldItalic,
          color: rgb(107/255, 17/255, 26/255),
        });

        const pdfBytes = await pdfDoc.save();

        // Wrap the Uint8Array in a Blob to satisfy BodyInit typing.
        // Create a fresh ArrayBuffer and copy the bytes to avoid SharedArrayBuffer/ArrayBufferLike typing issues.
        const arrayBuffer = new ArrayBuffer(pdfBytes.byteLength);
        new Uint8Array(arrayBuffer).set(pdfBytes);
        const pdfBlob = new Blob([arrayBuffer]);
        return new NextResponse(pdfBlob, {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="taklifnoma-${safeFileName}.pdf"`,
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
    const templatePath = path.join(process.cwd(), 'public', 'taklifnoma.pdf');
    const existingPdfBytes = await readFile(templatePath);

    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const timesBoldItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanBoldItalic);

    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();

    const fontSize = 10;
    const textWidth = timesBoldItalic.widthOfTextAtSize(firstName, fontSize);
    const safeFileName = firstName.replace(/[^a-zA-Z0-9\u0400-\u04FF\s-]/g, '').trim().replace(/\s+/g, '_') || 'guest';

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

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="taklifnoma-${safeFileName}.pdf"`,
        'Cache-Control': 'public, max-age=60',
      },
    });
  } catch (err) {
    console.error('GET RSVP error:', err);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}

