/* eslint-disable functional/prefer-readonly-type */

import {
  createApi,
  createStore,
  Effect,
  Event,
  forward,
  Store,
} from 'effector';
import { createEffect } from 'effector';
import { Except } from 'type-fest';

import {
  FileEvent,
  playerAddedReducer,
  playerDataLoadedReducer,
  playerRemovedReducer,
  playerStatsLoadedReducer,
  playerUpdatedReducer,
  playerUserLoadedReducer,
  readPlayerDataFile,
  readPlayerStatsFile,
  SculkWorld,
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

export type PlayersModule = {
  readonly $players: Store<Player[]>;
  readonly playerAdded: Event<Player>;
  readonly playerUpdated: Event<
    PlayerDataLoadedDone | PlayerStatsLoadedDone | PlayerUserLoadedDone
  >;
  readonly playerRemoved: Event<FileEvent>;
  readonly playerUserLoaded: Event<PlayerUserLoadedDone>;
  readonly playerDataLoaded: Event<PlayerDataLoadedDone>;
  readonly playerStatsLoaded: Event<PlayerStatsLoadedDone>;
  readonly readPlayerDataFx: Effect<
    FileEvent,
    Except<Player, 'stats' | 'user'>
  >;
  readonly readPlayerStatsFx: Effect<
    FileEvent,
    Except<Player, 'data' | 'user'>
  >;

  readonly playerDataFileDetected: Event<FileEvent>;
  readonly playerDataFileCreated: Event<FileEvent>;
  readonly playerDataFileChanged: Event<FileEvent>;
  readonly playerDataFileDeleted: Event<FileEvent>;

  readonly playerStatsFileDetected: Event<FileEvent>;
  readonly playerStatsFileCreated: Event<FileEvent>;
  readonly playerStatsFileChanged: Event<FileEvent>;
  readonly playerStatsFileDeleted: Event<FileEvent>;

  readonly applyPlayersLogicFx: Effect<SculkWorld, void>;
};

export const usePlayersModule = (world: SculkWorld): PlayersModule => {
  const $players = createStore<Player[]>([] as Player[]);

  const readPlayerDataFx = createEffect(readPlayerDataFile);
  const readPlayerStatsFx = createEffect(readPlayerStatsFile);

  const {
    playerAdded,
    playerUpdated,
    playerRemoved,
    playerUserLoaded,
    playerDataLoaded,
    playerStatsLoaded,
  } = createApi($players, {
    playerAdded: playerAddedReducer,
    playerUpdated: playerUpdatedReducer,
    playerRemoved: playerRemovedReducer,
    playerDataLoaded: playerDataLoadedReducer,
    playerStatsLoaded: playerStatsLoadedReducer,
    playerUserLoaded: playerUserLoadedReducer,
  });

  const {
    fileDetected: playerDataFileDetected,
    fileChanged: playerDataFileChanged,
    fileDeleted: playerDataFileDeleted,
    fileCreated: playerDataFileCreated,
  } = world.watcher.makeApi('*/playerdata/*.dat');

  const {
    fileDetected: playerStatsFileDetected,
    fileChanged: playerStatsFileChanged,
    fileDeleted: playerStatsFileDeleted,
    fileCreated: playerStatsFileCreated,
  } = world.watcher.makeApi('*/stats/*.json');

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const applyPlayersLogic = (_world: SculkWorld) => {
    forward({ from: playerUserLoaded, to: playerUpdated });

    // forward player data updates
    forward({ from: playerDataFileDeleted, to: playerRemoved });
    forward({
      from: [
        playerDataFileDetected,
        playerDataFileCreated,
        playerDataFileChanged,
      ],
      to: readPlayerDataFx,
    });
    forward({ from: readPlayerDataFx.done, to: playerDataLoaded });
    forward({ from: playerDataLoaded, to: playerUpdated });

    // forward player stats updates
    forward({ from: playerStatsFileDeleted, to: playerRemoved });
    forward({
      from: [
        playerStatsFileDetected,
        playerStatsFileChanged,
        playerStatsFileCreated,
      ],
      to: readPlayerStatsFx,
    });
    forward({ from: readPlayerStatsFx.done, to: playerStatsLoaded });
    forward({ from: playerStatsLoaded, to: playerUpdated });
  };

  const applyPlayersLogicFx = createEffect(applyPlayersLogic);

  return {
    $players,
    playerAdded,
    playerUpdated,
    playerRemoved,
    playerUserLoaded,
    playerDataLoaded,
    playerStatsLoaded,
    readPlayerDataFx,
    readPlayerStatsFx,
    playerDataFileDetected,
    playerDataFileCreated,
    playerDataFileChanged,
    playerDataFileDeleted,
    playerStatsFileDetected,
    playerStatsFileChanged,
    playerStatsFileDeleted,
    playerStatsFileCreated,
    applyPlayersLogicFx,
  };
};
