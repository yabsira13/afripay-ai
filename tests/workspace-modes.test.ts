import {describe,it,expect,vi,afterEach} from 'vitest';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ModeSwitch from '../components/workspace-mode';
import LiveWorkspace from '../components/live-workspace';
import {GET as config} from '../app/api/config/route';
afterEach(()=>vi.unstubAllEnvs());
describe('Demo and live separation',()=>{
 it('labels live as read-only and selects exactly one mode',()=>{const html=renderToStaticMarkup(React.createElement(ModeSwitch,{mode:'live',onChange:()=>{}}));expect(html).toContain('Workspace mode');expect(html).toContain('Read-only');expect(html).toContain('live-selected');expect((html.match(/aria-pressed="true"/g)||[])).toHaveLength(1);});
 it('does not show sample financial data in the live view',()=>{const html=renderToStaticMarkup(React.createElement(LiveWorkspace,{accountId:'',onConnect:()=>{},onDemo:()=>{},busy:false}));expect(html).toContain('Connect your NEAR wallet');expect(html).toContain('Payments are not enabled');expect(html).not.toContain('24,860');expect(html).not.toContain('Shenzhen Nova Trading');expect(html).not.toContain('Addis Coffee Export');});
 it('shows only a live lookup placeholder for a connected account',()=>{const html=renderToStaticMarkup(React.createElement(LiveWorkspace,{accountId:'example.near',onConnect:()=>{},onDemo:()=>{},busy:false}));expect(html).toContain('example.near');expect(html).toContain('Reading live balance');expect(html).not.toContain('24,860');expect(html).not.toContain('Settled (demo)');});
 it('does not present sample invoices as live records',()=>{const html=renderToStaticMarkup(React.createElement(LiveWorkspace,{accountId:'',onConnect:()=>{},onDemo:()=>{},busy:false,feature:'Invoices'}));expect(html).toContain('Invoices is a demo feature');expect(html).not.toContain('INV-2026-014');});
});
describe('Registration readiness',()=>{
 it('reports registration unavailable without public Supabase settings',async()=>{vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL','');vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY','');const result=await (await config()).json();expect(result.authConfigured).toBe(false);expect(result.liveFundingEnabled).toBe(false);});
 it('publishes only public settings, never server secrets or funding authority',async()=>{vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL','https://example.supabase.co');vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY','sb_publishable_abcdefghijklmnopqrstuv');vi.stubEnv('AI_API_KEY','private-model-value');const result=await (await config()).json();expect(result.authConfigured).toBe(true);expect(result.supabase.publishableKey).toBe('sb_publishable_abcdefghijklmnopqrstuv');expect(JSON.stringify(result)).not.toContain('private-model-value');expect(result.liveFundingEnabled).toBe(false);});
});
