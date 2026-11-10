'use client';
import {useCallback,useEffect,useRef,useState,type Dispatch,type SetStateAction} from 'react';
import {emptyWorkspace} from '@/lib/seed';
import {demoStorageKey,loadDemoWorkspace,saveDemoWorkspace} from '@/lib/demo-storage';
import type {Workspace} from '@/lib/types';
import {accountClient} from '@/lib/supabase';
import {WorkspaceSync,WorkspaceConflict,parseSavedWorkspace,workspaceSchema,type SavedWorkspace} from '@/lib/workspace-sync';
export type StorageStatus={state:'loading'|'local'|'saving'|'saved'|'error';message:string;retry:()=>void;reload:()=>void;refresh:()=>void;revision?:number};
/** Guests stay local. Signed-in simulations sync under database RLS and revision checks. */
export function useDemoWorkspace(userId:string|null|undefined):[Workspace,Dispatch<SetStateAction<Workspace>>,boolean,StorageStatus]{
 const scope=userId===undefined?null:demoStorageKey(userId);
 const [record,setRecord]=useState<{scope:string;data:Workspace}|null>(null);
 const [fallback]=useState(emptyWorkspace);
 const sync=useRef<WorkspaceSync|null>(null);
 const [storage,setStorage]=useState<{scope:string;state:StorageStatus['state'];message:string}|null>(null),[reload,setReload]=useState(0);
 useEffect(()=>{
  if(userId===undefined)return;let active=true;const ownerId=userId;const currentScope=demoStorageKey(ownerId);sync.current?.stop();sync.current=null;
  setStorage({scope:currentScope,state:'loading',message:'Loading saved simulation…'});
  const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),6000);
  async function load(){
   let local:Workspace;try{local=workspaceSchema.parse(loadDemoWorkspace(localStorage,ownerId));}catch{local=emptyWorkspace();}
   if(!ownerId){if(active){setRecord({scope:currentScope,data:local});setStorage({scope:currentScope,state:'local',message:'Guest demo · saved in this browser only'});}return;}
   async function save(snapshot:Workspace,revision:number,signal?:AbortSignal):Promise<SavedWorkspace>{
    const client=await accountClient(ownerId!);
    workspaceSchema.parse(snapshot);
    const {data,error}=await client.rpc('afripay_save_demo_workspace',{p_snapshot:snapshot,p_expected_revision:revision}).abortSignal(signal||AbortSignal.timeout(6000));
    if(error){if(error.code==='40001')throw new WorkspaceConflict();throw new Error('Cloud save failed. Check your connection and run supabase/workspace-sync.sql in Supabase.');}
    if(!data?.[0])throw new WorkspaceConflict();
    return parseSavedWorkspace(data[0]);
   }
   try{
    const client=await accountClient(ownerId);
    const {data,error}=await client.from('demo_workspaces').select('snapshot,revision').eq('user_id',ownerId).abortSignal(controller.signal).maybeSingle();
    if(error)throw new Error('Cloud storage is unavailable. Run supabase/workspace-sync.sql in Supabase, then retry.');
    const saved=data?parseSavedWorkspace(data):await save(local,0,controller.signal);
    if(!active)return;
    setRecord({scope:currentScope,data:saved.snapshot});setStorage({scope:currentScope,state:'saved',message:'Simulation saved privately in Supabase'});
    sync.current=new WorkspaceSync(saved.revision,saved.snapshot,save,(state,error)=>{if(active)setStorage({scope:currentScope,state,message:error?.message||(state==='saving'?'Saving simulation…':'Simulation saved privately in Supabase')});});
   }catch(error){if(active){setRecord({scope:currentScope,data:local});setStorage({scope:currentScope,state:'error',message:(controller.signal.aborted?'Cloud loading timed out. Your local demo is shown; export unsaved changes before retrying.':(error as Error).message)+' Changes remain in this browser until cloud saving is restored.'});}}
  }
  void load().finally(()=>clearTimeout(timeout));return()=>{active=false;clearTimeout(timeout);controller.abort();sync.current?.stop();sync.current=null;};
 },[userId,reload]);
 useEffect(()=>{if(userId===undefined||!record||record.scope!==scope)return;try{saveDemoWorkspace(localStorage,userId,record.data);}catch{}},[record,scope,userId]);
 useEffect(()=>{if(!record||record.scope!==scope||!userId)return;sync.current?.enqueue(record.data);},[record,scope,userId]);
 const setData:Dispatch<SetStateAction<Workspace>>=useCallback(update=>{setRecord(previous=>{if(!previous||previous.scope!==scope)return previous;return {scope:previous.scope,data:typeof update==='function'?update(previous.data):update};});},[scope]);
 const ready=!!record&&record.scope===scope;
 const status=storage?.scope===scope?storage:{state:'loading' as const,message:'Loading simulation…'};
 const reloadSaved=()=>{if(confirm('Reload the saved cloud copy? Download your unsaved copy first if you need to keep it.')){setRecord(null);setReload(v=>v+1);}};
 return [ready?record!.data:fallback,setData,ready,{state:status.state,message:status.message,retry:()=>{if(sync.current)sync.current.retry();else reloadSaved();},reload:reloadSaved,refresh:()=>{setRecord(null);setReload(v=>v+1);},revision:ready?sync.current?.getRevision():undefined}];
}
