'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {accountClient} from '@/lib/supabase';
import {creditSummarySchema,type CreditSummary} from '@/lib/demo-credits';
export function useCreditLedger(userId:string|null|undefined){
 const [state,setState]=useState<{userId:string;data:CreditSummary|null;error:string}|null>(null),[revision,setRevision]=useState(0);
 const ownerRef=useRef(userId);ownerRef.current=userId;
 const refresh=useCallback(()=>setRevision(v=>v+1),[]);
 useEffect(()=>{if(!userId)return;const owner=userId;let active=true;
  void accountClient(owner).then(client=>client.rpc('afripay_credit_summary')).then(({data,error})=>{if(!active||ownerRef.current!==owner)return;const parsed=creditSummarySchema.safeParse(data);if(error||!parsed.success||parsed.data.account.user_id!==owner)throw new Error('Demo credits could not be verified. Run supabase/final-payments.sql after the earlier migrations if needed, then refresh.');setState({userId:owner,data:parsed.data,error:''});}).catch(error=>{if(active&&ownerRef.current===owner)setState({userId:owner,data:null,error:(error as Error).message});});
  return()=>{active=false;};
 },[userId,revision]);
 useEffect(()=>{const focus=()=>refresh();window.addEventListener('focus',focus);return()=>window.removeEventListener('focus',focus);},[refresh]);
 const current=userId&&state?.userId===userId?state:null;
 return {userId,data:current?.data||null,error:current?.error||'',loading:userId===undefined||!!userId&&!current,refresh};
}
export type CreditLedger=ReturnType<typeof useCreditLedger>;
