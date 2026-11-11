import {it,expect} from 'vitest';
import {PDFDocument} from 'pdf-lib';
import {mainnetTransferReceipt} from '../lib/mainnet-transfer-receipt';
it('creates a mainnet public transfer PDF for either participant and rejects invalid hashes',async()=>{const row={hash:'6zgh2u9DqHHiXzdy9ouTP7oGky2T4nugbhqsK7wQHnZS',sender:'sender.near',receiver:'receiver.near',amount_atomic:'10000000000000000000000',verified_at:'2026-11-11T08:00:00Z'};const bytes=await mainnetTransferReceipt(row);expect(new TextDecoder().decode(bytes.slice(0,4))).toBe('%PDF');const doc=await PDFDocument.load(bytes);expect(doc.getPageCount()).toBe(1);expect(doc.getSubject()).toBe('NEAR mainnet transfer '+row.hash);await expect(mainnetTransferReceipt({...row,hash:'invalid'})).rejects.toThrow();});
