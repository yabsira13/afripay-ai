import {z} from 'zod';
import {validAddress} from './security';
export const supplierApplicationSchema=z.object({business_name:z.string().trim().min(2).max(160),country:z.string().trim().min(2).max(80),wallet:z.string().trim().min(2).max(128),chain:z.enum(['near','base','eth','arb','sol'])}).refine(value=>validAddress(value.wallet,value.chain)&&!value.wallet.endsWith('.testnet'),{message:'Enter a valid mainnet wallet for the selected chain.',path:['wallet']});
export type DirectorySupplier={id:string;owner_id:string;business_name:string;country:string;wallet:string;chain:string;status:'pending'|'approved'|'rejected';created_at:string;updated_at:string;reviewed_at?:string;wallet_verified_at?:string};
export function supplierSetupMessage(message:string){return /does not exist|schema cache|Could not find|PGRST20[025]/i.test(message)?'Supplier registration needs database setup. The founder must run supabase/supplier-marketplace.sql in Supabase SQL Editor.':message;}
