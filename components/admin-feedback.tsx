'use client';
import {useEffect,useState} from 'react';
import {accountClient} from '@/lib/supabase';
export default function AdminFeedback({userId}:{userId:string}){
 const [rows,setRows]=useState<{id:string;category:string;message:string;created_at:string}[]>([]),[error,setError]=useState(''),[revision,setRevision]=useState(0);
 useEffect(()=>{let active=true;void accountClient(userId).then(client=>client.from('product_feedback').select('id,category,message,created_at').order('created_at',{ascending:false}).limit(50)).then(({data,error})=>{if(!active)return;if(error)setError('Feedback storage is unavailable. Install demo-accounts-feedback.sql once.');else{setRows(data||[]);setError('');}}).catch(()=>{if(active)setError('Feedback could not be loaded.');});return()=>{active=false;};},[userId,revision]);
 return <section className="card padded section-gap"><div className="flex-between"><h3>Private product feedback</h3><button className="text-btn" onClick={()=>setRevision(v=>v+1)}>Refresh feedback</button></div>{error&&<p className="notice amber">{error}</p>}{!error&&!rows.length&&<p>No feedback submitted yet.</p>}{rows.map(row=><article className="feedback-entry" key={row.id}><strong>{row.category} · {new Date(row.created_at).toLocaleString()}</strong><p>{row.message}</p></article>)}</section>;
}
