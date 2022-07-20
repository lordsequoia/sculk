/* eslint-disable functional/no-return-void */
import { createApi, createEffect, createEvent, createStore, Event, forward, guard, Store } from 'effector';
import diff from 'microdiff'
import { logger } from '../core';

export const on$ = <T>(event: Event<T>, handler: (params: T) => void) => {
  event.watch((v) => handler(v));
};

export type Replicatable<T> = Record<keyof T, any> | any[]

export type Mutation<T = Record<string | number, any>> = {
  path: (string | number)[]// (keyof T)[];
  type: "CREATE" | "REMOVE" | "CHANGE";
  value?: T;
  oldValue?: T;
}

export type Replica<T> = {
  $state: Store<Replicatable<T>>
  updateState: Event<Replicatable<T>>
  patchState: Event<Mutation<T>>
}

export const applyPatch = <T>(original: Replicatable<T>, { path, type, value }: Mutation<T>) => {
  if (path.length === 0) {
    const patch = {} as Record<keyof T, T[keyof T]>

    patch[path[0]] = value

    return Object.assign(original, patch)
  }

  const patch = {} as Record<keyof T, T[keyof T]>

  patch[path[0]] = applyPatch(original[path[0]], {
    type,
    value,
    path: path.slice(1)
  })

  return Object.assign(original, patch)
}

export const replica$ = <T>(initialState: Replicatable<T>): Replica<T> => {
  const updateState = createEvent<Replicatable<T>>()
  const patchState = createEvent<Mutation<T>>()

  const $state = createStore(initialState || {} as Replicatable<T>)
    .on(patchState, (state, patch) => applyPatch(state, patch))

  const extractPatchesFx = createEffect<{ oldState: Replicatable<T>, newState: Replicatable<T> }, Mutation[]>(({ newState, oldState }) => {
    const patches = diff(newState, oldState)

    for (const patch of patches) {
      patchState(patch)
    }
  })

  const stateChangedFx = createEffect<Replicatable<T>, { oldState: Replicatable<T>, newState: Replicatable<T> }>(
    (newState: Replicatable<T>) => {
      return {
        oldState: $state.getState(),
        newState
      }
    }
  )

  guard({
    source: updateState,
    filter: (source) => source !== $state.getState(),
    target: stateChangedFx,
  })

  forward({ from: stateChangedFx, to: extractPatchesFx })

  patchState.watch(v => logger.info(`[PATCH/${v.type}] ${v.path.join(':')} = ${v.value} (old: ${v.oldValue})`))

  return { $state, updateState, patchState }
}