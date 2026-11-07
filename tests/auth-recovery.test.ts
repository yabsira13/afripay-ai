import {describe,it,expect,vi} from 'vitest';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import type {SupabaseClient} from '@supabase/supabase-js';
import {signupOutcome,recoveryCallback,completePasswordRecovery,validateNewPassword} from '../lib/auth-recovery';
import ResetPassword from '../components/reset-password';
import ForgotPassword from '../components/forgot-password';
const now=Date.parse('2026-11-05T12:00:00Z'),grant={userId:'owner-1',expiresAt:now+600000};
const password='ExampleNewPassword!123';
function fake(){const auth={getUser:vi.fn().mockResolvedValue({data:{user:{id:'owner-1',email:'owner@example.com'}},error:null}),updateUser:vi.fn().mockResolvedValue({data:{user:{id:'owner-1'}},error:null}),signInWithPassword:vi.fn().mockResolvedValue({data:{user:{id:'owner-1'},session:{user:{id:'owner-1'}}},error:null}),signOut:vi.fn().mockResolvedValue({error:null})};return {auth,client:{auth} as unknown as SupabaseClient};}
describe('Honest existing-email signup handling',()=>{
 it('does not promise an email for an obfuscated duplicate response',()=>{expect(signupOutcome({session:null,user:{identities:[]}})).toBe('not-created');});
 it('shows confirmation for a real new identity without a session',()=>{expect(signupOutcome({session:null,user:{identities:[{provider:'email'}]}})).toBe('confirmation');});
 it('does not request confirmation when the provider already signed the user in',()=>{expect(signupOutcome({session:{},user:{identities:[]}})).toBe('signed-in');});
 it('does not invent a signup success when no user was returned',()=>{expect(signupOutcome({session:null,user:null})).toBe('not-created');});
});
describe('Recovery link routing',()=>{
 it('recognizes recovery on the root fallback without retaining token strings',()=>{const result=recoveryCallback('http://localhost:3000/#type=recovery&access_token=do-not-log-me&refresh_token=private');expect(result).toEqual({isRecovery:true,error:null});expect(JSON.stringify(result)).not.toContain('do-not-log-me');});
 it('treats expired links as actionable errors',()=>{expect(recoveryCallback('http://localhost:3000/auth/reset#error=access_denied&error_code=otp_expired').error).toContain('expired');});
 it('does not send an expired signup confirmation into password recovery',()=>{const result=recoveryCallback('http://localhost:3000/auth#error_code=otp_expired');expect(result.isRecovery).toBe(false);expect(result.error).toContain('confirmation link');});
});
describe('Password recovery session and credential checks',()=>{
 it('rejects an ordinary session without a recovery grant before contacting the provider',async()=>{const {client,auth}=fake();await expect(completePasswordRecovery(client,null,password,password,now)).rejects.toThrow(/fresh password-reset link/);expect(auth.getUser).not.toHaveBeenCalled();expect(auth.updateUser).not.toHaveBeenCalled();});
 it('rejects expired grants',async()=>{const {client,auth}=fake();await expect(completePasswordRecovery(client,{...grant,expiresAt:now-1},password,password,now)).rejects.toThrow(/fresh password-reset link/);expect(auth.updateUser).not.toHaveBeenCalled();});
 it('rejects password mismatch and short values',()=>{expect(()=>validateNewPassword(password,password+'different')).toThrow(/do not match/);expect(()=>validateNewPassword('short','short')).toThrow(/12 characters/);});
 it('does not update the wrong signed-in account',async()=>{const {client,auth}=fake();auth.getUser.mockResolvedValue({data:{user:{id:'other-account',email:'other@example.com'}},error:null});await expect(completePasswordRecovery(client,grant,password,password,now)).rejects.toThrow(/does not match/);expect(auth.updateUser).not.toHaveBeenCalled();});
 it('validates identity, updates the password, verifies the new login, and clears the local session',async()=>{const {client,auth}=fake();expect(await completePasswordRecovery(client,grant,password,password,now)).toEqual({email:'owner@example.com',verified:true,cleanupError:false});expect(auth.updateUser).toHaveBeenCalledWith({password});expect(auth.signInWithPassword).toHaveBeenCalledWith({email:'owner@example.com',password});expect(auth.signOut).toHaveBeenCalledWith({scope:'local'});expect(auth.getUser.mock.invocationCallOrder[0]).toBeLessThan(auth.updateUser.mock.invocationCallOrder[0]);expect(auth.updateUser.mock.invocationCallOrder[0]).toBeLessThan(auth.signInWithPassword.mock.invocationCallOrder[0]);});
 it('never reports success after a failed password update',async()=>{const {client,auth}=fake();auth.updateUser.mockResolvedValue({data:{user:null},error:{message:'Provider rejected password'}} as never);await expect(completePasswordRecovery(client,grant,password,password,now)).rejects.toMatchObject({message:'Provider rejected password'});expect(auth.signInWithPassword).not.toHaveBeenCalled();});
 it('distinguishes a changed password from a failed subsequent login check',async()=>{const {client,auth}=fake();auth.signInWithPassword.mockResolvedValue({data:{session:null,user:null},error:{message:'Rate limited'}} as never);expect(await completePasswordRecovery(client,grant,password,password,now)).toMatchObject({verified:false,email:'owner@example.com'});expect(auth.signOut).toHaveBeenCalled();});
});
describe('Recovery screens',()=>{
 it('does not show a password-update form until a recovery link is verified',()=>{const html=renderToStaticMarkup(React.createElement(ResetPassword,{grant:null,checking:false,linkError:'',onRequestNew:()=>{},onSignIn:()=>{}}));expect(html).toContain('normal sign-in session cannot unlock');expect(html).not.toContain('autocomplete="new-password"');});
 it('offers email recovery without a misleading success notice before submission',()=>{const html=renderToStaticMarkup(React.createElement(ForgotPassword,{initialEmail:'owner@example.com',onSignIn:()=>{}}));expect(html).toContain('Account email');expect(html).toContain('Send reset link');expect(html).not.toContain('a password-reset email has been requested');});
});
