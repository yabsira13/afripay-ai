'use client';
import {FlaskConical,Wallet} from 'lucide-react';
export type WorkspaceMode='demo'|'live'|'testnet';
export default function WorkspaceModeSwitch({mode,onChange}:{mode:WorkspaceMode;onChange:(mode:WorkspaceMode)=>void}){
 return <div className="workspace-mode-switch" role="group" aria-label="Workspace mode">
  <button aria-pressed={mode==='demo'} className={mode==='demo'?'selected':''} onClick={()=>onChange('demo')}><FlaskConical size={14}/>Demo</button>
  <button aria-pressed={mode==='live'} className={mode==='live'?'selected live-selected':''} onClick={()=>onChange('live')}><Wallet size={14}/>Live wallet <small>Mainnet</small></button>
  <button aria-pressed={mode==='testnet'} className={mode==='testnet'?'selected testnet-selected':''} onClick={()=>onChange('testnet')}><FlaskConical size={14}/>NEAR testnet</button>
 </div>;
}
