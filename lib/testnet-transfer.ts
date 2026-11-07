import {z} from 'zod';
import {toAtomic} from './amount';
export const testnetAccount=z.string().min(2).max(64).regex(/^[a-z0-9]+(?:[._-][a-z0-9]+)*\.testnet$/,'Use a named NEAR testnet account ending in .testnet.');
export const testnetHash=z.string().regex(/^[1-9A-HJ-NP-Za-km-z]{32,64}$/,'Enter a valid NEAR transaction hash.');
export type TestnetProposal={network:'testnet';sender:string;receiver:string;amount:string;atomicAmount:string;createdAt:number;expiresAt:number};
export function prepareTestnetTransfer(sender:string,receiver:string,amount:string,now=Date.now()):TestnetProposal{
 testnetAccount.parse(sender);testnetAccount.parse(receiver);
 if(sender===receiver)throw new Error('Choose a different testnet wallet as the recipient.');
 const atomicAmount=toAtomic(amount,24);
 if(BigInt(atomicAmount)>10n**24n)throw new Error('This testnet screen allows at most 1 test NEAR per transfer.');
 return {network:'testnet',sender,receiver,amount,atomicAmount,createdAt:now,expiresAt:now+120000};
}
export function testnetWalletRequest(proposal:TestnetProposal,now=Date.now()){
 if(proposal.network!=='testnet')throw new Error('Mainnet signing is not available on this screen.');
 const checked=prepareTestnetTransfer(proposal.sender,proposal.receiver,proposal.amount,proposal.createdAt);
 if(checked.atomicAmount!==proposal.atomicAmount||proposal.expiresAt!==checked.expiresAt||proposal.createdAt>now||proposal.expiresAt<=now)throw new Error('This testnet review expired or changed. Review the transfer again.');
 return {network:'testnet' as const,signerId:proposal.sender,receiverId:proposal.receiver,actions:[{type:'Transfer' as const,params:{deposit:proposal.atomicAmount}}]};
}
const success=(status:unknown)=>!!status&&typeof status==='object'&&('SuccessValue' in status||'SuccessReceiptId' in status);
export function inspectTestnetOutcome(raw:unknown,expected:{hash:string;sender:string;receiver:string;amount:string}):{status:'pending'|'confirmed'|'failed';reason:string}{
 const proposal=prepareTestnetTransfer(expected.sender,expected.receiver,expected.amount);
 testnetHash.parse(expected.hash);
 if(!raw||typeof raw!=='object')return {status:'pending',reason:'The testnet provider did not return execution evidence.'};
 const data=raw as Record<string,any>,tx=data.transaction;
 if(!tx||tx.hash!==expected.hash||tx.signer_id!==proposal.sender||tx.receiver_id!==proposal.receiver||!Array.isArray(tx.actions)||tx.actions.length!==1||tx.actions[0]?.Transfer?.deposit!==proposal.atomicAmount)throw new Error('The on-chain transaction does not match this reviewed testnet transfer.');
 if(data.final_execution_status!=='FINAL')return {status:'pending',reason:'The transaction has not reached final execution.'};
 if(data.status&&typeof data.status==='object'&&'Failure' in data.status)return {status:'failed',reason:'The finalized testnet transaction failed. Check the wallet before retrying.'};
 const receipts=data.receipts_outcome;
 if(Array.isArray(receipts)&&receipts.some((item:any)=>item?.outcome?.status&&typeof item.outcome.status==='object'&&'Failure' in item.outcome.status))return {status:'failed',reason:'A testnet execution receipt failed.'};
 if(!success(data.status)||!success(data.transaction_outcome?.outcome?.status)||!Array.isArray(receipts)||receipts.length===0||!receipts.every((item:any)=>success(item?.outcome?.status))||!receipts.some((item:any)=>item?.outcome?.executor_id===proposal.receiver&&success(item?.outcome?.status)))return {status:'pending',reason:'Complete successful execution evidence is not available yet.'};
 return {status:'confirmed',reason:'Final successful execution was verified on the NEAR testnet provider. This is not a mainnet payment.'};
}

export type TestnetRecord={hash:string;proposal:TestnetProposal;status:'submitted'|'pending'|'confirmed'|'failed';reason:string};
export function readStoredTestnetHistory(value:unknown):TestnetRecord[]{
 if(!Array.isArray(value))return [];
 const records:TestnetRecord[]=[];
 for(const item of value.slice(0,30)){try{
  if(!item||!testnetHash.safeParse(item.hash).success||item.proposal?.network!=='testnet'||!Number.isFinite(item.proposal.createdAt))continue;
  const proposal=prepareTestnetTransfer(item.proposal.sender,item.proposal.receiver,item.proposal.amount,item.proposal.createdAt);
  if(proposal.atomicAmount!==item.proposal.atomicAmount)continue;
  records.push({hash:item.hash,proposal,status:'pending',reason:'Recheck this transaction against the testnet provider.'});if(records.length===10)break;
 }catch{}}
 return records;
}
