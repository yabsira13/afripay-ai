import {PDFDocument,StandardFonts,rgb,PDFName,PDFString} from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import type {ReceiptFonts} from './receipt';
import {testnetAccount,testnetHash} from './testnet-transfer';
import {toAtomic} from './amount';
export type TestnetDocument={kind:'invoice'|'receipt';reference:string;receiver:string;amount:string;description?:string;sender?:string;hash?:string;verifiedAt?:string;confirmed?:boolean};
/** Human-readable testnet record. It never describes test tokens as real money. */
export async function testnetDocument(input:TestnetDocument,fonts?:Pick<ReceiptFonts,'regular'|'bold'>){
 testnetAccount.parse(input.receiver);const atomic=toAtomic(input.amount,24);if(BigInt(atomic)>10n**24n)throw new Error('Invalid testnet document amount.');
 if(input.kind==='receipt'){testnetAccount.parse(input.sender);testnetHash.parse(input.hash);if(!input.confirmed||!input.verifiedAt||!Number.isFinite(Date.parse(input.verifiedAt)))throw new Error('A verified testnet transaction is required for a receipt.');}
 const doc=await PDFDocument.create();if(fonts)doc.registerFontkit(fontkit);const regular=await doc.embedFont(fonts?fonts.regular:StandardFonts.Helvetica,{subset:true}),bold=await doc.embedFont(fonts?fonts.bold:StandardFonts.HelveticaBold,{subset:true});let page=doc.addPage([595,842]),y=785;
 const draw=(value:string,size=11,heavy=false)=>{const text=fonts?value:value.replace(/[^\x20-\x7E]/g,'?');for(const line of text.match(/.{1,78}/g)||['']){if(y<65){page=doc.addPage([595,842]);y=785;}page.drawText(line,{x:42,y,size,font:heavy?bold:regular,color:rgb(.24,.15,.36)});y-=size+12;}};
 draw('AFRIPAY AI',25,true);draw(input.kind==='receipt'?'NEAR TESTNET PAYMENT RECEIPT':'NEAR TESTNET INVOICE',15,true);draw('TEST TOKENS ONLY - NO CASH VALUE',11,true);y-=12;
 draw('Reference: '+input.reference);draw('Network: NEAR testnet');draw('Amount: '+input.amount+' test NEAR',15,true);if(input.sender)draw('Sender: '+input.sender);draw('Recipient: '+input.receiver);
 draw('Status: '+(input.kind==='receipt'?'Final successful execution verified':'Payment request - not proof of payment'));if(input.description)draw('Description: '+input.description);if(input.verifiedAt)draw('Verified: '+input.verifiedAt);
 if(input.hash){draw('Transaction hash:');draw(input.hash,10);const href='https://testnet.nearblocks.io/txns/'+input.hash;const linkTop=y;draw('View transaction in testnet explorer',11,true);const link=doc.context.obj({Type:'Annot',Subtype:'Link',Rect:[42,linkTop-3,300,linkTop+13],Border:[0,0,0],A:{Type:'Action',S:'URI',URI:PDFString.of(href)}});const annotation=doc.context.register(link);page.node.set(PDFName.of('Annots'),doc.context.obj([annotation]));draw('Explorer: https://testnet.nearblocks.io',9);}
 y-=12;draw('Native NEAR testnet only. Not a mainnet or cross-chain payment.',10);draw('Network fees are separate. No currency conversion or tax calculation.',10);draw('Verify the hash in the explorer. Counterparty identity is not certified.',10);
 doc.setTitle('AFRIPAY testnet '+input.kind+' '+input.reference);doc.setAuthor('AFRIPAY AI');doc.setSubject('NEAR TESTNET ONLY. Test tokens have no cash value.');return doc.save();
}
