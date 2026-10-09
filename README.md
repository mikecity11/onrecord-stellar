# OnRecord — Stellar project-promise prediction markets

Working title; brand availability has not been checked. Separate from Afterlight.

User-listed, testnet-only Yes/No prediction markets across sports, politics, entertainment, business, crypto, technology and everyday events. Issuers publish detailed Yes, No and unclear/refund rules, evidence sources and deadlines. Resolver wallet GC6CDDQM4K2SVRDCKWL4LFNFPIZEXGGDJBLBHQSIFL2KPTYAVUK3HNN3 is assigned in the deployed testnet contract (see deployment.json).

## Stack and setup
Node 22, vanilla JavaScript, Freighter, Stellar JS SDK, Rust Soroban contract.

```
npm ci
npm run build
npm start
cargo test --manifest-path contracts/market/Cargo.toml
cargo build --manifest-path contracts/market/Cargo.toml --target wasm32v1-none --release
```

Deploy the Wasm to Stellar testnet with constructor arguments `resolver` (the designated public wallet address) and `token` (native XLM Stellar Asset Contract). deployment.json supplies the current and supported original contracts. Signatures stay in Freighter; the API assembles unsigned transactions. The app requires a funded testnet wallet.

## Rules
- One designated human resolver, who cannot stake.
- Predictions close before or at the outcome deadline; maximum 30-day markets.
- Each stake is positive and at most 10 test XLM.
- Result: Yes, No, or Unclear; public evidence and explanation required.
- One-hour review delay, with resolver corrections resetting the delay. No independent appeals are implemented.
- Proportional pooled payouts. New markets charge 1% of positive net profit at claim, split as 0.3% to the issuer wallet and 0.7% to the resolver/platform wallet. Profit is gross payout minus the claimant’s stakes on both sides. Principal, losing positions and refunds are fee-free. Each fee share rounds down to whole stroops; payout rounding dust remains in contract.
- Earlier markets retain their original contract and fee rules (0% or 1% to the resolver). Market links and transaction requests identify the contract explicitly; the original contract cannot be upgraded.
- Unclear and zero-winner outcomes refund original contributions.
- No result within seven days of deadline: user can claim original contribution. Late resolutions are blocked. Existing proposals remain authoritative.
- Claims require user authorization and cannot be repeated.
- Persistent storage TTL is renewed on access. Testnet data may reset. This is an unaudited prototype, not a mainnet product.

## Pending
Live resolver-signing and payout verification, brand review. GenLayer integration is intentionally deferred.

## User-listed prediction markets

Anyone with a funded Stellar Testnet wallet can list a market. The creator is recorded as the issuer; a designated human resolver signs settlement against the issuer’s published rules. Issuers do not automatically gain resolution authority.

The frontend provides category/search/status filters, pool sorting, explicit outcome-rule fields, category templates, issuer wallet visibility, a copy-market-link action for promotion, a wallet disconnect action, current-state market receipts and JSON exports. Examples are labelled templates and are not live markets. No simulated liquidity or adoption metrics are displayed.

New metadata is encoded in `ONRECORD-MARKET-V2` JSON within the contract rules field; original rules and `ONRECORD-PROMISE-V1` records remain readable. Combined rules are limited to 2,000 UTF-8 bytes. Receipts identify the contract, fee basis and fee recipient.

Receipts reference current state, not a full verdict correction history. Source links are not archived webpage snapshots. Live resolver-signed resolution and subsequent claim verification remain pending.
