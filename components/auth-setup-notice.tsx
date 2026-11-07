'use client';
import {useEffect,useState} from 'react';
export default function AuthSetupNotice({issue,onRetry}:{issue:string;onRetry:()=>void}){
 const [local,setLocal]=useState(false);
 useEffect(()=>{setLocal(['localhost','127.0.0.1','::1','[::1]'].includes(location.hostname));},[]);
 return <section className="auth-setup-notice" role="status"><strong>Sign-in and registration are unavailable.</strong><p>{local?issue:'The website’s account service needs attention. You can still explore the guest demo.'}</p><button type="button" className="text-btn" onClick={onRetry}>Check account setup again</button>{local&&<details><summary>Fix my local setup</summary><ol><li>In the VS Code terminal, stop this app with Ctrl + C.</li><li>Run <code>npm.cmd run setup</code> in this project folder.</li><li>Paste your Supabase project URL and publishable key when asked.</li><li>Start again with <code>npm.cmd run dev</code>, then refresh this page.</li></ol><p>This creates or repairs <code>.env.local</code> beside <code>package.json</code>. Never use a secret or service-role key.</p></details>}</section>;
}
