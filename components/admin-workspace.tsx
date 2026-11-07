'use client';
import {ShieldCheck,ArrowLeft,Lock} from 'lucide-react';
import SupplierMarketplace from './supplier-marketplace';
import AdminFeedback from './admin-feedback';
type Props={userId:string|null|undefined;allowed:boolean;checking:boolean;onSignIn:()=>void;onBack:()=>void};
export default function AdminWorkspace({userId,allowed,checking,onSignIn,onBack}:Props){
 return <div className="admin-shell"><header className="admin-topbar"><strong><ShieldCheck size={23}/>AFRIPAY · Admin console</strong><button className="btn secondary" onClick={onBack}><ArrowLeft size={16}/>Back to workspace</button></header><main className="admin-content">{checking?<section className="card padded" role="status">Checking administrator access…</section>:!userId?<section className="card padded"><Lock size={25}/><h1>Sign in to continue</h1><p className="body-copy">This console is restricted to appointed administrators.</p><button className="btn primary" onClick={onSignIn}>Sign in</button></section>:!allowed?<section className="card padded" role="alert"><Lock size={25}/><h1>Administrator access required</h1><p className="body-copy">Your account cannot open this console. Customer and supplier accounts use the business workspace.</p><button className="btn primary" onClick={onBack}>Return to workspace</button></section>:<><SupplierMarketplace userId={userId} page="admin" onSignIn={onSignIn} onApply={onBack} onSelect={onBack}/><AdminFeedback key={userId} userId={userId}/></>}</main></div>;
}
