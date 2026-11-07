export function toAtomic(amount: string, decimals: number): string {
 if(!/^\d+(?:\.\d+)?$/.test(amount)||!Number.isInteger(decimals)||decimals<0||decimals>30)throw new Error('Invalid amount or decimals');
 const [whole,fraction='']=amount.split('.');
 if(fraction.length>decimals)throw new Error('Amount has too many decimal places for this token');
 const atomic=BigInt(whole+fraction.padEnd(decimals,'0'));
 if(atomic<=0n)throw new Error('Amount must be greater than zero');
 return atomic.toString();
}
