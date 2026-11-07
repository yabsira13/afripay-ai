import {describe,it,expect} from 'vitest';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import AdminWorkspace from '../components/admin-workspace';
const handlers={onSignIn:()=>{},onBack:()=>{}};
describe('Separate admin console',()=>{
 it('never renders application or approval controls for an ordinary signed-in account',()=>{const html=renderToStaticMarkup(React.createElement(AdminWorkspace,{...handlers,userId:'ordinary-user',allowed:false,checking:false}));expect(html).toContain('Administrator access required');expect(html).not.toContain('Approve supplier');expect(html).not.toContain('Supplier review panel');});
 it('does not render privileged content while access is being checked',()=>{const html=renderToStaticMarkup(React.createElement(AdminWorkspace,{...handlers,userId:'user',allowed:false,checking:true}));expect(html).toContain('Checking administrator access');expect(html).not.toContain('Supplier review panel');});
 it('requires an account when the direct console URL is opened',()=>{const html=renderToStaticMarkup(React.createElement(AdminWorkspace,{...handlers,userId:null,allowed:false,checking:false}));expect(html).toContain('Sign in to continue');expect(html).not.toContain('Approve supplier');});
});
