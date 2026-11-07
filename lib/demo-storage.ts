import {emptyWorkspace} from './seed';
import type {Workspace} from './types';
export type DemoStorage=Pick<Storage,'getItem'|'setItem'>;
export function demoStorageKey(userId:string|null){return userId?'afripay-workspace-v2:user:'+userId:'afripay-workspace-v2:guest';}
export function loadDemoWorkspace(storage:DemoStorage,userId:string|null):Workspace{
 const raw=storage.getItem(demoStorageKey(userId))||(!userId?storage.getItem('afripay-workspace-v1'):null);
 if(raw){try{const data=JSON.parse(raw);if(Array.isArray(data.invoices)&&Array.isArray(data.suppliers)&&Array.isArray(data.payments)&&Array.isArray(data.events)&&Array.isArray(data.audits)&&data.policy)return data;}catch{}}
 return emptyWorkspace();
}
export function saveDemoWorkspace(storage:DemoStorage,userId:string|null,data:Workspace){storage.setItem(demoStorageKey(userId),JSON.stringify(data));}
