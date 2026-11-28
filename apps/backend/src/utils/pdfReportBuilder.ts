/**
 * apps/backend/src/utils/pdfReportBuilder.ts
 * Generator Berkas Biner PDF 1.4 Standar (Multi-Halaman A4, Font Helvetica & Helvetica-Bold)
 * Murni TypeScript/Buffer tanpa ketergantungan ESM eksternal sehingga stabil di Node & Jest.
 */

export interface PdfLine {
  text: string;
  bold?: boolean;
  size?: number;
  indent?: number;
  spaceAfter?: number;
}

function escapePdfText(input: string): string {
  // Normalisasi karakter non-ASCII umum (bullet, em-dash) ke padanan WinAnsi / ASCII aman
  return input
    .replace(/\u2022/g, '-')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function wrapLine(text: string, maxChars: number): string[] {
  if (text.length <= maxChars) return [text];
  const words = text.split(/\s+/);
  const result: string[] = [];
  let current = '';
  for (const w of words) {
    if (!current) {
      current = w;
    } else if (current.length + 1 + w.length <= maxChars) {
      current += ' ' + w;
    } else {
      result.push(current);
      current = w;
    }
  }
  if (current) result.push(current);
  return result.length > 0 ? result : [''];
}

export function buildPdfReportBuffer(lines: PdfLine[]): Buffer {
  const PAGE_WIDTH = 595.28; // A4 pt
  const PAGE_HEIGHT = 841.89; // A4 pt
  const MARGIN_LEFT = 42;
  const MARGIN_TOP = 48;
  const MARGIN_BOTTOM = 48;

  const pagesContent: string[][] = [[]];
  let currentY = PAGE_HEIGHT - MARGIN_TOP;

  const ensureSpace = (neededHeight: number): void => {
    if (currentY - neededHeight < MARGIN_BOTTOM) {
      pagesContent.push([]);
      currentY = PAGE_HEIGHT - MARGIN_TOP;
    }
  };

  for (const item of lines) {
    const fontSize = item.size ?? 9.5;
    const lineHeight = fontSize * 1.42;
    const indent = item.indent ?? 0;
    const fontKey = item.bold ? '/F2' : '/F1';
    const maxChars = Math.max(30, Math.floor((PAGE_WIDTH - MARGIN_LEFT * 2 - indent) / (fontSize * 0.52)));

    if (!item.text.trim()) {
      currentY -= item.spaceAfter ?? 8;
      continue;
    }

    const wrapped = wrapLine(item.text, maxChars);
    for (const sub of wrapped) {
      ensureSpace(lineHeight);
      const pageStream = pagesContent[pagesContent.length - 1]!;
      const x = (MARGIN_LEFT + indent).toFixed(2);
      const y = currentY.toFixed(2);
      pageStream.push(`BT ${fontKey} ${fontSize} Tf ${x} ${y} Td (${escapePdfText(sub)}) Tj ET`);
      currentY -= lineHeight;
    }
    if (item.spaceAfter) {
      currentY -= item.spaceAfter;
    }
  }

  // Objek PDF:
  // 1 = Catalog, 2 = Pages, 3 = Font Helvetica (/F1), 4 = Font Helvetica-Bold (/F2)
  // Selanjutnya per halaman: Page object + Content Stream object
  const objects: string[] = [];
  const pageObjNums: number[] = [];

  // Placeholder 1..4
  objects.push(''); // 1 Catalog
  objects.push(''); // 2 Pages
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>'); // 3
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>'); // 4

  for (let i = 0; i < pagesContent.length; i++) {
    const pageNumFooter = `BT /F1 8 Tf ${MARGIN_LEFT} 26 Td (Halaman ${i + 1} dari ${pagesContent.length} - Sistem Digitalisasi PMB Ria Indrasti) Tj ET`;
    const streamBody = [...pagesContent[i]!, pageNumFooter].join('\n');
    const streamByteLen = Buffer.byteLength(streamBody, 'latin1');

    const pageObjId = objects.length + 1;
    const contentObjId = objects.length + 2;
    pageObjNums.push(pageObjId);

    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObjId} 0 R >>`
    );
    objects.push(`<< /Length ${streamByteLen} >>\nstream\n${streamBody}\nendstream`);
  }

  objects[0] = '<< /Type /Catalog /Pages 2 0 R >>';
  objects[1] = `<< /Type /Pages /Kids [${pageObjNums.map((n) => `${n} 0 R`).join(' ')}] /Count ${pageObjNums.length} >>`;

  const chunks: Buffer[] = [];
  let offset = 0;
  const pushStr = (s: string): void => {
    const b = Buffer.from(s, 'latin1');
    chunks.push(b);
    offset += b.length;
  };

  pushStr('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');

  const offsets: number[] = [0];
  for (let idx = 0; idx < objects.length; idx++) {
    offsets.push(offset);
    pushStr(`${idx + 1} 0 obj\n${objects[idx]}\nendobj\n`);
  }

  const xrefStart = offset;
  pushStr(`xref\n0 ${objects.length + 1}\n`);
  pushStr('0000000000 65535 f \n');
  for (let i = 1; i <= objects.length; i++) {
    pushStr(`${String(offsets[i]).padStart(10, '0')} 00000 n \n`);
  }

  pushStr(`trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`);
  return Buffer.concat(chunks);
}

export default buildPdfReportBuffer;
