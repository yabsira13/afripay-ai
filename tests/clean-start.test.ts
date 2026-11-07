import {describe,it,expect} from 'vitest';
import {emptyWorkspace} from '../lib/seed';
import {loadDemoWorkspace} from '../lib/demo-storage';
import {saveGuestTask,takeGuestTask} from '../lib/continuation';
import {seed} from '../lib/seed';
describe('Clean accounts and explicit guest continuation',()=>{
 it('new guest and signed-in workspaces have no seeded invoices, suppliers, payments or alerts',()=>{for(const id of [null,'new-user']){const data=loadDemoWorkspace({getItem:()=>null,setItem:()=>{}},id);expect(data.invoices).toHaveLength(0);expect(data.payments).toHaveLength(0);expect(data.suppliers).toHaveLength(0);expect(data.events).toHaveLength(0);}expect(emptyWorkspace().audits).toHaveLength(0);});
 it('keeps only the explicitly continued guest invoice and expires the task',()=>{const map=new Map<string,string>();const storage={setItem:(key:string,value:string)=>map.set(key,value),getItem:(key:string)=>map.get(key)||null,removeItem:(key:string)=>{map.delete(key);}};const task={createdAt:1000,returnTo:'invoices/upload',invoice:seed().invoices[0],text:'invoice text',suppliers:[]};saveGuestTask(storage,task);expect(takeGuestTask(storage,2000)?.invoice?.number).toBe(task.invoice.number);expect(takeGuestTask(storage,2000)).toBeNull();saveGuestTask(storage,task);expect(takeGuestTask(storage,2000000)).toBeNull();});
});
