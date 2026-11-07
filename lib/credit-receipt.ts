import {PDFDocument,rgb,type PDFFont} from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import {creditReceiptSchema,displayCredits,type CreditReceipt} from './demo-credits';
import type {ReceiptFonts} from './receipt';
export async function createCreditReceipt(raw:CreditReceipt,fonts:ReceiptFonts){
 const receipt=creditReceiptSchema.parse(raw),doc=await PDFDocument.create();doc.registerFontkit(fontkit);
 const regular=await doc.embedFont(fonts.regular,{subset:true}),bold=await doc.embedFont(fonts.bold,{subset:true}),mono=await doc.embedFont(fonts.mono,{subset:true});
 doc.setTitle('AFRIPAY AI — Demo credit receipt');doc.setAuthor('AFRIPAY AI');doc.setSubject('DUSD test credits. No real funds moved.');doc.setCreationDate(new Date(receipt.created_at));doc.setModificationDate(new Date(receipt.created_at));
 const purple=rgb(.43,.24,.76),ink=rgb(.17,.13,.23),muted=rgb(.45,.39,.51),line=rgb(.9,.87,.95),lavender=rgb(.965,.945,.99),amber=rgb(.55,.36,.12),white=rgb(1,1,1);
 let page=doc.addPage([595,842]),y=500;
 function draw(value:string,x:number,top:number,size=11,font:PDFFont=regular,color=ink){page.drawText(value,{x,y:842-top-size,size,font,color});}
 function rule(top:number){page.drawLine({start:{x:48,y:842-top},end:{x:547,y:842-top},thickness:.7,color:line});}
 function header(){page.drawRectangle({x:48,y:763,width:38,height:38,color:purple});draw('A',56,42,26,bold,white);draw('AFRIPAY AI',99,43,19,bold,purple);draw('Intelligent Payments. Borderless Business.',99,72,8,regular,muted);draw('PAYMENT RECEIPT',429,48,8,bold,purple);draw('Recorded demo credits',429,64,7,regular,muted);rule(105);}
 function wrap(value:string,width:number,font:PDFFont,size:number){const lines:string[]=[];let current='';for(const character of value.replace(/[\r\n\t]/g,' ')){if(current&&font.widthOfTextAtSize(current+character,size)>width){lines.push(current);current='';}current+=character;}lines.push(current);return lines;}
 function ensure(height:number){if(y+height>652){page=doc.addPage([595,842]);header();y=135;}}
 function row(label:string,value:string){const lines=wrap(value,335,regular,10.5),height=Math.max(37,lines.length*15+16);ensure(height);draw(label,48,y,9,regular,muted);lines.forEach((text,i)=>draw(text,200,y+i*15,10.5));y+=height;rule(y-8);}
 header();draw('Payment receipt',48,132,26,bold);draw(receipt.purpose==='supplier'?'A clear record of your supplier credit payment.':'A clear record of your transfer to another AFRIPAY account.',48,172,9.5,regular,muted);
 page.drawRectangle({x:48,y:530,width:499,height:104,color:lavender});draw('DEMO CREDIT AMOUNT',67,223,8,bold,purple);draw(displayCredits(receipt.amount_atomic)+' DUSD',67,243,31,bold,purple);draw('Recorded · '+(receipt.purpose==='supplier'?'Supplier payment':'Friend transfer'),67,287,9,regular,muted);
 y=337;draw('PAYMENT DETAILS',48,y,8,bold,purple);y+=27;row('From',receipt.sender);row('To',receipt.recipient);row('Recorded at',new Date(receipt.created_at).toISOString().replace('T',' ').replace('Z',' UTC'));row('Invoice',receipt.invoice_number||'Not linked');
 y+=12;const reference=wrap(receipt.reference,475,mono,9),height=39+reference.length*14;ensure(height+10);page.drawRectangle({x:48,y:842-y-height,width:499,height,color:lavender});draw('SHARED RECEIPT REFERENCE',60,y+9,8,bold,purple);reference.forEach((part,i)=>draw(part,60,y+27+i*14,9,mono));
 const pages=doc.getPages();pages.forEach((p,index)=>{page=p;page.drawRectangle({x:48,y:78,width:499,height:83,color:rgb(.995,.97,.91)});draw(receipt.notice,62,694,10,bold,amber);draw('DUSD has no cash value. No NEAR, USDC or bank funds moved.',62,715,8.5,regular,amber);draw('This database receipt is not proof of a blockchain payment.',62,733,8.5,regular,amber);rule(789);draw('AFRIPAY AI',48,802,8,bold,purple);draw('Account-chosen names are not independently verified identities.',131,802,7,regular,muted);draw(`${index+1} / ${pages.length}`,520,802,8,regular,muted);});
 return doc.save();
}
