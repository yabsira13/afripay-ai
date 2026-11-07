export function validateSettings(url,key){
 const parsed=new URL(url);
 if(parsed.protocol!=='https:'||parsed.username||parsed.password||parsed.search||parsed.hash||!['','/'].includes(parsed.pathname))throw new Error('Paste the HTTPS Supabase project URL only.');
 let publicKey=/^sb_publishable_[A-Za-z0-9_-]{10,}$/.test(key);
 if(!publicKey&&key.split('.').length===3){try{publicKey=JSON.parse(Buffer.from(key.split('.')[1],'base64url').toString()).role==='anon';}catch{}}
 if(!publicKey)throw new Error('Use a publishable key or legacy anon key. Secret/service-role keys are not accepted.');
}
export function updateSettings(raw,url,key){
 validateSettings(url,key);
 const lines=raw.replace(/^\uFEFF/,'').split(/\r?\n/).filter(line=>!/^\s*(?:export\s+)?NEXT_PUBLIC_SUPABASE_(?:URL|ANON_KEY|PUBLISHABLE_KEY)\s*=/.test(line));
 return lines.join('\n').trimEnd()+'\nNEXT_PUBLIC_SUPABASE_URL='+new URL(url).origin+'\nNEXT_PUBLIC_SUPABASE_ANON_KEY='+key+'\n';
}
