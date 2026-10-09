# OnRecord — Stellar project-promise prediction markets

Working title; brand availability has not been checked. Separate from Afterlight.

User-listed, testnet-only Yes/No prediction markets across sports, politics, entertainment, business, crypto, technology and everyday events. Issuers publish detailed Yes, No and unclear/refund rules, evidence sources and deadlines. Resolver wallet GC6CDDQM4K2SVRDCKWL4LFNFPIZEXGGDJBLBHQSIFL2KPTYAVUK3HNN3 is assigned in the deployed testnet contract (see deployment.json).

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

## User-listed prediction markets

Anyone with a funded Stellar Testnet wallet can list a market. The creator is recorded as the issuer; a designated human resolver signs settlement against the issuer’s published rules. Issuers do not automatically gain resolution authority.

The frontend provides category/search/status filters, pool sorting, explicit outcome-rule fields, category templates, issuer wallet visibility, a wallet disconnect action, current-state market receipts and JSON exports. Examples are labelled templates and are not live markets. No simulated liquidity or adoption metrics are displayed.

New metadata is encoded in `ONRECORD-MARKET-V2` JSON within the existing contract rules field; original rules and `ONRECORD-PROMISE-V1` records remain readable. Combined rules are limited to 2,000 UTF-8 bytes. The deployed contract and payout rules are unchanged.

Receipts reference current state, not a full verdict correction history. Source links are not archived webpage snapshots. Live resolver-signed resolution and subsequent claim verification remain pending.
