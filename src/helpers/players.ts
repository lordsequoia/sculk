/* eslint-disable functional/immutable-data */

import {
  FileEvent,
  Player,
  PlayerDataLoadedDone,
  PlayerStatsLoadedDone,
  PlayerUserLoadedDone,
  stripUuid,
} from '..';

export const playerAddedReducer = (state, payload) => [...state, payload];

export const playerRemovedReducer = (state, { path }: FileEvent) =>
  state.filter((v) => v.id !== stripUuid(path));

export const playerUpdatedReducer = (
  state,
  payload: PlayerDataLoadedDone | PlayerStatsLoadedDone
) =>
  state.map((v) =>
    stripUuid(payload.params.path) !== v.id
      ? v
      : (Object.assign(v, payload.result) as Player)
  );

export const playerDataLoadedReducer = (
  state,
  { params: { path }, result: { data } }: PlayerDataLoadedDone
) =>
  state.find((v) => v.id === stripUuid(path)) === undefined
    ? [...state, { id: stripUuid(path), data }]
    : state.map((v) =>
        v.id !== stripUuid(path) ? v : Object.assign(v, { data })
      );

export const playerStatsLoadedReducer = (
  state,
  { params: { path }, result: { stats } }: PlayerStatsLoadedDone
) =>
  state.find((v) => v.id === stripUuid(path)) === undefined
    ? [...state, { id: stripUuid(path), stats }]
    : state.map((v) =>
        v.id !== stripUuid(path) ? v : Object.assign(v, { stats })
      );

export const playerUserLoadedReducer = (
  state,
  { params: { path }, result: { user } }: PlayerUserLoadedDone
) =>
  state.find((v) => v.id === stripUuid(path)) === undefined
    ? [...state, { id: stripUuid(path), user }]
    : state.map((v) =>
        v.id !== stripUuid(path) ? v : Object.assign(v, { user })
      );
