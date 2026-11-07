import {describe,it,expect,beforeAll,afterAll,vi} from 'vitest';
import {PGlite} from '@electric-sql/pglite';
import {readFile} from 'node:fs/promises';
import {seed} from '../lib/seed';
import {WorkspaceSync,WorkspaceConflict,parseSavedWorkspace,workspaceSchema} from '../lib/workspace-sync';
const A='11111111-1111-4111-8111-111111111111',B='22222222-2222-4222-8222-222222222222';
let db:PGlite;
async function asUser(id:string){await db.exec('reset role;set role authenticated;');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);}
async function save(snapshot:unknown,revision:number){return db.query('select * from public.afripay_save_demo_workspace($1::jsonb,$2)',[JSON.stringify(snapshot),revision]);}
beforeAll(async()=>{db=new PGlite();await db.exec("create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth,public to authenticated;grant execute on function auth.uid() to authenticated;");await db.query('insert into auth.users values($1),($2)',[A,B]);const sql=await readFile(new URL('../supabase/workspace-sync.sql',import.meta.url),'utf8');await db.exec(sql);await db.exec(sql);},30000);
afterAll(async()=>{await db?.close();});
describe('Private simulation persistence in PostgreSQL',()=>{
 it('creates an account-owned document through the restricted RPC',async()=>{await asUser(A);const result=await save(seed(),0);expect(result.rows[0]).toMatchObject({user_id:A,revision:1});});
 it('does not reveal the first account’s invoices to another account',async()=>{await asUser(B);expect((await db.query('select * from public.demo_workspaces')).rows).toHaveLength(0);});
 it('does not let an account directly rewrite revisions or another owner’s data',async()=>{await asUser(B);await expect(db.query('update public.demo_workspaces set revision=99')).rejects.toThrow(/permission/);await expect(db.query('insert into public.demo_workspaces(user_id,snapshot) values($1,$2)',[A,JSON.stringify(seed())])).rejects.toThrow(/permission/);});
 it('rejects stale tabs and duplicate create operations without losing the saved document',async()=>{await asUser(A);expect((await save({...seed(),business:'Latest business'},1)).rows[0]).toMatchObject({revision:2});await expect(save(seed(),1)).rejects.toThrow(/conflict/);await expect(save(seed(),0)).rejects.toThrow(/conflict/);const result=(await db.query<{snapshot:{business:string};revision:number}>('select snapshot,revision from public.demo_workspaces')).rows[0];expect(result.snapshot.business).toBe('Latest business');expect(result.revision).toBe(2);});
 it('does not recreate missing documents from stale revisions',async()=>{await asUser(B);await expect(save(seed(),9)).rejects.toThrow(/conflict/);expect((await db.query('select * from public.demo_workspaces')).rows).toHaveLength(0);});
 it('rejects live payment claims and incomplete snapshots',async()=>{await asUser(B);await expect(save({...seed(),payments:[{mode:'live',status:'SUCCESS'}]},0)).rejects.toThrow(/simulated/);await expect(save({invoices:[]},0)).rejects.toThrow(/Incomplete/);});
 it('denies anonymous access to the save function and private data',async()=>{await db.exec('reset role;set role anon');await expect(save(seed(),0)).rejects.toThrow(/permission/);await expect(db.query('select * from public.demo_workspaces')).rejects.toThrow(/permission/);});
});
describe('Browser synchronization safety',()=>{
 it('validates documents and never accepts a fabricated live transaction field',()=>{expect(workspaceSchema.safeParse(seed()).success).toBe(true);expect(()=>parseSavedWorkspace({snapshot:seed(),revision:0})).toThrow();expect(workspaceSchema.safeParse({...seed(),txHash:'fake'}).success).toBe(false);});
 it('serializes rapid changes so a late response cannot overwrite a newer edit',async()=>{
  let release:()=>void=()=>{};const wait=new Promise<void>(resolve=>{release=resolve;});const revisions:number[]=[];const documents:string[]=[];
  const save=vi.fn(async(data:ReturnType<typeof seed>,revision:number)=>{revisions.push(revision);documents.push(data.business);if(revision===1)await wait;return {snapshot:data,revision:revision+1};});
  const report=vi.fn();const sync=new WorkspaceSync(1,seed(),save,report);sync.enqueue({...seed(),business:'First'});sync.enqueue({...seed(),business:'Second'});sync.enqueue({...seed(),business:'Third'});expect(save).toHaveBeenCalledTimes(1);release();await vi.waitFor(()=>expect(report).toHaveBeenLastCalledWith('saved'));expect(revisions).toEqual([1,2]);expect(documents).toEqual(['First','Third']);
 });
 it('pauses on conflicts instead of silently overwriting data on the next edit',async()=>{const save=vi.fn().mockRejectedValue(new WorkspaceConflict());const report=vi.fn();const sync=new WorkspaceSync(1,seed(),save,report);sync.enqueue({...seed(),business:'Unsaved'});await vi.waitFor(()=>expect(report).toHaveBeenCalledWith('error',expect.any(WorkspaceConflict)));sync.enqueue({...seed(),business:'Still unsaved'});expect(save).toHaveBeenCalledTimes(1);});
 it('does not flush queued changes after the account is disconnected',async()=>{const save=vi.fn();const sync=new WorkspaceSync(1,seed(),save,vi.fn());sync.stop();sync.enqueue(seed());expect(save).not.toHaveBeenCalled();});
});
