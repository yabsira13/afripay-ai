import {z} from 'zod';
import type {Workspace} from './types';

const text=z.string().max(100000),short=z.string().max(200),id=z.string().min(1).max(200);
const risk=z.object({score:z.number().min(0).max(100),level:z.enum(['Low','Medium','High','Critical']),evidence:z.array(z.object({code:short,points:z.number().min(0).max(100),reason:text,source:z.enum(['confirmed','observation','heuristic','unknown'])}).strict()).max(100),recommendation:text,blocked:z.boolean()}).strict();
/** This is a simulation document, never a financial ledger or proof of settlement. */
export const workspaceSchema=z.object({
 business:short,owner:short,currency:z.literal('USD'),
 invoices:z.array(z.object({id,number:short,supplier:short,amount:short,currency:short,wallet:short,chain:short,due:short,status:z.enum(['Needs review','Ready to pay','Paid (demo)','Flagged']),verified:z.boolean(),text,createdAt:short,risk:risk.optional(),creditTransferId:short.optional()}).strict()).max(1000),
 suppliers:z.array(z.object({id,name:short,wallet:short,chain:short,trusted:z.boolean()}).strict()).max(1000),
 payments:z.array(z.object({id,invoiceId:id.optional(),supplier:short,amount:short,asset:short,recipient:short,chain:short,status:z.enum(['Pending approval','Processing (demo)','Settled (demo)','Failed (demo)','Refunded (demo)']),createdAt:short,mode:z.literal('demo'),risk,receipt:short.optional()}).strict()).max(1000),
 events:z.array(z.object({id,title:short,risk,at:short,read:z.boolean()}).strict()).max(2000),
 audits:z.array(z.object({id,at:short,action:short,detail:text,mode:z.literal('demo')}).strict()).max(5000),
 policy:z.object({singleLimit:z.number().finite().positive(),dailyLimit:z.number().finite().positive(),manualHighRisk:z.boolean()}).strict()
}).strict();
export type SavedWorkspace={snapshot:Workspace;revision:number};
export class WorkspaceConflict extends Error {constructor(){super('Another tab or device saved newer changes. Download your unsaved copy, then reload the saved workspace.');}}
export function parseSavedWorkspace(value:unknown):SavedWorkspace {
 const row=z.object({snapshot:workspaceSchema,revision:z.number().int().positive()}).passthrough().parse(value);
 return {snapshot:row.snapshot,revision:row.revision};
}
/** Serialize saves; a stale device can never overwrite a newer revision. */
export class WorkspaceSync {
 private queued:Workspace|null=null;
 private saving=false;
 private paused=false;
 private stopped=false;
 private latest:Workspace;
 getRevision(){return this.revision;}
 constructor(private revision:number,initial:Workspace,private save:(data:Workspace,revision:number)=>Promise<SavedWorkspace>,private report:(state:'saving'|'saved'|'error',error?:Error)=>void){this.latest=initial;}
 enqueue(data:Workspace){if(this.stopped||data===this.latest)return;this.latest=data;this.queued=data;void this.flush();}
 retry(){if(this.stopped)return;this.paused=false;this.queued=this.latest;void this.flush();}
 stop(){this.stopped=true;this.queued=null;}
 private async flush(){
  if(this.saving||this.paused||this.stopped||!this.queued)return;
  this.saving=true;this.report('saving');
  try{
   while(this.queued&&!this.stopped){const pending=this.queued;this.queued=null;const saved=await this.save(pending,this.revision);if(saved.revision!==this.revision+1)throw new Error('Unexpected workspace revision. Reload before saving again.');this.revision=saved.revision;}
   if(!this.stopped)this.report('saved');
  }catch(error){this.paused=true;if(!this.stopped)this.report('error',error instanceof Error?error:new Error('Workspace was not saved.'));}
  finally{this.saving=false;}
 }
}
