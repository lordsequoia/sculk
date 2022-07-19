import { createEffect, Effect, Event, fromObservable } from 'effector';
import { interval } from 'rxjs';

export type Worker<Params, Done = void> = {
  readonly clock: Event<Params>;
  readonly executeFx: Effect<Params, Done>;
};

export const createWorker = <Params, Done = void>(
  execute: (params: Params) => Promise<Done>,
  trigger?: number | Event<Params>
): Worker<Params, Done> => {
  const clock =
    typeof trigger === 'number' || typeof trigger === 'undefined'
      ? fromObservable<Params>(interval((trigger || 15) * 1000))
      : trigger;

  const executeFx = createEffect(execute);

  clock.watch((v) => executeFx(v));

  return { clock, executeFx };
};
