import {it,expect} from 'vitest';
import {readFile} from 'node:fs/promises';
import {inspectTestnetOutcome} from '../lib/testnet-transfer';
it('validates the recorded public RPC evidence for the founder-reported signed testnet invoice',async()=>{const observed=JSON.parse(await readFile('docs/research/testnet-signed-transfer-2026-11-10.json','utf8'));const result=inspectTestnetOutcome(observed.rpcResponse.result,{hash:'55jZE7gnpLRzhUySa2NtqxMRp6PuxfqFcWhzmECiHWGa',sender:'alephai.testnet',receiver:'afripayai.testnet',amount:'0.01'});expect(result.status).toBe('confirmed');expect(observed.blockHeader.hash).toBe(observed.rpcResponse.result.transaction_outcome.block_hash);expect(observed.blockHeader.height).toBeGreaterThan(0);});
