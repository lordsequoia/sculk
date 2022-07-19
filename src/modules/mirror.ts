import { createEffect, Effect, Event, forward, fromObservable } from 'effector';
import { interval } from 'rxjs';

import { SculkWorld } from '..';
import {
  MirrorUpdatesSynchronized,
  synchronizeMirror,
} from '../helpers/mirrors';

export type MirrorModule = {
  readonly syncFx: Effect<void, MirrorUpdatesSynchronized>;
  readonly syncClock: Event<number>;
  readonly applyMirrorLogicFx: Effect<SculkWorld, void>;
};

export const useMirrorModule = (
  source: string,
  destination: string,
  delayInSeconds?: number
): MirrorModule => {
  const sync = async () => {
    const result = await synchronizeMirror({ source, destination });

    return result;
  };

  const syncFx = createEffect(sync);

  const syncClock = fromObservable<number>(
    interval((delayInSeconds || 15) * 1000)
  );

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const applyMirrorLogic = (_world: SculkWorld) => {
    forward({ from: syncClock, to: syncFx });
  };

  const applyMirrorLogicFx = createEffect(applyMirrorLogic);

  return { syncFx, syncClock, applyMirrorLogicFx };
};
