import { PDFDocument, rgb, type PDFFont } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import type { Payment } from './types';

export type ReceiptFonts = { regular: Uint8Array; bold: Uint8Array; mono: Uint8Array };
export type ReceiptDetails = { business: string; invoiceNumber?: string };
const colors = {
  ink: rgb(0.15, 0.12, 0.21), muted: rgb(0.47, 0.42, 0.53),
  purple: rgb(0.45, 0.26, 0.80), lavender: rgb(0.965, 0.946, 0.988),
  line: rgb(0.91, 0.88, 0.95), amber: rgb(0.55, 0.37, 0.12),
  cream: rgb(0.995, 0.97, 0.91), white: rgb(1, 1, 1),
};
const networks: Record<string, string> = {
  base: 'Base', near: 'NEAR', eth: 'Ethereum', ethereum: 'Ethereum',
  arb: 'Arbitrum', arbitrum: 'Arbitrum', sol: 'Solana', solana: 'Solana',
};

export function receiptAmount(amount: string): string {
  if (!/^\d+(?:\.\d+)?$/.test(amount) || !/[1-9]/.test(amount)) {
    throw new Error('A receipt requires a valid positive payment amount.');
  }
  const [whole, fraction = ''] = amount.split('.');
  return whole.replace(/^0+(?=\d)/, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '.' + fraction.padEnd(2, '0');
}

/** Produces a downloadable PDF locally; never represents a simulated record as on-chain proof. */
export async function createDemoReceipt(
  payment: Payment, details: ReceiptDetails, fonts: ReceiptFonts,
): Promise<Uint8Array> {
  if (payment.mode !== 'demo' || payment.status !== 'Settled (demo)' || !payment.receipt) {
    throw new Error('Receipts are available only for settled demo payments.');
  }
  if (payment.receipt !== 'DEMO-' + payment.id) {
    throw new Error('The demo receipt reference does not match this payment.');
  }
  const created = new Date(payment.createdAt);
  if (Number.isNaN(created.getTime())) throw new Error('Payment creation date is invalid.');
  const amount = receiptAmount(payment.amount);
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const [regular, bold, mono] = await Promise.all([
    doc.embedFont(fonts.regular, { subset: true }),
    doc.embedFont(fonts.bold, { subset: true }),
    doc.embedFont(fonts.mono, { subset: true }),
  ]);
  doc.setTitle('AFRIPAY AI — Demo payment receipt');
  doc.setAuthor('AFRIPAY AI');
  doc.setSubject('Simulated payment record. Not proof of a blockchain payment.');
  doc.setCreator('AFRIPAY AI receipt generator');
  doc.setLanguage('en');
  const W = 595.28, H = 841.89, M = 44, contentWidth = W - 2 * M;
  let page = doc.addPage([W, H]);
  let cursor = 0;

  function text(value: string, x: number, top: number, size = 10, font = regular, color = colors.ink) {
    page.drawText(value, { x, y: H - top - size, size, font, color });
  }
  function box(x: number, top: number, width: number, height: number, color = colors.lavender) {
    page.drawRectangle({ x, y: H - top - height, width, height, color });
  }
  function line(top: number) {
    page.drawLine({ start: { x: M, y: H - top }, end: { x: W - M, y: H - top }, color: colors.line, thickness: 0.7 });
  }
  function wrap(value: string, width: number, size: number, font: PDFFont): string[] {
    // Wrap by glyph rather than truncating long wallet addresses, references or supplier names.
    const lines: string[] = [];
    for (const paragraph of value.replace(/\r/g, '').split('\n')) {
      let current = '';
      for (const character of paragraph) {
        if (current && font.widthOfTextAtSize(current + character, size) > width) {
          lines.push(current); current = '';
        }
        current += character;
      }
      lines.push(current);
    }
    return lines;
  }
  function header(continued = false) {
    box(M, 43, 35, 35, colors.purple);
    text('A', M + 7, 44, 25, bold, colors.white);
    text('AFRIPAY', 91, 43, 19, bold);
    text('AI', 192, 47, 13, regular, colors.purple);
    text('Intelligent Payments. Borderless Business.', 91, 72, 8, regular, colors.muted);
    text('PAYMENT RECEIPT', 429, 48, 9, bold, colors.purple);
    text(continued ? 'Demo record · continued' : 'Demo transaction record', 429, 65, 7.5, regular, colors.muted);
    line(105);
    cursor = continued ? 130 : 337;
  }
  function ensureSpace(height: number) {
    if (cursor + height > 652) { page = doc.addPage([W, H]); header(true); }
  }
  function section(label: string) {
    ensureSpace(44);
    text(label, M, cursor, 8, bold, colors.purple);
    cursor += 27;
  }
  function row(label: string, value: string) {
    const lines = wrap(value, contentWidth - 150, 9.5, regular);
    const height = Math.max(31, lines.length * 14 + 15);
    ensureSpace(height);
    text(label, M, cursor, 9, regular, colors.muted);
    lines.forEach((part, i) => text(part, M + 150, cursor + i * 14, 9.5));
    cursor += height;
    line(cursor - 8);
  }
  function reference(label: string, value: string) {
    const lines = wrap(value, contentWidth - 24, 9, mono);
    const height = 35 + lines.length * 14;
    ensureSpace(height + 10);
    box(M, cursor, contentWidth, height, colors.lavender);
    text(label, M + 12, cursor + 9, 8, regular, colors.muted);
    lines.forEach((part, i) => text(part, M + 12, cursor + 26 + i * 14, 9, mono));
    cursor += height + 10;
  }

  header();
  text('Payment receipt', M, 133, 26, bold);
  text('A clear record of your simulated supplier payment.', M, 172, 9.5, regular, colors.muted);
  box(M, 207, contentWidth, 104);
  text('PAYMENT AMOUNT', M + 19, 223, 8, bold, colors.purple);
  const amountLine = amount + ' ' + payment.asset;
  let amountSize = 31;
  while (bold.widthOfTextAtSize(amountLine, amountSize) > contentWidth - 38 && amountSize > 8) amountSize--;
  text(amountLine, M + 18, 243, amountSize, bold, colors.purple);
  text('Simulated settlement · ' + (networks[payment.chain] || payment.chain) + ' network', M + 19, 287, 9, regular, colors.muted);
  section('PAYMENT DETAILS');
  row('Business', details.business);
  row('Supplier', payment.supplier);
  row('Invoice number', details.invoiceNumber || 'Not recorded');
  const createdLabel = created.toISOString().slice(0, 10) + ' · ' + created.toISOString().slice(11, 19) + ' UTC';
  row('Payment created', createdLabel);
  cursor += 14;
  section('TRANSFER REFERENCES');
  reference('Recipient wallet · ' + (networks[payment.chain] || payment.chain), payment.recipient);
  reference('Receipt reference', payment.receipt);

  const pages = doc.getPages();
  pages.forEach((p, i) => {
    page = p;
    box(M, 681, contentWidth, 83, colors.cream);
    text('DEMO ONLY — NO REAL FUNDS MOVED', M + 14, 694, 10, bold, colors.amber);
    text('This receipt records a simulation. It is not proof of a blockchain payment.', M + 14, 716, 8.5, regular, colors.amber);
    text('No on-chain transaction hash or verified fund transfer exists for this record.', M + 14, 734, 8.5, regular, colors.amber);
    line(789);
    text('AFRIPAY AI', M, 802, 8, bold, colors.purple);
    text('Intelligent Payments. Borderless Business.', M + 83, 802, 7.5, regular, colors.muted);
    text(`${i + 1} / ${pages.length}`, W - M - 26, 802, 8, regular, colors.muted);
  });
  return doc.save();
}
