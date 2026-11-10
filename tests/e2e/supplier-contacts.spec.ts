import {test,expect} from '@playwright/test';
import {service,signin,A} from './fixtures/account-service';
import {seed} from '../../lib/seed';
test('invoice suppliers appear as contacts in Suppliers and Pay without gaining payment approval',async({page})=>{
 const mock=await service(page),snapshot=seed();snapshot.suppliers=[];mock.records.set(A,{snapshot,revision:1});await signin(page);
 await page.goto('/suppliers');await expect(page.getByText('Shenzhen Nova Trading',{exact:true})).toBeVisible();await expect(page.getByText('Kigali Creative Studio',{exact:true})).toBeVisible();await expect(page.getByText('From invoice · unverified')).toHaveCount(2);
 await page.goto('/payments');await page.getByLabel('Linked invoice (optional)').selectOption('invoice-demo-2');await expect(page.getByLabel('Approved supplier').locator('option:checked')).toHaveText('Kigali Creative Studio · near · not approved');await expect(page.getByText('This invoice contact is not an approved payment recipient.',{exact:false})).toBeVisible();await expect(page.getByRole('button',{name:'Approve supplier payment',exact:true})).toHaveCount(0);expect(mock.creditTransfers).toHaveLength(0);
 await page.getByRole('button',{name:'Preview this invoice workflow'}).click();await expect(page.getByLabel('Recipient name')).toHaveValue('Kigali Creative Studio');await expect(page.getByLabel('Recipient wallet',{exact:true})).toHaveValue('kigalicreative.near');expect(mock.records.get(A)?.snapshot.suppliers).toHaveLength(0);
});
