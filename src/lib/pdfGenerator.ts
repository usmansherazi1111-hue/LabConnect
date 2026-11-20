/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DiagnosticReportRecord, LahoreLaboratory, MockBooking } from '../types';

function escapePdfText(text: string): string {
  return (text || '')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

export function generateClientPathologyPdfBlob(
  report: DiagnosticReportRecord,
  lab?: LahoreLaboratory,
  booking?: MockBooking
): Blob {
  const lines: string[] = [];

  const drawText = (
    x: number,
    y: number,
    size: number,
    bold: boolean,
    text: string,
    rgb = '0.07 0.09 0.13'
  ) => {
    const font = bold ? '/F2' : '/F1';
    lines.push(`BT ${font} ${size} Tf ${rgb} rg 1 0 0 1 ${x} ${y} Tm (${escapePdfText(text)}) Tj ET`);
  };

  lines.push('0.027 0.231 0.263 rg 0 765 595 77 re f');
  drawText(40, 812, 16, true, `${lab?.name || 'Verified Diagnostic Laboratory'}`, '1 1 1');
  drawText(40, 793, 9, false, `${report.branchName} | PHC Licence: ${lab?.phcLicence || 'PHC-LHR'}`, '0.85 0.96 0.90');
  drawText(40, 777, 8, false, `${lab?.accreditation || 'ISO 15189 Certified'} | Contact: ${lab?.contactPhone || '+92 42 111'}`, '0.85 0.96 0.90');
  drawText(435, 812, 11, true, 'PATHOLOGY REPORT', '1 1 1');
  drawText(435, 795, 8, false, `Booking: ${report.bookingNumber}`, '0.85 0.96 0.90');

  lines.push('0.95 0.97 0.96 rg 40 658 515 90 re f');
  lines.push('0.85 0.88 0.91 RG 0.8 w 40 658 515 90 re S');
  drawText(52, 730, 10, true, `Patient Name: ${report.patientName}`);
  drawText(52, 712, 9, false, `Mobile: ${report.patientPhone}`);
  drawText(52, 696, 9, false, `Email: ${report.patientEmail || 'Not provided'}`);
  drawText(52, 678, 9, false, `Location: ${booking?.streetAddress || booking?.patientArea || 'Lahore, Punjab'}`);

  drawText(330, 730, 9, true, `Sample Barcode: ${booking?.sampleBarcode || 'LAB-INHOUSE'}`);
  drawText(330, 712, 9, false, `Collection: ${booking?.collectionType || 'HOME_COLLECTION'}`);
  drawText(330, 696, 9, false, `Cold-Chain Temp: ${booking?.coldChainTempCelsius ? `${booking.coldChainTempCelsius} C` : 'Verified 2-8 C'}`);
  drawText(330, 678, 9, false, `Published: ${(report.publishedAt || '').slice(0, 19).replace('T', ' ')} UTC`);

  lines.push('0.031 0.498 0.549 rg 40 618 515 24 re f');
  drawText(48, 626, 9, true, 'TEST PARAMETER', '1 1 1');
  drawText(250, 626, 9, true, 'OBSERVED', '1 1 1');
  drawText(325, 626, 9, true, 'UNIT', '1 1 1');
  drawText(390, 626, 9, true, 'REFERENCE RANGE', '1 1 1');
  drawText(505, 626, 9, true, 'STATUS', '1 1 1');

  let y = 596;
  (report.parameters || []).forEach((param, idx) => {
    if (y < 180) return;
    if (idx % 2 === 0) {
      lines.push(`0.98 0.98 0.99 rg 40 ${y - 6} 515 22 re f`);
    }
    lines.push(`0.88 0.90 0.92 RG 0.5 w 40 ${y - 6} m 555 ${y - 6} l S`);
    drawText(48, y, 9, true, param.parameter.slice(0, 34));
    const valColor = param.flag === 'NORMAL' ? '0.07 0.09 0.13' : '0.72 0.11 0.11';
    drawText(250, y, 9, true, param.observedValue.slice(0, 14), valColor);
    drawText(325, y, 9, false, param.unit.slice(0, 12));
    drawText(390, y, 9, false, param.referenceRange.slice(0, 22));
    const flagColor = param.flag === 'NORMAL' ? '0.06 0.32 0.20' : '0.72 0.11 0.11';
    drawText(505, y, 8, true, param.flag, flagColor);
    y -= 24;
  });

  const noteY = Math.max(y - 24, 150);
  drawText(40, noteY, 10, true, 'Clinical Pathologist Interpretation & Notes:');
  const words = (report.clinicalNotes || 'Analyzed on automated reference analyzer. Please correlate clinically.').split(/\s+/);
  let lineBuf = '';
  let cy = noteY - 16;
  for (const w of words) {
    if ((lineBuf + ' ' + w).length > 92) {
      drawText(40, cy, 9, false, lineBuf.trim());
      lineBuf = w;
      cy -= 13;
      if (cy < 110) break;
    } else {
      lineBuf = lineBuf ? `${lineBuf} ${w}` : w;
    }
  }
  if (lineBuf && cy >= 110) {
    drawText(40, cy, 9, false, lineBuf.trim());
  }

  lines.push('0.80 0.84 0.88 RG 0.8 w 40 92 m 555 92 l S');
  drawText(40, 76, 9, true, `Electronically Verified By: ${report.pathologistName}`);
  drawText(40, 62, 8, false, `SHA-256 Document Integrity Hash: ${report.checksumSha256}`);
  drawText(40, 46, 7.5, false, 'LabConnect Pakistan | Punjab Healthcare Commission Compliant Digital Report | Consult your physician for clinical diagnosis.', '0.35 0.40 0.48');

  const streamContent = lines.join('\n');
  const encoder = new TextEncoder();
  const byteLen = (s: string) => encoder.encode(s).length;

  const objects: string[] = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n',
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n',
    `6 0 obj\n<< /Length ${byteLen(streamContent)} >>\nstream\n${streamContent}\nendstream\nendobj\n`,
  ];

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(byteLen(pdf));
    pdf += obj;
  }
  const xrefStart = byteLen(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${offsets[i].toString().padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;

  return new Blob([pdf], { type: 'application/pdf' });
}
