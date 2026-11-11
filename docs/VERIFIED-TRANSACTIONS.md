# Verified native NEAR transfers

Verified on 11 November 2026 from founder-supplied explorer links. All four transactions contain one native Transfer of exactly `10000000000000000000000` yoctoNEAR (0.01 NEAR or test NEAR), report `FINAL` successful execution, and have successful transaction/receipt outcomes. Explorer signer, receiver and block data match the RPC records.

| Network | UTC transaction time | Amount | Sender | Recipient | Explorer |
| --- | --- | --- | --- | --- | --- |
| mainnet | 2026-11-11T12:26:16+00:00 | 0.01 NEAR | `yabsera13.near` | `afripayai.near` | [Transfer 1](https://nearblocks.io/txns/GpeBUtrjjwn2ZzbXHxK5hFqkMK6mrgYegSMkq57xKrc6) |
| mainnet | 2026-11-11T11:18:27+00:00 | 0.01 NEAR | `yabsera13.near` | `afripayai.near` | [Transfer 2](https://nearblocks.io/txns/216K2NyfeTEwognrrcmmiminvR7oMLdEj5tAosBRXuhi) |
| testnet | 2026-11-10T13:59:33+00:00 | 0.01 test NEAR | `afripayai.testnet` | `alephai.testnet` | [Transfer 3](https://testnet.nearblocks.io/txns/95t7HKvGZnrYFUR5k3cG1ZCokLnjDjrJPz5ATVb6xMEv) |
| testnet | 2026-11-11T12:43:07+00:00 | 0.01 test NEAR | `alephai.testnet` | `afripayai.testnet` | [Transfer 4](https://testnet.nearblocks.io/txns/AHDKgjpWoAB9JmXReLT6hbpXdTqotiT9vty9UaCHQaK2) |

## Verification method

Mainnet records were read through Nearblocks and `https://free.rpc.fastnear.com`; testnet records through the Nearblocks testnet API and `https://test.rpc.fastnear.com`. For each hash the check verified the exact signer and receiver, one native Transfer action, its integer amount, final successful status, successful receipt outcomes and matching execution-block hash/height. No floating-point explorer aggregate was used to determine the payment amount.

The testnet Nearblocks API v1 returned a retirement response; the v3 records and direct NEAR RPC were used instead. This concerned documentation lookup only and does not change the app.

[Machine-readable verification summary](research/verified-transactions-2026-11-11/summary.json). Raw RPC, block and explorer responses are saved alongside it.

## Scope

These are independently verified on-chain native transfers supplied by the founder as AFRIPAY demonstration evidence. Native transfers contain no app-specific marker, so their hashes alone do not independently establish the initiating app or the private invoice/receipt association. App-origin and private invoice-state checks remain separate acceptance evidence. These transactions do not prove BSC transfers, cross-chain swaps or gas sponsorship. The reviewer made no payment, used no private key and accessed no private account data.
