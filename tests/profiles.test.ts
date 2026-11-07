import {describe,it,expect,beforeAll,beforeEach,afterAll} from 'vitest';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {profileSchema,signupDetailsSchema,displayIdentity,emptyProfile,editableProfile,type AccountProfile} from '../lib/profile';
import AccountProfileForm from '../components/account-profile';
import WalletSetup from '../components/wallet-setup';
const A='11111111-1111-4111-8111-111111111111',B='22222222-2222-4222-8222-222222222222';
const profile:AccountProfile={user_id:A,full_name:'Yabsira Tekle',account_type:'customer',business_name:'Yabsira Export',country:'Ethiopia',reporting_currency:'USD',onboarding_completed:true};
describe('Profile identity and signup fields',()=>{
 it('shows explicit demo identity for guests even if stale account data is provided',()=>{expect(displayIdentity(null,profile)).toMatchObject({name:'Demo user',business:'Sample business',initials:'DU',sample:true});});
 it('never displays a previous account’s profile after switching users',()=>{expect(displayIdentity(B,profile).name).toBe('Your account');expect(displayIdentity(B,profile).business).not.toBe('Yabsira Export');});
 it('uses the signed-in user’s actual saved name and initials',()=>{expect(displayIdentity(A,profile)).toMatchObject({name:'Yabsira Tekle',firstName:'Yabsira',initials:'YT',business:'Yabsira Export',sample:false});});
 it('does not permit an administrator role through signup or profile editing',()=>{expect(signupDetailsSchema.safeParse({full_name:'A User',account_type:'admin'}).success).toBe(false);expect(profileSchema.safeParse({...editableProfile(profile),account_type:'admin'}).success).toBe(false);});
 it('does not collect or require gender or wallet secrets',()=>{expect(profileSchema.safeParse(editableProfile(profile)).success).toBe(true);expect(profileSchema.safeParse({...editableProfile(profile),seed_phrase:'secret'}).success).toBe(false);});
 it('requires a business and country before completing onboarding',()=>{expect(profileSchema.safeParse({...editableProfile(profile),business_name:'',country:''}).success).toBe(false);});
 it('extracts only editable fields from a complete database row',()=>{expect(profileSchema.safeParse(editableProfile(profile)).success).toBe(true);expect(editableProfile(profile)).not.toHaveProperty('user_id');});
 it('renders guest settings as examples instead of an editable person’s account',()=>{const html=renderToStaticMarkup(React.createElement(AccountProfileForm,{userId:null,fields:emptyProfile,loading:false,loadError:'',onRetry:()=>{},onSave:()=>{},onSignIn:()=>{}}));expect(html).toContain('Sample business');expect(html).toContain('Demo user');expect(html).not.toContain('Selam');expect(html).not.toContain('value="Addis Coffee Export"');});
 it('allows wallet setup to be skipped and never promises an automatic testnet swap',()=>{const html=renderToStaticMarkup(React.createElement(WalletSetup,{wallet:'',onConnect:()=>{},onDemo:()=>{},onSupplier:()=>{},showSupplier:false,busy:false}));expect(html).toContain('Continue without a wallet');expect(html).toContain('NEAR Intents has no testnet');expect(html).toContain('does not generate or store your seed phrase');});
});
let db:PGlite;
async function asUser(id:string){await db.exec('reset role;set role authenticated;');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);}
beforeAll(async()=>{db=new PGlite();await db.exec("create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key,raw_user_meta_data jsonb default '{}');create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth,public to authenticated;grant execute on function auth.uid() to authenticated;");await db.query("insert into auth.users(id,raw_user_meta_data) values($1,'{\"full_name\":\"A User\",\"account_type\":\"supplier\"}'),($2,'{}')",[A,B]);await db.exec(await readFile(new URL('../supabase/account-profiles.sql',import.meta.url),'utf8'));},30000);
beforeEach(async()=>{await db.exec('reset role;');});
afterAll(async()=>{await db?.close();});
describe('Private profile PostgreSQL policies',()=>{
 it('backfills existing users without assigning fake sample names',async()=>{await asUser(A);const rows=(await db.query('select full_name,account_type,onboarding_completed from public.account_profiles')).rows;expect(rows).toEqual([{full_name:'A User',account_type:'supplier',onboarding_completed:false}]);});
 it('does not expose one user’s profile to another',async()=>{await asUser(B);expect((await db.query('select * from public.account_profiles where user_id=$1',[A])).rows).toHaveLength(0);});
 it('prevents editing another user’s business profile',async()=>{await asUser(B);expect((await db.query("update public.account_profiles set full_name='Hijacked' where user_id=$1 returning user_id",[A])).rows).toHaveLength(0);});
 it('requires real fields before marking onboarding complete',async()=>{await asUser(B);await expect(db.query('update public.account_profiles set onboarding_completed=true where user_id=$1',[B])).rejects.toThrow();});
 it('allows a user to save their own profile privately',async()=>{await asUser(A);const rows=(await db.query("update public.account_profiles set full_name='A User',business_name='A Trading',country='Ethiopia',onboarding_completed=true where user_id=$1 returning business_name,onboarding_completed",[A])).rows;expect(rows).toEqual([{business_name:'A Trading',onboarding_completed:true}]);});
 it('rejects admin as an editable account type at the database level',async()=>{await asUser(B);await expect(db.query("update public.account_profiles set account_type='admin' where user_id=$1",[B])).rejects.toThrow();});
 it('seeds a new signup with its own name while ignoring forged administrative metadata',async()=>{await db.exec('reset role;');const id='33333333-3333-4333-8333-333333333333';await db.query("insert into auth.users(id,raw_user_meta_data) values($1,'{\"full_name\":\"New Person\",\"account_type\":\"admin\"}')",[id]);await asUser(id);expect((await db.query('select full_name,account_type,onboarding_completed from public.account_profiles')).rows).toEqual([{full_name:'New Person',account_type:'customer',onboarding_completed:false}]);});
 it('does not permit profile ownership reassignment',async()=>{await asUser(A);await expect(db.query('update public.account_profiles set user_id=$1 where user_id=$2',[B,A])).rejects.toThrow(/ownership/);});
});
