import {test,expect} from '@playwright/test';
import {service,signin} from './fixtures/account-service';
test('saved testnet invoice creation and pending verification never pretend payment succeeded',async({page},testInfo)=>{
 await service(page);await signin(page);
 let invoice:any=null;
 await page.route('**/api/testnet/invoices',async route=>{
  if(route.request().method()==='GET')return route.fulfill({json:{invoices:invoice?[invoice]:[]}});
  const body=route.request().postDataJSON();expect(route.request().headers().authorization).toContain('Bearer ');
  if(body.action==='create'){invoice={...body,state:'OPEN',sender:null,funding_hash:null,proof:null,paid_at:null};return route.fulfill({json:{invoice}});}
  if(body.action==='verify')return route.fulfill({json:{invoice,reason:'Final execution is not available yet. Invoice remains unpaid.'}});
  return route.fulfill({status:409,json:{error:'Unexpected action'}});
 });
 await page.evaluate(()=>localStorage.setItem('afripay-view-mode','testnet'));await page.goto('/invoices');
 await expect(page.getByRole('heading',{name:'Create an invoice, pay it, verify the transaction.'})).toBeVisible();
 await page.getByLabel('Testnet invoice reference').fill('TEST-UI-001');await page.getByLabel('Invoice recipient testnet account').fill('supplier.testnet');await page.getByLabel('Invoice amount in test NEAR').fill('0.01');await page.getByRole('button',{name:'Create testnet invoice',exact:true}).click();
 await expect(page.getByRole('heading',{name:'TEST-UI-001'})).toBeVisible();await page.screenshot({path:'docs/screenshots/testnet-invoice-'+testInfo.project.name+'.png',fullPage:true});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await expect(page.getByRole('button',{name:'Pay testnet invoice in wallet'})).toBeDisabled();
 const hash='6zgh2u9DqHHiXzdy9ouTP7oGky2T4nugbhqsK7wQHnZS';invoice={...invoice,state:'SUBMITTED',sender:'payer.testnet',funding_hash:hash};await page.getByRole('button',{name:'Refresh saved testnet invoices'}).click();await page.getByRole('button',{name:'Verify invoice payment'}).click();
 await expect(page.getByText('Final execution is not available yet. Invoice remains unpaid.',{exact:true})).toBeVisible();await expect(page.getByRole('link',{name:'View transaction in testnet explorer'})).toHaveAttribute('href','https://testnet.nearblocks.io/txns/'+hash);await expect(page.getByRole('button',{name:'Download verified testnet receipt'})).toHaveCount(0);
});
test('slow account configuration leaves a useful public screen and navigation',async({page})=>{
 await page.route('**/api/config',async r=>{await new Promise(resolve=>setTimeout(resolve,7000));await r.fulfill({json:{authConfigured:false}}).catch(()=>{});});
 await page.goto('/');await expect(page.getByRole('heading',{name:'Your payment workspace.'})).toBeVisible({timeout:3000});await page.getByRole('button',{name:'Check NEAR data',exact:true}).click();await expect(page.getByLabel('NEAR account ID')).toBeVisible({timeout:3000});
});
test('landing footer contains the publication date',async({page})=>{await page.goto('/landing');await expect(page.locator('footer')).not.toContainText('not published yet');await expect(page.locator('footer')).toContainText('Published 2026-11-07');});
test('locked testnet authorization recovers an existing hash and exposes a verified receipt only after confirmation',async({page})=>{
 await service(page);await signin(page);const hash='6zgh2u9DqHHiXzdy9ouTP7oGky2T4nugbhqsK7wQHnZS';
 let invoice:any={id:'44444444-4444-4444-8444-444444444444',reference:'RECOVER-1',receiver:'supplier.testnet',sender:'payer.testnet',amount:'0.01',description:'Browser fixture, not an actual transfer',state:'AUTHORIZING',funding_hash:null,proof:null,paid_at:null};
 await page.route('**/api/testnet/invoices',async route=>{if(route.request().method()==='GET')return route.fulfill({json:{invoices:[invoice]}});const body=route.request().postDataJSON();expect(body.action).not.toBe('authorize');if(body.action==='attach'){expect(body.hash).toBe(hash);invoice={...invoice,state:'SUBMITTED',funding_hash:hash};}if(body.action==='verify')invoice={...invoice,state:'PAID',proof:{network:'testnet',hash,source:'Browser fixture only'},paid_at:'2026-11-10T00:00:01Z'};return route.fulfill({json:{invoice}});});
 await page.evaluate(()=>localStorage.setItem('afripay-view-mode','testnet'));await page.goto('/invoices');await expect(page.getByRole('button',{name:'Pay testnet invoice in wallet'})).toHaveCount(0);await expect(page.getByRole('button',{name:'Download verified testnet receipt'})).toHaveCount(0);await page.getByLabel('Recover transaction hash').fill(hash);await page.getByRole('button',{name:'Attach existing testnet transaction'}).click();await expect(page.getByText('PAID · TESTNET',{exact:true})).toBeVisible();const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Download verified testnet receipt'}).click();expect((await pending).suggestedFilename()).toBe('RECOVER-1-testnet-receipt.pdf');
});
