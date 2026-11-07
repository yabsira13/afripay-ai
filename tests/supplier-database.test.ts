import {beforeAll,beforeEach,afterAll,describe,it,expect} from 'vitest';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
const A='11111111-1111-4111-8111-111111111111',B='22222222-2222-4222-8222-222222222222',ADMIN='33333333-3333-4333-8333-333333333333';
let db:PGlite;
const wallet='supplier-a.near';
async function asUser(id:string){await db.exec('reset role; set role authenticated');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);}
async function apply(){await asUser(A);const result=await db.query<{id:string;status:string;wallet_verified_at:string|null}>("insert into public.supplier_applications(owner_id,business_name,country,wallet,chain) values($1,'Supplier A','Ethiopia',$2,'near') returning id,status,wallet_verified_at",[A,wallet]);return result.rows[0];}
async function snapshot(id:string){await asUser(ADMIN);return (await db.query<{wallet:string;chain:string;version:string}>('select wallet,chain,updated_at::text as version from public.supplier_applications where id=$1',[id])).rows[0];}
async function review(id:string,verified=true,snap?:{wallet:string;chain:string;version:string}){const row=snap||await snapshot(id);return db.query('select public.afripay_review_supplier($1,$2,$3,$4,$5::timestamptz,$6,$7)',[id,'approved',row.wallet,row.chain,row.version,verified,'Verified through known contact.']);}
beforeAll(async()=>{
 db=new PGlite();
 await db.exec("create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth,public to authenticated;grant execute on function auth.uid() to authenticated;");
 await db.query('insert into auth.users(id) values($1),($2),($3)',[A,B,ADMIN]);
 // gen_random_uuid is built into this embedded PostgreSQL; no pgcrypto extension is needed here.
 const sql=(await readFile(new URL('../supabase/supplier-marketplace.sql',import.meta.url),'utf8')).replace('create extension if not exists pgcrypto;','');
 await db.exec(sql);
 await db.query('insert into public.afripay_admins(user_id) values($1)',[ADMIN]);
},30000);
beforeEach(async()=>{await db.exec('reset role;truncate public.supplier_applications cascade;');});
afterAll(async()=>{await db?.close();});
describe('Supplier PostgreSQL access controls',()=>{
 it('stores a new application as pending, never wallet-verified',async()=>{expect(await apply()).toMatchObject({status:'pending',wallet_verified_at:null});});
 it('keeps another user’s pending application private',async()=>{await apply();await asUser(B);expect((await db.query('select * from public.supplier_applications')).rows).toHaveLength(0);});
 it('prevents a user from creating an application for another owner',async()=>{await asUser(B);await expect(db.query("insert into public.supplier_applications(owner_id,business_name,country,wallet,chain) values($1,'Forged supplier','Ethiopia',$2,'near')",[A,wallet])).rejects.toThrow();});
 it('does not allow self-appointment to administrator',async()=>{await asUser(B);await expect(db.query('insert into public.afripay_admins(user_id) values($1)',[B])).rejects.toThrow();});
 it('rejects reviews from ordinary users even with a valid application ID',async()=>{const app=await apply();const snap=await snapshot(app.id);await asUser(B);await expect(review(app.id,true,snap)).rejects.toThrow(/Administrator access required/);});
 it('requires explicit wallet verification before admin approval',async()=>{const app=await apply();await expect(review(app.id,false)).rejects.toThrow(/verify the supplier wallet/);});
 it('allows approved directory reads while keeping review notes private',async()=>{const app=await apply();await review(app.id);await asUser(B);const rows=(await db.query('select business_name,status from public.supplier_applications')).rows;expect(rows).toEqual([{business_name:'Supplier A',status:'approved'}]);expect((await db.query('select * from public.supplier_review_logs')).rows).toHaveLength(0);});
 it('resets an approved wallet change to pending and removes verification',async()=>{const app=await apply();await review(app.id);await asUser(A);const result=await db.query("update public.supplier_applications set wallet='changed-supplier.near' where id=$1 returning status,wallet_verified_at,reviewed_by",[app.id]);expect(result.rows[0]).toEqual({status:'pending',wallet_verified_at:null,reviewed_by:null});await asUser(B);expect((await db.query('select * from public.supplier_applications')).rows).toHaveLength(0);});
 it('prevents a non-owner from changing another application',async()=>{const app=await apply();await review(app.id);await asUser(B);expect((await db.query("update public.supplier_applications set wallet='attacker.near' where id=$1 returning id",[app.id])).rows).toHaveLength(0);});
 it('refuses to approve a wallet that changed after admin review',async()=>{const app=await apply();const old=await snapshot(app.id);await asUser(A);await db.query("update public.supplier_applications set wallet='changed-supplier.near' where id=$1",[app.id]);await asUser(ADMIN);await expect(review(app.id,true,old)).rejects.toThrow(/Application changed/);});
 it('strips forged approval fields from an owner application',async()=>{await asUser(A);const result=await db.query("insert into public.supplier_applications(owner_id,business_name,country,wallet,chain,status,wallet_verified_at,reviewed_at,reviewed_by) values($1,'Supplier A','Ethiopia',$2,'near','approved',now(),now(),$3) returning status,reviewed_by",[A,wallet,ADMIN]);expect(result.rows[0]).toEqual({status:'pending',reviewed_by:null});});
 it('records the reviewed destination and administrator in its audit log',async()=>{const app=await apply();await review(app.id);expect((await db.query('select reviewer_id,decision,wallet from public.supplier_review_logs')).rows[0]).toEqual({reviewer_id:ADMIN,decision:'approved',wallet});});
});
