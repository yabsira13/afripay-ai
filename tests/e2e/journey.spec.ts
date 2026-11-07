import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {PDFDocument} from 'pdf-lib';
import {service,signin} from './fixtures/account-service';
test('clean invoice reaches simulated settlement and a receipt',async({page})=>{
 await service(page);await signin(page);
 await page.goto('/invoices/upload');await page.getByRole('button',{name:'Try a clean invoice'}).click();await page.getByRole('button',{name:'Extract fields',exact:true}).click();await page.getByLabel('Invoice number',{exact:true}).fill('INV-E2E-200');await page.getByLabel('I independently verified this recipient wallet and chain.').check();await page.getByRole('button',{name:'Save & run security checks'}).click();await page.getByRole('button',{name:'Prepare payment',exact:true}).click();await page.getByRole('button',{name:'Open invoice preview'}).click();await page.getByRole('button',{name:'Check security & compare routes'}).click();await page.getByRole('button',{name:'Review demo payment'}).click();await page.getByLabel('I confirm the recipient, amount, minimum output and destination chain.').check();await page.getByRole('button',{name:'Approve demo payment'}).click();await page.getByRole('button',{name:'Simulate confirmed settlement'}).click();await page.goto('/transactions');await expect(page.getByText('Settled (demo)',{exact:true})).toBeVisible();const download=page.waitForEvent('download');await page.getByRole('button',{name:'Preview receipt'}).click();const receipt=await download;expect(receipt.suggestedFilename()).toMatch(/\.pdf$/);const pdf=await PDFDocument.load(await readFile((await receipt.path())!));expect(pdf.getPageCount()).toBeGreaterThan(0);
});
test('changed supplier wallet is blocked before payment',async({page})=>{
 await page.goto('/invoices/upload');await page.getByRole('button',{name:'Try a suspicious invoice'}).click();await page.getByRole('button',{name:'Extract fields',exact:true}).click();await page.getByRole('button',{name:'Save & run security checks'}).click();await expect(page.getByText('Critical risk',{exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Prepare payment',exact:true})).toBeDisabled();await expect(page.getByText(/Payment destination differs from the saved supplier record/)).toBeVisible();
});
test('demo/live switch persists and hides sample invoices from the live view',async({page})=>{
 await page.goto('/');await page.getByRole('group',{name:'Workspace mode'}).getByRole('button',{name:/Live wallet/}).click();await expect(page.getByRole('heading',{name:'Your wallet. Real on-chain data.'})).toBeVisible();await expect(page.getByText('$24,860')).toHaveCount(0);await page.reload();await expect(page.getByRole('heading',{name:'Your wallet. Real on-chain data.'})).toBeVisible();const menu=page.getByRole('button',{name:'Open navigation'});if(await menu.isVisible())await menu.click();await page.getByRole('button',{name:'Invoices',exact:true}).click();await expect(page.getByRole('heading',{name:'Invoices is a demo feature'})).toBeVisible();await page.getByRole('group',{name:'Workspace mode'}).getByRole('button',{name:'Demo',exact:true}).click();await expect(page.getByText('DUSD test credits have no cash value. Claim them only if you want to test.')).toBeVisible();
});
test('account creation is visible from the dashboard',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'Create account',exact:true}).click();await expect(page.getByRole('heading',{name:'A new chapter starts here.'})).toBeVisible();await expect(page.getByLabel('Email address')).toBeVisible();await expect(page.getByLabel('Password',{exact:true})).toBeVisible();
});

test('receive requires a connected wallet and never supplies a fake address',async({page})=>{
 await page.goto('/receive/wallet');await expect(page.getByRole('heading',{name:'Receive native NEAR'})).toBeVisible();await expect(page.getByText('No demo address will be substituted.',{exact:false})).toBeVisible();await expect(page.getByRole('button',{name:'Copy address',exact:true})).toHaveCount(0);
});
test('supplier and admin entry points require an account',async({page})=>{
 await page.goto('/supplier/apply');await expect(page.getByRole('heading',{name:'Become an AFRIPAY supplier'})).toBeVisible();await expect(page.getByRole('heading',{name:'Sign in to continue'})).toBeVisible();await page.goto('/admin');await expect(page.getByRole('heading',{name:'Sign in to continue'})).toBeVisible();await expect(page.getByRole('button',{name:'Approve supplier'})).toHaveCount(0);
});

