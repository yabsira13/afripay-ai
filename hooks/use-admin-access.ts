'use client';
import {useEffect,useState} from 'react';
import {accountClient} from '@/lib/supabase';
export function useAdminAccess(userId:string|null|undefined){
 const [record,setRecord]=useState<{userId:string;allowed:boolean}|null>(null);
 useEffect(()=>{let active=true;if(!userId)return;const owner=userId;
  void accountClient(owner).then(client=>client.rpc('afripay_is_admin')).then(({data,error})=>{if(active)setRecord({userId:owner,allowed:!error&&data===true});}).catch(()=>{if(active)setRecord({userId:owner,allowed:false});});
  return()=>{active=false;};
 },[userId]);
 return {allowed:!!userId&&record?.userId===userId&&record.allowed,checking:userId===undefined||!!userId&&record?.userId!==userId};
}
