# OPCraft

An infinite, unstoppable World.

The main branch client is automatically deployed to [opcraft.mud.dev](https://opcraft.mud.dev).

### Running locally

1. Run `pnpm` to install dependencies
2. Run `pnpm start` in `packages/client`
3. In a new terminal, run `pnpm anvil:node` in `packages/contracts`
4. In a new terminal, run `pnpm deploy:anvil` in `packages/contracts`

### Running locally with HMR

Parcel + HMR doesn't fully work and React changes will cause a full page reload unless we take a few extra steps to link packages locally and use Vite for bundling.

1. Clone [mud](https://github.com/latticexyz/mud) repo locally (next to your opcraft dir)
2. Run `pnpm && pnpm link:packages` from within mud repo to install its deps and link packages
3. Run `pnpm && link:mud` from within opcraft repo to install its deps and link mud packages
4. Run `pnpm dev` in `packages/client` (note `pnpm dev` not `pnpm start` like above)
5. In a new terminal, run `pnpm anvil:node` in `packages/contracts`
6. In a new terminal, run `pnpm deploy:anvil` in `packages/contracts`
