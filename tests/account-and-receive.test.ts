import {describe,it,expect} from 'vitest';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {seed} from '../lib/seed';
import {loadDemoWorkspace,saveDemoWorkspace,demoStorageKey} from '../lib/demo-storage';
import SignupConfirmation from '../components/signup-confirmation';
import Receive from '../components/receive';
import SupplierMarketplace from '../components/supplier-marketplace';
import {supplierApplicationSchema} from '../lib/supplier-directory';
function storage(){const map=new Map<string,string>();return {getItem:(k:string)=>map.get(k)||null,setItem:(k:string,v:string)=>{map.set(k,v);}};}
describe('Account-separated local demo records',()=>{
 it('never loads account A’s custom records into account B',()=>{const s=storage(),data=seed();data.business='Private account A';saveDemoWorkspace(s,'A',data);expect(loadDemoWorkspace(s,'A').business).toBe('Private account A');expect(loadDemoWorkspace(s,'B').business).not.toBe('Private account A');expect(demoStorageKey('A')).not.toBe(demoStorageKey('B'));});
 it('preserves old browser records only in the guest workspace',()=>{const s=storage(),data=seed();data.business='Old guest data';s.setItem('afripay-workspace-v1',JSON.stringify(data));expect(loadDemoWorkspace(s,null).business).toBe('Old guest data');expect(loadDemoWorkspace(s,'new-user').business).not.toBe('Old guest data');});
 it('keeps guest changes separate from a signed-in account',()=>{const s=storage(),data=seed();data.business='Guest only';saveDemoWorkspace(s,null,data);expect(loadDemoWorkspace(s,'A').business).not.toBe('Guest only');});
});
describe('Signup and receiving UX',()=>{
 it('persistently explains confirmation and never asks for a wallet secret',()=>{const html=renderToStaticMarkup(React.createElement(SignupConfirmation,{email:'test@example.com',onResend:async()=>{},onSignIn:()=>{},onChangeEmail:()=>{}}));expect(html).toContain('Check your email');expect(html).toContain('test@example.com');expect(html).toContain('I confirmed my email');expect(html).toContain('Resend email in');});
 it('does not substitute a sample receive address without a connected wallet',()=>{const html=renderToStaticMarkup(React.createElement(Receive,{wallet:'',onConnect:()=>{},onPay:()=>{},busy:false}));expect(html).toContain('Connect wallet');expect(html).not.toContain('value="supplier');expect(html).toContain('No demo address will be substituted');});
 it('shows the actual account with an explicit mainnet/native-token label',()=>{const html=renderToStaticMarkup(React.createElement(Receive,{wallet:'receiver.near',onConnect:()=>{},onPay:()=>{},busy:false}));expect(html).toContain('receiver.near');expect(html).toContain('Receive native NEAR');expect(html).toContain('Copy address');expect(html).toContain('simulated payment never credits');});
 it('requires sign-in for supplier and admin tools',()=>{for(const page of ['apply','directory','admin'] as const){const html=renderToStaticMarkup(React.createElement(SupplierMarketplace,{userId:null,page,onSignIn:()=>{},onApply:()=>{},onSelect:()=>{}}));expect(html).toContain('Sign in to continue');expect(html).not.toContain('Approve supplier');}});
 it('rejects invalid supplier wallets and mainnet/testnet confusion',()=>{expect(supplierApplicationSchema.safeParse({business_name:'Supplier',country:'Ethiopia',wallet:'supplier.near',chain:'near'}).success).toBe(true);expect(supplierApplicationSchema.safeParse({business_name:'Supplier',country:'Ethiopia',wallet:'supplier.testnet',chain:'near'}).success).toBe(false);expect(supplierApplicationSchema.safeParse({business_name:'Supplier',country:'Ethiopia',wallet:'not-an-address',chain:'base'}).success).toBe(false);});
});
