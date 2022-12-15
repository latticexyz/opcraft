# OPCraft

An infinite, unstoppable World.

The main branch client is automatically deployed to [craft.mud.dev](https://craft.mud.dev).

Visit the frozen world of the first public playtest of OPCraft at [opcraft.mud.dev](https://opcraft.mud.dev).

Read more about the [creation of OPCraft](https://lattice.xyz/blog/making-of-opcraft-part-1-building-an-on-chain-voxel-game) and [the crazy things that happened during our first public playtest](https://lattice.xyz/blog/making-of-opcraft-part-3-what-happened-in-two-weeks-of-OPCraft) on the [Lattice blog](https://lattice.xyz/blog).

Built using [MUD](https://github.com/latticexyz/mud) and [Noa](https://github.com/fenomas/noa).

### Running locally

1. Run `yarn` to install dependencies
2. Run `yarn start` in `packages/client`
3. In a new terminal, run `yarn anvil:node` in `packages/contracts`
4. In a new terminal, run `yarn deploy:anvil` in `packages/contracts`

### Running locally with HMR

Parcel + HMR doesn't fully work and React changes will cause a full page reload unless we take a few extra steps to link packages locally and use Vite for bundling.

1. Clone [mud](https://github.com/latticexyz/mud) repo locally (next to your opcraft dir)
2. Run `yarn && yarn link:packages` from within mud repo to install its deps and link packages
3. Run `yarn && link:mud` from within opcraft repo to install its deps and link mud packages
4. Run `yarn dev` in `packages/client` (note `yarn dev` not `yarn start` like above)
5. In a new terminal, run `yarn anvil:node` in `packages/contracts`
6. In a new terminal, run `yarn deploy:anvil` in `packages/contracts`
