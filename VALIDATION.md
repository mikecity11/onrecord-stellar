# Validation — 6 October 2026

- Frontend wallet bundle builds successfully; two Node API tests pass.
- Three Soroban contract tests passed: pooled payouts and Unclear refunds; timeout refunds, no-winner refunds and stake guards; unauthorized resolver rejection.
- Contract builds for wasm32v1-none (24,725-byte Wasm).
- Stellar testnet contract deployed: CD7KB3KOH5VF3KOPPOGDYACAIQXEBFKNQWFIKDBXR3DQPYPLBWZOB2YY.
- Resolver: GC6CDDQM4K2SVRDCKWL4LFNFPIZEXGGDJBLBHQSIFL2KPTYAVUK3HNN3 (Michael's wallet).
- Live disposable-account test created DEMO market 0 and staked 0.1 test XLM; contract market and position reads verified the stake.
- Create transaction: 469b34863abc8eb2963cb912dd83dafc2a0d917fb3ab7eebf9f9289d0b316146.
- Stake transaction: 7bf2e663753883ce994d6b0ea4d361ca515444eceaa577a935e15962a46cdab9.
- Public deployment metadata supplies contract configuration; market browsing does not require connecting a wallet.

Pending: live resolution signed by Michael and claim verification after the one-hour review period. No mainnet claims, independent appeals or GenLayer integration. The disposable demonstration account key was not retained.

The Soroban SDK host test dependency was pinned to ed25519-dalek 2.2.0 in Cargo.lock to avoid a transitive incompatible major upgrade. Use the committed lockfile.

9 October update: four Node tests pass, including metadata round-trip, legacy compatibility, placeholder/length validation and pending/resolved receipt export. Frontend bundle builds. Real-world templates and current-state promise receipts use the deployed contract without changing its payout rules.

9 October marketplace redesign: six Node tests pass. Added structured Yes/No/refund-rule validation, UTF-8 byte limits, issuer attribution, legacy reads and combined market discovery checks. Responsive market browser and creation flow use the same testnet contract.

9 October winner fee: five Soroban tests pass, covering proportional profit fees, stakes on both sides, fee transfers to the resolver, fee rounding, zero profit, refunds, unauthorized resolution and repeated claims. Seven Node tests pass; frontend bundle and release Wasm build successfully. A new testnet contract implements the 1% positive-net-profit fee: CBOKTE7ZZIID3Q7TNG2D57C7D6242YMIDU5TTYFXJ3KWOAR62UD556NJ. Original markets remain available on CD7KB3KOH5VF3KOPPOGDYACAIQXEBFKNQWFIKDBXR3DQPYPLBWZOB2YY with 0% fee. API transaction targets must match a registered contract; new creation targets the current contract.

Fee contract upload: 3add5d31af116c6e02637787e84300ae44d136b1e3795a721941dd16a8fbd5ce. Deployment: 63d62c13177811c1457b35aa3259b13e1f583b190139a187726a44888129569e. Live resolver-signed resolution and claim/fee transfer remain pending; unit tests verify balances with the Soroban token implementation.

9 October issuer reward split: six Soroban tests and eight Node tests pass; frontend and release Wasm builds pass. New markets charge 0.3% of positive net winning profit to the immutable creator wallet and 0.7% to the resolver/platform wallet. Each share rounds down independently to whole stroops. Tests verify exact recipient balances, creator-as-winner and creator-as-loser, both-side net accounting, refunds, zero profit, rounding and duplicate claims.

Split-fee testnet contract: CCHUTI7DWXPHSRHCIFZCMMD7M3U2HRV4Z2WJLP2JNS4YA22GSX3FMN5X. Upload: 151e6404f772d8b11fd0e84c0c855df614ffdb161cfe1c185e9f9a53679402b6. Deployment: 7c2ca73d761ad03888507ce9ebd7578b474215b847556b82bbfb6d106ad2d425. Earlier contracts retain their original fee rules and are supported explicitly by market links and API transaction targets. Creation, prediction and receipt disclosures show the fee split; a copy-market-link button supports sharing. Live resolver-signed payout/fee verification still requires user wallet signatures.
