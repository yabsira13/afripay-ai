import {describe,it,expect,vi,afterEach} from 'vitest';
import {checkAuthSettings} from '../lib/auth-settings';
import {GET} from '../app/api/config/route';
const key='sb_publishable_abcdefghijklmnopqrstuv';
afterEach(()=>vi.unstubAllEnvs());
describe('Account setup validation',()=>{
 it('accepts and normalizes public project settings',()=>{expect(checkAuthSettings(' https://example.supabase.co/ ',key)).toEqual({settings:{url:'https://example.supabase.co',publishableKey:key},issue:''});});
 it('identifies a missing URL or key without exposing credentials',()=>{expect(checkAuthSettings('',key).issue).toContain('NEXT_PUBLIC_SUPABASE_URL');expect(checkAuthSettings('https://example.supabase.co','').issue).toContain('NEXT_PUBLIC_SUPABASE_ANON_KEY');});
 it('never exposes a secret or service-role key in public configuration',async()=>{for(const value of ['sb_secret_private_value',`x.${btoa(JSON.stringify({role:'service_role'}))}.x`]){vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL','https://example.supabase.co');vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY',value);const response=await GET();const json=await response.json();expect(json.authConfigured).toBe(false);expect(json.supabase).toBeNull();expect(JSON.stringify(json)).not.toContain(value);}});
 it('rejects invalid URLs, credentials and nonlocal insecure hosts',()=>{for(const url of ['not a url','https://x.supabase.co/path','https://user:password@example.com','http://example.com','https://example.com?secret=1'])expect(checkAuthSettings(url,key).settings).toBeNull();});
 it('accepts a legacy anon key but not admin roles',()=>{const token=`x.${btoa(JSON.stringify({role:'anon'}))}.x`;expect(checkAuthSettings('https://example.supabase.co',token).settings).not.toBeNull();});
 it('reads public settings at request time and disables caching',async()=>{vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL','https://first.supabase.co');vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY',key);expect((await (await GET()).json()).supabase.url).toBe('https://first.supabase.co');vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL','https://second.supabase.co');const response=await GET();expect((await response.json()).supabase.url).toBe('https://second.supabase.co');expect(response.headers.get('cache-control')).toBe('no-store');});
});
describe('Local setup repair preserves working integrations',()=>{
 it('changes only the two public auth settings and preserves AI/server settings',async()=>{const {updateSettings}=await import('../scripts/setup-settings.mjs');const output=updateSettings('# existing\nAI_API_KEY=keep-this-private-value\nNEXT_PUBLIC_SUPABASE_URL=old\nNEXT_PUBLIC_SUPABASE_ANON_KEY=old\nOTHER_SETTING=keep\n','https://new.supabase.co',key);expect(output).toContain('AI_API_KEY=keep-this-private-value');expect(output).toContain('OTHER_SETTING=keep');expect(output).toContain('NEXT_PUBLIC_SUPABASE_URL=https://new.supabase.co');expect(output.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=/g)).toHaveLength(1);});
 it('does not accept a secret key during setup',async()=>{const {updateSettings}=await import('../scripts/setup-settings.mjs');expect(()=>updateSettings('','https://example.supabase.co','sb_secret_do_not_use')).toThrow(/not accepted/);});
});
