import { forward } from 'effector';

import {
  FileWatcherApi,
  PlayersStore,
  PlayersStoreEvents,
  SculkWorld,
} from '..';

export type PlayersLogicWorkerOpts = {
  readonly players: PlayersStore;
  readonly playerStoreEvents: PlayersStoreEvents;
  readonly playerDataFileEvents: FileWatcherApi;
  readonly playerStatsFileEvents: FileWatcherApi;
};
export const createPlayersLogicWorker = ({
  players: {
    playerStoreEvents: {
      playerRemoved,
      playerUpdated,
      playerDataLoaded,
      playerStatsLoaded,
      playerUserLoaded,
    },
    playerDataFileEvents: {
      fileDetected: playerDataFileDetected,
      fileChanged: playerDataFileChanged,
      fileDeleted: playerDataFileDeleted,
      fileCreated: playerDataFileCreated,
    },
    playerStatsFileEvents: {
      fileDetected: playerStatsFileDetected,
      fileChanged: playerStatsFileChanged,
      fileDeleted: playerStatsFileDeleted,
      fileCreated: playerStatsFileCreated,
    },
    playersEffects: { readPlayerDataFx, readPlayerStatsFx },
  },
}: SculkWorld) => {
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