test('forgot password has a dedicated email form and reset cannot update without a recovery link',async({page})=>{
 await page.goto('/auth');await page.getByRole('button',{name:'Forgot your password?',exact:true}).click();await expect(page.getByRole('heading',{name:'Forgot your password?'})).toBeVisible();await expect(page.getByLabel('Account email')).toBeVisible();await page.goto('/auth/reset');await expect(page.getByRole('button',{name:'Request a new reset link'})).toBeVisible();await expect(page.getByLabel('New password',{exact:true})).toHaveCount(0);
});

test('guest identity is clearly labeled and settings do not impersonate a real business',async({page})=>{
 await page.goto('/settings');await expect(page.getByRole('heading',{name:'Explore the sample workspace.'})).toBeVisible();await expect(page.getByText('Sample business · Demo user',{exact:true})).toBeVisible();await expect(page.getByLabel('Your first name')).toHaveCount(0);
});
test('signup collects name and intended role without an administrator option',async({page})=>{
 await page.goto('/auth');await page.getByRole('group',{name:'Account access'}).getByRole('button',{name:'Create account',exact:true}).click();await expect(page.getByLabel('Full name',{exact:true})).toBeVisible();await expect(page.getByLabel('Account type')).toBeVisible();await expect(page.getByRole('option',{name:'Administrator'})).toHaveCount(0);
});
test('testnet mode does not display the illustrative mainnet USD balance',async({page})=>{
 await page.goto('/');await page.getByRole('group',{name:'Workspace mode'}).getByRole('button',{name:'NEAR testnet',exact:true}).click();await expect(page.getByRole('heading',{name:'Test two wallets without real funds.'})).toBeVisible();await expect(page.getByText('$24,860')).toHaveCount(0);
});

test('uploads a real PDF file and leaves its extracted recipient unverified',async({page})=>{
 await page.goto('/invoices/upload');await page.locator('input[type=file]').setInputFiles('samples/AFRIPAY-clean-invoice-002.pdf');await expect(page.getByLabel('Invoice text',{exact:true})).not.toHaveValue('',{timeout:20000});await page.getByRole('button',{name:'Extract fields',exact:true}).click();await expect(page.getByLabel('Amount',{exact:true})).toHaveValue('200');await expect(page.getByLabel('I independently verified this recipient wallet and chain.')).not.toBeChecked();
});
test('assistant identifies its local source and cannot authorize a payment',async({page})=>{
 await page.goto('/assistant');await page.getByLabel('Message the assistant').fill('Pay my supplier 200 USDC');await page.getByRole('button',{name:'Send message',exact:true}).click();await expect(page.getByText('Source: local rule-based parser')).toBeVisible();await page.getByText('Structured payment proposal').click();await expect(page.locator('.chat-messages pre')).toContainText('"executionAllowed": false');await expect(page.locator('.chat-messages pre')).toContainText('"requiresApproval": true');
});
test('changing an extracted wallet clears previous verification',async({page})=>{
 await page.goto('/invoices/upload');await page.getByRole('button',{name:'Try a clean invoice'}).click();await page.getByRole('button',{name:'Extract fields',exact:true}).click();const verified=page.getByLabel('I independently verified this recipient wallet and chain.');await verified.check();await page.getByLabel('Recipient wallet',{exact:true}).fill('0x1111111111111111111111111111111111111111');await expect(verified).not.toBeChecked();
});
test('dashboard stays within the viewport and labels guest storage',async({page},testInfo)=>{
 await page.goto('/');await expect(page.getByText(/Guest demo · saved in this browser only/)).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);await page.screenshot({path:testInfo.outputPath('dashboard.png'),fullPage:true});
});


test('guest dashboard explains the difference between wallet connection and account sign-in',async({page})=>{
 await page.goto('/');await expect(page.getByRole('button',{name:'Sign in to save online'})).toBeVisible();await expect(page.getByText(/Wallet connection is separate from account sign-in/)).toBeVisible();await expect(page.getByRole('button',{name:'Admin console',exact:true})).toHaveCount(0);await expect(page.getByRole('button',{name:'Admin review',exact:true})).toHaveCount(0);
});
test('missing Supabase settings give actionable local setup instructions',async({page})=>{
 await page.route('**/api/config',route=>route.fulfill({json:{authConfigured:false,authSetupIssue:'Missing NEXT_PUBLIC_SUPABASE_URL.',supabase:null}}));await page.goto('/auth');await expect(page.getByText('Sign-in and registration are unavailable.')).toBeVisible();await page.getByText('Fix my local setup').click();await expect(page.getByText('npm.cmd run setup',{exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Sign in',exact:true}).last()).toBeDisabled();
});
