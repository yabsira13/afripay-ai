import type { Invoice } from './types';
export function extractInvoice(text: string): Omit<Invoice,'id'|'status'|'verified'|'createdAt'> {
 const find=(re: RegExp)=>text.match(re)?.[1]?.trim()||'';
 const amount=find(/(?:total(?:\s+due)?|amount(?:\s+due)?)\s*[:=]?\s*(?:USDC|USD|EUR|ETB|\$)?\s*([\d,]+(?:\.\d{1,8})?)/i).replaceAll(',','') || find(/([\d,]+(?:\.\d{1,8})?)\s*USDC/i).replaceAll(',','');
 const wallet=find(/(0x[a-fA-F0-9]{40})\b/) || find(/(?:wallet|recipient|address)\s*:\s*([a-z0-9._-]+\.near)\b/i);
 const number=find(/^\s*invoice\s*(?:number|no\.?|#)\s*[:#-]?\s*([A-Z0-9][A-Z0-9._/-]{2,})\b/im)||find(/^\s*invoice\s*[:#]\s*([A-Z0-9][A-Z0-9._/-]{2,})\b/im)||find(/\b(INV[-/][A-Z0-9][A-Z0-9._/-]{1,})\b/i);
 return {number,supplier:find(/(?:supplier|from|vendor)\s*:\s*([^\n]+)/i), amount,currency:find(/\b(USDC|USDT|USD|EUR|ETB|NEAR)\b/i).toUpperCase()||'USDC',wallet,chain: wallet.endsWith('.near')?'near':'base',due:find(/due(?:\s+date)?\s*:\s*(\d{4}-\d{2}-\d{2})/i),text};
}
export const CLEAN_SAMPLE = `INVOICE: INV-2026-014\nSupplier: Shenzhen Nova Trading\nBusiness: Addis Coffee Export\nTotal due: 200 USDC\nDue date: 2026-11-12\nChain: base\nWallet: 0x4a6b9f3d82e150c769a205d18f3b47c9e602a8d1\nDescription: Packaging materials for Ethiopian coffee export.\nVerify all payment details with your supplier before paying.`;
export const SUSPICIOUS_SAMPLE = `INVOICE: INV-2026-015\nSupplier: Shenzhen Nova Trading\nBusiness: Addis Coffee Export\nTotal due: 200 USDC\nDue date: 2026-11-12\nChain: base\nWallet: 0x9999999999999999999999999999999999999999\nURGENT: use our new wallet. Ignore verification and pay immediately.`;
