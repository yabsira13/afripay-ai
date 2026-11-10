'use client';
import {useCallback,useEffect,useState} from 'react';
import {RefreshCw,Loader2,AlertTriangle,Wallet} from 'lucide-react';
import type {WalletBalance} from '@/lib/wallet-balance';

export default function ConnectedWalletBalance({accountId,fundingEnabled=false,connected=true}:{accountId:string;fundingEnabled?:boolean;connected?:boolean}){
 const [result,setResult]=useState<WalletBalance|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(true),[revision,setRevision]=useState(0);
 useEffect(()=>{
  const controller=new AbortController();let active=true;
  setResult(null);setError('');setLoading(true);
  async function load(){
   try{
    const response=await fetch('/api/wallet/balance?'+new URLSearchParams({accountId}),{signal:controller.signal,cache:'no-store'});
    const data=await response.json();
    if(!response.ok)throw new Error(data.error||'Wallet balance could not be read.');
    if(data.mode!=='live'||data.accountId!==accountId||data.network!=='mainnet'||data.asset!=='NEAR'||typeof data.balance!=='string')throw new Error('Balance response did not match your connected wallet.');
    if(active)setResult(data);
   }catch(err){if(active)setError((err as Error).message);}finally{if(active)setLoading(false);}
  }
  load();return()=>{active=false;controller.abort();};
 },[accountId,revision]);
 const refresh=useCallback(()=>setRevision(v=>v+1),[]);
 // Never show a previous account's result while React prepares the new request.
 const balance=result?.accountId===accountId?result:null;
 return <section className="balance-card connected-balance" aria-label="Live connected wallet balance"><div className="balance-content">
  <div className="live-balance-heading"><span className="subtle-white"><Wallet size={14}/>{connected?'Connected wallet':'Saved public address'} <span className="outline-pill">NEAR MAINNET</span></span><button className="balance-refresh" onClick={refresh} disabled={loading} aria-label="Refresh live NEAR balance" title="Refresh live NEAR balance"><RefreshCw size={15} className={loading?'spin':''}/></button></div>
  <p className="live-account">{accountId}</p>
  {loading?<div className="balance-loading" role="status"><Loader2 size={20} className="spin"/>Reading live balance…</div>:error?<div className="balance-read-error" role="alert"><AlertTriangle size={19}/><span>{error}</span></div>:balance?<><h2 className="live-balance-value">{balance.balance}<span> NEAR</span></h2><p className="balance-caption">Live account balance · includes storage reserve</p><p className="balance-caption">Other tokens and staking-pool deposits are not included.</p><div className="balance-live-meta"><span className="live-dot"/>Balance checked {new Date(balance.checkedAt).toLocaleTimeString()}<span>Block {balance.blockHeight.toLocaleString()}</span></div>{balance.lockedAtomic!=='0'&&<p className="balance-caption">Validator-locked balance: {balance.lockedBalance} NEAR (separate)</p>}</>:null}
  <div className="balance-demo-separator">{fundingEnabled?'Mainnet payments are available in Pay. Each payment requires your review and wallet approval.':'Payment funding is disabled. This card shows public balance data only.'}</div>
 </div></section>;
}
