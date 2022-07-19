/* eslint-disable functional/immutable-data */
/* eslint-disable functional/prefer-readonly-type */
import { parse } from 'node:path';

import { createApi, createStore, Effect, Event, Store } from 'effector';
import { createEffect } from 'effector';
import { Except } from 'type-fest';

import {
  FileEvent,
  FileWatcher,
  FileWatcherApi,
  readPlayerDataFile,
  readPlayerStatsFile,
  SculkWorld,
  stripUuid,
} from '..';

export type Player = {
  readonly id: string;
  readonly user?: CachedUser;
  readonly data?: PlayerData;
  readonly stats?: PlayerStats;
};

export type CachedUser = {
  readonly id: string;
  readonly name: string;
  readonly expiresOn: string;
};

export type PlayerData = {
  foo: string;
};

export type PlayerStats = Record<string, Record<string, number>>;

export type PlayersStore = Store<Player[]>;

export type PlayerDataLoadedDone = {
  params: FileEvent;
  result: Except<Player, 'stats' | 'user'>;
};
export type PlayerStatsLoadedDone = {
  params: FileEvent;
  result: Except<Player, 'data' | 'user'>;
};

export type PlayerUserLoadedDone = {
  params: FileEvent;
  result: Except<Player, 'data' | 'stats'>;
};

export type PlayersStoreEvents = {
  playerAdded: Event<Player>;
  playerUpdated: Event<
    PlayerDataLoadedDone | PlayerStatsLoadedDone | PlayerUserLoadedDone
  >;
  playerRemoved: Event<FileEvent>;
  playerUserLoaded: Event<PlayerUserLoadedDone>;
  playerDataLoaded: Event<PlayerDataLoadedDone>;
  playerStatsLoaded: Event<PlayerStatsLoadedDone>;
};

export const createPlayersStore = (initialState?: Player[]): PlayersStore =>
  createStore<Player[]>(initialState || ([] as Player[]));

export const createPlayersStoreApi = (
  playersStore: PlayersStore
): PlayersStoreEvents => {
  const {
    playerAdded,
    playerUpdated,
    playerRemoved,
    playerUserLoaded,
    playerDataLoaded,
    playerStatsLoaded,
  } = createApi(playersStore, {
    playerAdded: (state, payload) => [...state, payload],
    playerUpdated: (
      state,
      payload: PlayerDataLoadedDone | PlayerStatsLoadedDone
    ) =>
      state.map((v) =>
        parse(payload.params.path).name !== v.id
          ? v
          : (Object.assign(v, payload.result) as Player)
      ),
    playerRemoved: (state, { path }: FileEvent) =>
      state.filter((v) => v.id !== stripUuid(path)),
    playerDataLoaded: (
      state,
      { params: { path }, result: { data } }: PlayerDataLoadedDone
    ) =>
      state.find((v) => v.id === parse(path).name) === undefined
        ? [...state, { id: parse(path).name, data }]
        : state.map((v) =>
            v.id !== parse(path).name ? v : Object.assign(v, { data })
          ),
    playerStatsLoaded: (
      state,
      { params: { path }, result: { stats } }: PlayerStatsLoadedDone
    ) =>
      state.find((v) => v.id === parse(path).name) === undefined
        ? [...state, { id: parse(path).name, stats }]
        : state.map((v) =>
            v.id !== parse(path).name ? v : Object.assign(v, { stats })
          ),
    playerUserLoaded: (
      state,
      { params: { path }, result: { user } }: PlayerUserLoadedDone
    ) =>
      state.find((v) => v.id === parse(path).name) === undefined
        ? [...state, { id: parse(path).name, user }]
        : state.map((v) =>
            v.id !== parse(path).name ? v : Object.assign(v, { user })
          ),
  });

  return {
    playerAdded,
    playerUpdated,
    playerRemoved,
    playerUserLoaded,
    playerDataLoaded,
    playerStatsLoaded,
  };
};

export const createPlayerDataFileWatcher = ({
  makeApi,
}: {
  makeApi: FileWatcher['makeApi'];
}) => makeApi('*/playerdata/*.dat');

export const createPlayerStatsFileWatcher = ({
  makeApi,
}: {
  makeApi: FileWatcher['makeApi'];
}) => makeApi('*/stats/*.json');

export type PlayersModule = {
  readonly $players: PlayersStore;
  readonly playerStoreEvents: PlayersStoreEvents;
  readonly playerDataFileEvents: FileWatcherApi;
  readonly playerStatsFileEvents: FileWatcherApi;
  readonly playersEffects: PlayersEffects;
};

export type PlayersEffects = {
  readPlayerDataFx: Effect<FileEvent, Except<Player, 'stats' | 'user'>>;
  readPlayerStatsFx: Effect<FileEvent, Except<Player, 'data' | 'user'>>;
};

export const createPlayersEffects = (): PlayersEffects => {
  const readPlayerDataFx = createEffect(readPlayerDataFile);
  const readPlayerStatsFx = createEffect(readPlayerStatsFile);

  return {
    readPlayerDataFx,
    readPlayerStatsFx,
  };
};

export type PlayersModuleOpts = {
  watcher: SculkWorld['watcher'];
};

export const usePlayersModule = ({
  watcher,
}: PlayersModuleOpts): PlayersModule => {
  const $players = createPlayersStore();
  const playerStoreEvents = createPlayersStoreApi($players);
  const playerDataFileEvents = createPlayerDataFileWatcher(watcher);
  const playerStatsFileEvents = createPlayerStatsFileWatcher(watcher);
  const playersEffects = createPlayersEffects();

  return {
    $players,
    playerStoreEvents,
    playerDataFileEvents,
    playerStatsFileEvents,
    playersEffects,
  };
};
