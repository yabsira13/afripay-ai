import type {Workspace,Supplier} from './types';
import {sameAddress} from './security';
/** Display contacts without changing the saved trust baseline used by risk checks. */
export function supplierContacts(workspace:Pick<Workspace,'suppliers'|'invoices'>):Supplier[]{
 const contacts=[...workspace.suppliers];
 for(const invoice of workspace.invoices){
  if(!invoice.supplier.trim())continue;
  if(contacts.some(s=>sameSupplierDestination(s,{name:invoice.supplier,wallet:invoice.wallet,chain:invoice.chain})))continue;
  contacts.push({id:'invoice-contact:'+invoice.id,name:invoice.supplier,wallet:invoice.wallet,chain:invoice.chain,trusted:false});
 }
 return contacts;
}
export function sameSupplierDestination(a:Pick<Supplier,'name'|'wallet'|'chain'>,b:Pick<Supplier,'name'|'wallet'|'chain'>){return a.name.trim().toLowerCase()===b.name.trim().toLowerCase()&&a.chain===b.chain&&sameAddress(a.wallet,b.wallet,a.chain);}
