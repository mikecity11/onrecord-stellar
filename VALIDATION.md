# Validation — 5 October 2026

- Frontend wallet bundle builds successfully.
- Two Node API tests passed.
- Three Soroban contract tests passed: pooled payouts and Unclear refunds; timeout refunds, no-winner refunds and stake guards; unauthorized resolver rejection.
- Contract builds successfully for wasm32v1-none (24,725-byte Wasm).
- Local home, create, resolver and configuration routes return HTTP 200.
- Code pushed to mikecity11/onrecord-stellar before Vercel deployment.
- Frontend preview deployed; live market deposits are disabled because CONTRACT_ID is unset.

Pending: Michael's public resolver wallet, testnet deployment/configuration and live wallet create → stake → resolve → claim verification. No mainnet claims, independent appeals or GenLayer integration.

The Soroban SDK host test dependency was pinned to ed25519-dalek 2.2.0 in Cargo.lock to avoid a transitive incompatible major upgrade. Use the committed lockfile.
