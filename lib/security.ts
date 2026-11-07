import type { Evidence, Invoice, Policy, Risk, Supplier } from './types';
export function score(evidence: Evidence[]): Risk {
 const total = Math.min(100, evidence.reduce((sum,e)=>sum+e.points,0));
 const level = total >= 80 ? 'Critical' : total >= 50 ? 'High' : total >= 25 ? 'Medium' : 'Low';
 return { score: total, level, evidence, blocked: level === 'Critical', recommendation: level === 'Critical' ? 'Block payment. Resolve the evidence and verify the supplier through a separate trusted channel.' : level === 'High' ? 'Pause payment for manual review and independently confirm recipient details.' : level === 'Medium' ? 'Review the evidence and confirm recipient details before approving.' : 'No elevated indicators detected by these checks. Confirm all details before payment.' };
}
const e = (code: string, points: number, reason: string, source: Evidence['source']='heuristic'): Evidence => ({code,points,reason,source});
export function validAddress(address: string, chain: string): boolean {
 if (chain === 'near') return address.length >= 2 && address.length <= 64 && /^[a-z0-9]+(?:[-_.][a-z0-9]+)*$/.test(address) && !address.endsWith('.testnet');
 if (['eth','ethereum','base','arb','arbitrum','polygon','bsc','optimism'].includes(chain)) return /^0x[a-fA-F0-9]{40}$/.test(address);
 if (chain === 'sol' || chain === 'solana') return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
 return false;
}
export function sameAddress(a: string,b: string,chain: string) { return ['eth','ethereum','base','arb','arbitrum','polygon','bsc','optimism'].includes(chain) ? a.toLowerCase()===b.toLowerCase() : a===b; }
export function analyzeInvoice(invoice: Invoice, invoices: Invoice[], suppliers: Supplier[]): Risk {
 const evidence: Evidence[]=[];
 const supplier = suppliers.find(s=>s.name.toLowerCase()===invoice.supplier.toLowerCase());
 if (invoices.some(i=>i.id!==invoice.id && i.supplier.toLowerCase()===invoice.supplier.toLowerCase() && i.number.trim().toLowerCase()===invoice.number.trim().toLowerCase())) evidence.push(e('duplicate_invoice',45,'The invoice number already exists for this supplier.','observation'));
 if (supplier && (!sameAddress(supplier.wallet,invoice.wallet,invoice.chain) || supplier.chain!==invoice.chain)) evidence.push(e('wallet_changed',65,'Payment destination differs from the saved supplier record. Confirm using a previously known contact.','observation'));
 if (!supplier) evidence.push(e('new_supplier',10,'Supplier is not in your verified supplier list.'));
 if (!validAddress(invoice.wallet, invoice.chain)) evidence.push(e('invalid_address',45,'Recipient address format is invalid or the selected chain is unsupported.','observation'));
 if (!invoice.verified) evidence.push(e('unverified_recipient',15,'The extracted recipient has not been manually verified.','observation'));
 if (!Number.isFinite(Number(invoice.amount)) || Number(invoice.amount)<=0) evidence.push(e('invalid_amount',80,'Invoice amount must be a positive number.','observation'));
 if (!invoice.number.trim()) evidence.push(e('missing_number',15,'No invoice number was extracted.','observation'));
 if (invoice.text.match(/(?:ignore|bypass).{0,35}(?:verif|security|approv)|seed phrase|private key|urgent.{0,30}new (?:wallet|account)/i)) evidence.push(e('unsafe_instructions',35,'Invoice contains instructions to bypass verification or change payment credentials.'));
 if (/(?:ignore|override)[\s\S]{0,60}(?:previous|system|developer|security)\s*(?:instructions?|rules?|prompts?)|(?:mark|set)[\s\S]{0,40}(?:verified|approved|risk\s*(?:score)?\s*(?:to|=|:)\s*0)|(?:assistant|agent)[\s\S]{0,30}(?:sign|execute|authorize)[\s\S]{0,30}(?:payment|transaction)/i.test(invoice.text)) evidence.push(e('instruction_override',80,'Invoice text appears to instruct software to override its rules or approve a payment. This text is untrusted; verify the document independently.','heuristic'));
 const links=invoice.text.match(/https?:\/\/[^\s<>]+/g)||[];
 for(const link of links.slice(0,10)) { const result=analyzeUrl(link); for(const item of result.evidence.filter(x=>x.points>0)) evidence.push({...item,code:'invoice_'+item.code}); }
 if(!evidence.length) evidence.push(e('consistent_invoice',0,'Invoice fields match the current supplier record. This does not guarantee authenticity.','observation'));
 return score(evidence);
}
export function analyzeTransaction(input: {amount: number; recipient: string; chain: string; asset: string; expectedAsset?: string; expectedChain?: string; attempts?: number; dailyTotal?: number; duplicate?: boolean; invoiceRisk?: Risk}, suppliers: Supplier[], policy: Policy): Risk {
 const evidence: Evidence[]=[...(input.invoiceRisk?.evidence||[])];
 if (!Number.isFinite(input.amount)||input.amount<=0) evidence.push(e('invalid_amount',100,'Payment amount is invalid.','observation'));
 if(!validAddress(input.recipient,input.chain)) evidence.push(e('invalid_recipient',80,'Recipient address format is invalid or chain is unsupported.','observation'));
 if (!suppliers.some(s=>s.trusted && s.chain===input.chain && sameAddress(s.wallet,input.recipient,input.chain))) evidence.push(e('new_recipient',15,'Recipient is not a trusted supplier.'));
 if(input.amount>policy.singleLimit) evidence.push(e('single_limit',80,`Amount exceeds the per-payment limit of ${policy.singleLimit}.`,'observation'));
 if(input.amount+(input.dailyTotal||0)>policy.dailyLimit) evidence.push(e('daily_limit',80,'Payment would exceed the daily spending limit.','observation'));
 if((input.attempts||0)>=3) evidence.push(e('frequency',25,'Three or more recent payment attempts require review.','observation'));
 if(input.expectedAsset && input.asset!==input.expectedAsset) evidence.push(e('asset_changed',25,'Payment asset differs from the invoice currency.','observation'));
 if(input.expectedChain && input.chain!==input.expectedChain) evidence.push(e('chain_changed',30,'Payment chain differs from the invoice.','observation'));
 if(input.duplicate) evidence.push(e('duplicate_payment',100,'A payment for this invoice is already processing or settled.','observation'));
 if(!evidence.length) evidence.push(e('policy_pass',0,'Recipient and amount pass the configured checks. No external threat feed is configured.','observation'));
 return score(evidence);
}
export function analyzeUrl(raw: string): Risk {
 const evidence: Evidence[]=[];
 let url: URL;
 try {url=new URL(raw); if(!['http:','https:'].includes(url.protocol)) throw new Error('protocol');}
 catch {return score([e('invalid_url',50,'URL is malformed or uses an unsupported scheme.','observation')]);}
 if(url.protocol!=='https:') evidence.push(e('insecure_url',20,'URL does not use HTTPS.','observation'));
 if(url.username || url.password) evidence.push(e('url_credentials',30,'URL embeds credentials, which can disguise its destination.','observation'));
 if(url.hostname.includes('xn--')) evidence.push(e('punycode',20,'Internationalized domain needs visual verification.'));
 if(/^\d+\.\d+\.\d+\.\d+$/.test(url.hostname)) evidence.push(e('ip_domain',20,'Payment link uses an IP address rather than a business domain.'));
 if(/(?:near|metamask|coinbase|binance).*(?:verify|claim|unlock|support)|(?:nеar|cоinbase)/i.test(url.hostname)) evidence.push(e('lookalike',35,'Domain combines a wallet brand with verification or support language. This is a heuristic, not confirmed phishing.'));
 if(/seed|mnemonic|private.?key/i.test(raw)) evidence.push(e('credential_request',65,'Link contains a seed phrase or private key instruction.'));
 evidence.push(e('no_url_feed',0,'No external phishing feed or redirects checked. Link was not opened.','unknown'));
 return score(evidence);
}
export function walletEvidence(address: string, chain: string): Risk {
 return score([...(validAddress(address,chain)?[]:[e('invalid_wallet',50,'Invalid address format or unsupported chain.','observation')]), e('no_threat_feed',0,'No external threat-intelligence feed is configured. No claim of safety or maliciousness can be made.','unknown'),e('history_unavailable',0,'Transaction history and movement analysis are unavailable. A new wallet is not inherently suspicious.','unknown')]);
}
