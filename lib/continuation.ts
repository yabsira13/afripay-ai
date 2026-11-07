import {z} from 'zod';
import {workspaceSchema} from './workspace-sync';
export const continuationKey='afripay-guest-task-v1';
const schema=z.object({createdAt:z.number(),returnTo:z.string().max(100).regex(/^[a-z/-]+$/),invoice:workspaceSchema.shape.invoices.element.nullable(),text:z.string().max(100000),suppliers:workspaceSchema.shape.suppliers.max(5)}).strict();
export type GuestTask=z.infer<typeof schema>;
export function saveGuestTask(storage:Pick<Storage,'setItem'>,task:GuestTask){storage.setItem(continuationKey,JSON.stringify(schema.parse(task)));}
export function takeGuestTask(storage:Pick<Storage,'getItem'|'removeItem'>,now=Date.now()):GuestTask|null{const raw=storage.getItem(continuationKey);storage.removeItem(continuationKey);if(!raw)return null;try{const task=schema.parse(JSON.parse(raw));if(task.createdAt>now||now-task.createdAt>1800000)return null;return task;}catch{return null;}}
