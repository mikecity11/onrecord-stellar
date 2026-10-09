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
