import { SculkWorld, SculkWorldOpts } from './core';

export * from './helpers';
export * from './modules';
export * from './workers';
export * from './core';

export const sculk = (options: SculkWorldOpts) => new SculkWorld(options);

export default sculk;
