# OnRecord — Stellar project-promise prediction markets

Working title; brand availability has not been checked. Separate from Afterlight.

Testnet-only pooled Yes/No predictions on real-world public promises, with public criteria, deadlines, evidence and human resolution. Resolver wallet GC6CDDQM4K2SVRDCKWL4LFNFPIZEXGGDJBLBHQSIFL2KPTYAVUK3HNN3 is assigned in the deployed testnet contract (see deployment.json).

## Stack and setup
Node 22, vanilla JavaScript, Freighter, Stellar JS SDK, Rust Soroban contract.

```
npm ci
npm run build
CONTRACT_ID=C... npm start
cargo test --manifest-path contracts/market/Cargo.toml
cargo build --manifest-path contracts/market/Cargo.toml --target wasm32v1-none --release
```

Deploy the Wasm to Stellar testnet with constructor arguments `resolver` (the designated public wallet address) and `token` (native XLM Stellar Asset Contract). Set `CONTRACT_ID` in Vercel. Signatures stay in Freighter; the API assembles unsigned transactions. The app requires a funded testnet wallet.

## Rules
- One designated human resolver, who cannot stake.
- Predictions close before or at the outcome deadline; maximum 30-day markets.
- Each stake is positive and at most 10 test XLM.
- Result: Yes, No, or Unclear; public evidence and explanation required.
- One-hour review delay, with resolver corrections resetting the delay. No independent appeals are implemented.
- Proportional pooled payouts, no fees; integer rounding dust remains in contract.
- Unclear and zero-winner outcomes refund original contributions.
- No result within seven days of deadline: user can claim original contribution. Late resolutions are blocked. Existing proposals remain authoritative.
- Claims require user authorization and cannot be repeated.
- Persistent storage TTL is renewed on access. Testnet data may reset. This is an unaudited prototype, not a mainnet product.

## Pending
Live resolver-signing and payout verification, brand review. GenLayer integration is intentionally deferred.

## Public promises

Create flow provides infrastructure, electricity, education and public-service templates. Organisation, location and category are encoded with delivery criteria in the existing onchain rules field; legacy markets remain readable. Promise receipts link to current contract state, provide a JSON export and show deadline, verdict and claim timing. They do not archive source webpages or expose a full correction history. Templates are illustrative and require real sources before publishing.
