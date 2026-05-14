import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'fs';

async function createPdf() {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 800]);
  const { width, height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
  
  page.drawText('Dummy Wedding Template', {
    x: 50,
    y: height - 100,
    size: 40,
    font,
    color: rgb(0.8, 0.6, 0.2), // goldish
  });

  page.drawText('Your name will appear below:', {
    x: 50,
    y: height - 150,
    size: 20,
    font,
    color: rgb(0.2, 0.2, 0.2),
  });

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync('./public/taklifnoma.pdf', pdfBytes);
  console.log('Created dummy public/taklifnoma.pdf');
}

createPdf();
