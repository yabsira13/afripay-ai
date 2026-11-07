import {test,expect} from '@playwright/test';
import {seed} from '../../lib/seed';
import {service,signin,A,token} from './fixtures/account-service';
test('runtime settings enable sign-in and private demo save after a build without credentials',async({page})=>{
 const {records}=await service(page);await signin(page);await expect(page.getByRole('heading',{name:/Welcome, Alice/})).toBeVisible();await expect(page.getByRole('button',{name:'Admin console',exact:true})).toHaveCount(0);
 await page.goto('/invoices/upload');await page.getByRole('button',{name:'Try a clean invoice'}).click();await page.getByRole('button',{name:'Extract fields',exact:true}).click();await page.getByLabel('Invoice number',{exact:true}).fill('PRIVATE-A-001');await page.getByRole('button',{name:'Save & run security checks'}).click();await expect.poll(()=>records.get(A)?.snapshot.invoices.some(i=>i.number==='PRIVATE-A-001')).toBe(true);await page.reload();await expect(page.getByRole('heading',{name:'PRIVATE-A-001'})).toBeVisible();
});
test('a regular user cannot load the console or fetch its application list',async({page})=>{
 const {requests}=await service(page);await signin(page);requests.length=0;await page.goto('/admin');await expect(page.getByRole('heading',{name:'Administrator access required'})).toBeVisible();await expect(page.getByRole('button',{name:'Approve supplier'})).toHaveCount(0);expect(requests).not.toContain('/rest/v1/supplier_applications');
});
test('only an appointed administrator sees the console navigation and separate layout',async({page})=>{
 await service(page);await signin(page,'admin@example.com');const menu=page.getByRole('button',{name:'Open navigation'});if(await menu.isVisible())await menu.click();await page.getByRole('button',{name:'Admin console',exact:true}).click();await expect(page.getByRole('heading',{name:'Supplier review panel'})).toBeVisible();await expect(page.locator('.admin-topbar')).toContainText('AFRIPAY · Admin console');await expect(page.locator('.sidebar')).toHaveCount(0);
});
test('signup shows a persistent email-confirmation screen',async({page})=>{
 await service(page);await page.goto('/auth');await page.getByRole('group',{name:'Account access'}).getByRole('button',{name:'Create account',exact:true}).click();await page.getByLabel('Full name',{exact:true}).fill('Alice User');await page.getByLabel('Email address',{exact:true}).fill('new@example.com');await page.getByLabel('Password',{exact:true}).fill('ValidPassword123!');await page.getByRole('button',{name:'Create account',exact:true}).last().click();await expect(page.getByRole('heading',{name:'Check your email'})).toBeVisible();await expect(page.getByText('new@example.com',{exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'I confirmed my email — Sign in'})).toBeVisible();
});
test('incorrect passwords show a visible error instead of pretending to sign in',async({page})=>{
 await service(page);await page.goto('/auth');await page.getByLabel('Email address',{exact:true}).fill('alice@example.com');await page.getByLabel('Password',{exact:true}).fill('WrongPassword123!');await page.getByRole('button',{name:'Sign in',exact:true}).last().click();await expect(page.getByRole('alert').filter({hasText:'Invalid login credentials'})).toBeVisible();await expect(page.getByRole('heading',{name:'Good to have you here.'})).toBeVisible();
});
test('signing out and into another account hides the previous account invoices',async({page})=>{
 const {records}=await service(page);records.set(A,{snapshot:{...seed(),invoices:[{...seed().invoices[0],number:'ALICE-PRIVATE-INVOICE'}]},revision:1});await signin(page);await page.goto('/invoices');await expect(page.getByText('ALICE-PRIVATE-INVOICE',{exact:true})).toBeVisible();const menu=page.getByRole('button',{name:'Open navigation'});if(await menu.isVisible())await menu.click();await page.getByRole('button',{name:'Sign out',exact:true}).click();await page.getByLabel('Email address',{exact:true}).fill('bob@example.com');await page.getByLabel('Password',{exact:true}).fill('ValidPassword123!');await page.getByRole('button',{name:'Sign in',exact:true}).last().click();await expect(page.getByText(/Simulation saved privately in Supabase/)).toBeVisible();await page.goto('/invoices');await expect(page.getByText('ALICE-PRIVATE-INVOICE',{exact:true})).toHaveCount(0);await expect(page.getByText('Bob Trading',{exact:true}).first()).toBeVisible();
});
test('password-reset requests explain the email next step',async({page})=>{
 await service(page);await page.goto('/auth/forgot');await page.getByLabel('Account email').fill('alice@example.com');await page.getByRole('button',{name:'Send reset link',exact:true}).click();await expect(page.getByRole('heading',{name:'Check your inbox'})).toBeVisible();await expect(page.getByText('Enter your new password twice on the reset page.')).toBeVisible();
});
test('verified recovery callback updates the password and verifies the new credential',async({page})=>{
 await service(page);const hash=new URLSearchParams({access_token:token(A),refresh_token:'test-recovery-refresh',expires_in:'3600',token_type:'bearer',type:'recovery'});
 await page.goto('/auth/reset#'+hash.toString());await expect(page.getByLabel('New password',{exact:true})).toBeVisible();await page.getByLabel('New password',{exact:true}).fill('UpdatedPassword456!');await page.getByLabel('Confirm new password',{exact:true}).fill('UpdatedPassword456!');await page.getByRole('button',{name:'Update password',exact:true}).click();await expect(page.getByRole('heading',{name:'Password updated'})).toBeVisible();await expect(page.getByText(/new password was verified/)).toBeVisible();await page.getByRole('button',{name:'Continue to sign in'}).click();await page.getByLabel('Password',{exact:true}).fill('UpdatedPassword456!');await page.getByRole('button',{name:'Sign in',exact:true}).last().click();await expect(page.getByText(/Simulation saved privately in Supabase/)).toBeVisible();
});
test('an ordinary sign-in session does not unlock password recovery',async({page})=>{
 await service(page);await signin(page);await page.goto('/auth/reset');await expect(page.getByRole('button',{name:'Request a new reset link'})).toBeVisible();await expect(page.getByLabel('New password',{exact:true})).toHaveCount(0);
});
