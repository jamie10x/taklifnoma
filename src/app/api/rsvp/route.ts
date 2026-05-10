import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { readFile } from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { firstName, attendance, isRegenerate } = body;

    if (!firstName || !attendance) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Send Telegram Notification (skip if just regenerating for download/share)
    if (!isRegenerate) {
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      const chatId = process.env.CHAT_ID;

      if (botToken && chatId) {
        const message = `🎉 Yangi RSVP!\n\nIsm: ${firstName}\nQatnashish: ${attendance === 'yes' ? 'Ha, albatta ✅' : 'Yoq, afsuski ❌'}`;
        
        try {
          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              chat_id: chatId,
              text: message,
            }),
          });
        } catch (err) {
          console.error('Telegram API error:', err);
        }
      } else {
        console.warn('Telegram credentials not found in environment variables.');
      }
    }

    // 2. Generate PDF if attending
    if (attendance === 'yes') {
      try {
        const templatePath = path.join(process.cwd(), 'public', 'template.pdf');
        const existingPdfBytes = await readFile(templatePath);

        const pdfDoc = await PDFDocument.load(existingPdfBytes);
        const helveticaFont = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);

        const pages = pdfDoc.getPages();
        const firstPage = pages[0];
        const { width, height } = firstPage.getSize();

        const text = firstName;
        const fontSize = 36;
        const textWidth = helveticaFont.widthOfTextAtSize(text, fontSize);

        firstPage.drawText(text, {
          x: width / 2 - textWidth / 2,
          y: height / 2,
          size: fontSize,
          font: helveticaFont,
          color: rgb(0.2, 0.2, 0.2),
        });

        const pdfBytes = await pdfDoc.save();

        return new NextResponse(pdfBytes as any, {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="taklifnoma-${firstName}.pdf"`,
          },
        });
      } catch (pdfError) {
        console.error('Error generating PDF:', pdfError);
        return NextResponse.json({ error: 'Failed to generate PDF. Make sure /public/template.pdf exists.' }, { status: 500 });
      }
    }

    // If not attending, just return success
    return NextResponse.json({ success: true, message: 'RSVP received.' }, { status: 200 });
  } catch (error) {
    console.error('RSVP error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
