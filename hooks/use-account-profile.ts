'use client';
import {useEffect,useState} from 'react';
import {authClient} from '@/lib/supabase';
import {emptyProfile,editableProfile,profileSetupError,type AccountProfile,type ProfileFields} from '@/lib/profile';
export function useAccountProfile(userId:string|null|undefined){
 const [state,setState]=useState<{userId:string;profile:AccountProfile|null;prefill:ProfileFields;error:string}|null>(null),[revision,setRevision]=useState(0);
 useEffect(()=>{let active=true;if(!userId)return;const ownerId=userId;
  async function load(){const client=authClient();if(!client)return;let prefill={...emptyProfile};
   try{const identity=await client.auth.getUser();if(identity.error)throw identity.error;if(identity.data.user?.id!==ownerId)throw new Error('Please sign in again.');const metadata=identity.data.user.user_metadata||{};prefill={...emptyProfile,full_name:typeof metadata.full_name==='string'?metadata.full_name:'',account_type:metadata.account_type==='supplier'?'supplier':'customer'};const {data,error}=await client.from('account_profiles').select('*').eq('user_id',ownerId).maybeSingle();if(error)throw error;if(active)setState({userId:ownerId,profile:data,prefill:data?editableProfile(data):prefill,error:''});}
   catch(err){if(active)setState({userId:ownerId,profile:null,prefill,error:profileSetupError((err as Error).message)});}
  }load();return()=>{active=false;};
 },[userId,revision]);
 const current=userId&&state?.userId===userId?state:null;
 return {profile:current?.profile||null,prefill:current?.prefill||emptyProfile,error:current?.error||'',loading:userId===undefined||!!userId&&!current,retry:()=>setRevision(v=>v+1),accept:(profile:AccountProfile)=>{if(profile.user_id===userId)setState({userId,profile,prefill:editableProfile(profile),error:''});}};
}
