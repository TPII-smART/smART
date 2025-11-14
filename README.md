# smART — Freelance Audiovisual Marketplace (Scaffold-ETH 2 based)

A blockchain-native freelancing platform focused on audiovisual services. **smART** leverages smart contracts, decentralized arbitration, and transparent on-chain workflows to create clear work agreements, guarantee payment conditions, and provide impartial dispute resolution, fostering trust between freelancers and clients. The project is built on top of Scaffold-ETH 2 tooling and integrates contracts, a Next.js frontend, and a Ponder indexer for on-chain event processing.

Key ideas
- Clear, on-chain work agreements (HiredTalents, Gigs).
- Dispute flow backed by an ArbiterProxy/Kleros-style arbitrator.
- Transparent metadata and evidence stored via IPFS.
- Accessible developer experience thanks to Scaffold-ETH utilities and Ponder indexing.

Links
- Scaffold-ETH docs: https://docs.scaffoldeth.io
- Scaffold-ETH website: https://scaffoldeth.io

---

## Requirements

- Node >= 20.18.3
- Yarn (v1 or v2+)
- Git

---

## Quickstart (local / development)

1. Install dependencies:
   ```bash
   yarn install
   ```

2. Start a local chain (if using local Hardhat):
   ```bash
   yarn chain
   ```

3. Deploy contracts to the local chain:
   ```bash
   yarn deploy
   ```

4. Start the Next.js app:
   ```bash
   yarn start
   ```

5. Start the Ponder indexer (development):
   ```bash
   yarn ponder:dev
   ```
   In production/deployed indexer use:
   ```bash
   yarn ponder:start
   ```

Visit the app at: http://localhost:3000

---

## Deploying to Sepolia (step-by-step)

Before deploying on Sepolia ensure your environment and RPC keys are configured (see `packages/nextjs/scaffold.config.ts` and Hardhat config). Also ensure you have the necessary API keys for Alchemy, Pinata and Etherscan set in your `.env` files (see `.env.example` files in each package).

Follow these steps to deploy and wire the arbitration system:

1. First, setup your deployer wallet (with Sepolia ETH already funded):
   ```bash
    yarn account:import
   ```

2. Make sure the deployment script for ArbiterProxy is set to use the CentralizedKleros address for Sepolia (check `packages/hardhat/deploy/04_arbiter_proxy_contract.ts`) or KlerosLiquid address if using that arbitrator. Then deploy ArbiterProxy:
   ```bash
   yarn deploy --network sepolia --tags ArbiterProxy
   ```

3. Copy the deployed ArbiterProxy address and paste it into the deploy arguments for `HiredTalentsContract` and `GigsContract` (update their deploy scripts to use the ArbiterProxy address in `packages/hardhat/deploy/00_deploy_hired_talents_contract.ts` and `01_deploy_gigs_contract.ts`).

3. Deploy `HiredTalentsContract` and `GigsContract`:
   ```bash
   yarn deploy --network sepolia --tags HiredTalentsContract
   yarn deploy --network sepolia --tags GigsContract
   ```

4. Verify ArbiterProxy on Etherscan (example):
   ```bash
   yarn hardhat:hardhat-verify --network sepolia <ArbiterProxyAddress> <KlerosAddress>
   ```

5. On Etherscan (ArbiterProxy contract page) call `addOwners` (using your shared deployer/owners wallet) and add the addresses of the deployed `HiredTalents` and `Gigs` contracts (these owners can perform specific owner-only operations).

6. Deploy `ProfileConfigContract`:
   ```bash
   yarn deploy --network sepolia --tags ProfileConfigContract
   ```

7. Look up Kleros contract (either CentralizedKleros or KlerosLiquid) on Sepolia and copy its address and abi to `packages/nextjs/contracts/externalContracts.ts` for frontend integration.

8. Start the frontend and indexer:
   ```bash
   yarn start
   yarn ponder:dev    # for local development indexer
   # or
   yarn ponder:start  # to run the production indexer (deployed environment)
   ```

Notes:
- The verification command above is an example; adjust verification args per your Hardhat verify script.
- You must update the deploy scripts with the ArbiterProxy address before deploying HiredTalents/Gigs so they link to the correct arbitrator.

---

## Using Ponder (indexer)

- Ponder config is generated from deployed contracts and network info (`packages/ponder/ponder.config.ts`).
- Schema location: `packages/ponder/ponder.schema.ts`
- Indexers (event handlers): `packages/ponder/src/`
- Start dev indexer:
  ```bash
  yarn ponder:dev
  ```
- Start production indexer:
  ```bash
  yarn ponder:start
  ```
- GraphiQL (dev): http://localhost:42069

---

## Important scripts (project root & workspaces)

Common scripts (run from repo root; internal workspace scripts call into packages):
- yarn chain — start local Hardhat node
- yarn deploy — run deployment scripts (works with `--network`)
- yarn start — start Next.js app (development)
- yarn next:build / yarn next:serve — build/serve Next.js
- yarn hardhat:compile / yarn hardhat:test / yarn hardhat:deploy — hardhat tasks
- yarn ponder:dev — run Ponder indexer in development
- yarn ponder:start — run Ponder indexer in production mode
- yarn ponder:codegen — generate types for ponder schema

See `package.json` for the full list of scripts.

---

## Local Hardhat vs Remote Networks

The project supports both local Hardhat development and external networks (e.g., Sepolia). When deploying locally you may need to adjust:
- `packages/nextjs/contracts/deployedContracts.ts` (startBlock / addresses)
- Hardhat network settings in `packages/hardhat/hardhat.config.ts`
- Ponder start block or RPC endpoints in `packages/ponder/ponder.config.ts`

If you opt to run a purely local setup, ensure the ArbiterProxy and other addresses are set consistently across frontend, deploy scripts, and Ponder config.

---

## Architecture & Components

- Smart contracts (Hardhat): `packages/hardhat/contracts`
- Next.js frontend: `packages/nextjs`
- Ponder indexer: `packages/ponder`
- Common types & utilities: `packages/common` (shared contract types and enums)
- Scaffold-ETH utilities and pattern: contract hot reload, typed hooks and scaffold components are used throughout.

---

## License

MIT. This project and many supporting utilities leverage Scaffold-ETH; please retain attributions where appropriate.

---