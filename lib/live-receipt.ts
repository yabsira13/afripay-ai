import {PDFDocument,StandardFonts,rgb} from 'pdf-lib';
/** A receipt is offered only for a server-verified SUCCESS record, never for a quote or pending deposit. */
export async function liveReceipt(order:any){
 if(order.state!=='SUCCESS'||!order.settled_at||!order.funding_hash||order.evidence?.verified!==true||!order.committed_quote)throw new Error('A verified live settlement is required for a receipt.');
 const pdf=await PDFDocument.create();const font=await pdf.embedFont(StandardFonts.Helvetica),bold=await pdf.embedFont(StandardFonts.HelveticaBold);let page=pdf.addPage([595,842]),y=780;
 const draw=(text:string,size=12,heavy=false)=>{for(const part of text.match(/.{1,76}/g)||['']){if(y<55){page=pdf.addPage([595,842]);y=780;}page.drawText(part.replace(/[^\x20-\x7e]/g,'?'),{x:40,y,size,font:heavy?bold:font,color:rgb(.24,.15,.36)});y-=size+12;}};
 draw('AFRIPAY AI',24,true);draw('MAINNET PAYMENT RECEIPT',14,true);draw('Official provider-confirmed settlement; final NEAR funding verified.',10);draw('Reference: '+order.id);draw('Invoice: '+order.invoice_reference);draw('Payer: '+order.sender);draw('Recipient: '+order.recipient);draw('Destination network: '+order.destination_chain);draw('Destination asset: '+order.destination_asset,10);draw('Output received (atomic units): '+order.evidence.providerStatus.swapDetails.amountOut,10);draw('Native NEAR funded (yoctoNEAR): '+order.committed_quote.quote.amountIn,10);draw('Settled: '+order.settled_at);draw('Funding transaction: '+order.funding_hash,10);
 for(const t of order.evidence.providerStatus.swapDetails.destinationChainTxHashes)draw('Destination transaction: '+t.hash,10);
 draw('Verify hashes using official network explorers. This is a payment record,',10);draw('not a guarantee that the invoice or counterparty is legitimate.',10);pdf.setTitle('AFRIPAY mainnet payment receipt '+order.id);return pdf.save();
}
