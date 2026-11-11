import {bscTokens} from './bsc-payments';
import {nativeAsset,type LiveToken} from './live-payments';
export const directNearAsset='native:near';
export const nativeNearToken:LiveToken={assetId:directNearAsset,symbol:'NEAR',blockchain:'near',decimals:24,contractAddress:null};
export const networkNames:Record<string,string>={near:'NEAR',bsc:'BNB Smart Chain (BSC)',eth:'Ethereum',base:'Base',arb:'Arbitrum',polygon:'Polygon',optimism:'Optimism',sol:'Solana'};
export function normalizeToken(t:LiveToken):LiveToken{return {...t,blockchain:t.blockchain==='op'?'optimism':t.blockchain==='pol'?'polygon':t.blockchain};}
export function receivingTokens(tokens:LiveToken[]){const unique=new Map<string,LiveToken>();for(const item of [nativeNearToken,...bscTokens,...tokens.map(normalizeToken)])if(networkNames[item.blockchain]&&item.assetId!==nativeAsset)unique.set(item.blockchain+':'+item.assetId,item);return [...unique.values()].sort((a,b)=>a.assetId===directNearAsset?-1:b.assetId===directNearAsset?1:a.symbol.localeCompare(b.symbol));}
/** Never put a contract address in the selector; retain an unambiguous variant label. */
export function tokenLabel(token:LiveToken,tokens:LiveToken[]){const peers=tokens.filter(t=>t.blockchain===token.blockchain&&t.symbol===token.symbol);if(peers.length<=1)return token.symbol;return token.symbol+' · variant '+(peers.findIndex(t=>t.assetId===token.assetId)+1);}
export function inputError(result:{error?:string;details?:{path?:unknown;message:string}[]}){return result.details?.map(d=>(Array.isArray(d.path)&&d.path.length?String(d.path[0])+': ':'')+d.message).join(' · ')||result.error||'Request failed.';}
