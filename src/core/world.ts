/* eslint-disable functional/no-mixed-type */
/* eslint-disable functional/no-this-expression */
/* eslint-disable functional/no-class */
import { join, resolve } from 'node:path';
import { homedir } from 'os';

import { existsSync, mkdirSync } from 'fs-extra';

import { createIncidentsLogicWorker, createLogsLogicWorker } from '..';
import { Worker } from '../helpers';
import { createFileWatcher, FileWatcher } from '../helpers/files';
import {
  MirrorUpdatesSynchronized,
  SynchronizeMirrorUpdates,
} from '../helpers/mirrors';
import { LogsModule } from '../modules';
import { IncidentsModule, useIncidentsModule } from '../modules/incidents';
import { useLogsModule } from '../modules/logs';
import { PlayersModule, usePlayersModule } from '../modules/players';
import { createMirrorSyncWorker } from '../workers/mirrorSyncWorker';
import { createPlayersLogicWorker } from '../workers/playersLogicWorker';

import logger from './logger';

export type SculkWorldOpts = {
  readonly cwd?: string;
  readonly projectName?: string;
  readonly remote: string;
  readonly attachLogic: (world: SculkWorld) => unknown;
};

export class SculkWorld {
  public readonly rootDir: string;
  public readonly watcher: FileWatcher;
  public readonly logic: unknown;
  public readonly mirror: Worker<
    SynchronizeMirrorUpdates,
    MirrorUpdatesSynchronized
  >;

  public readonly players: PlayersModule;
  public readonly logs: LogsModule;
  public readonly incidents: IncidentsModule;

  constructor({ cwd, projectName, remote, attachLogic }: SculkWorldOpts) {
    this.rootDir =
      cwd || resolve(join(homedir(), '.sculk', projectName || 'default'));

    if (!existsSync(this.rootDir)) {
      mkdirSync(this.rootDir, { recursive: true });
    }

    this.watcher = createFileWatcher(this.rootDir, '.');
    this.mirror = createMirrorSyncWorker(remote, this.rootDir);

    this.players = usePlayersModule(this);
    this.logs = useLogsModule(this);
    this.incidents = useIncidentsModule();

    this.logic = attachLogic(this);
  }

  start() {
    logger.info(`starting sculk for world: ${this.rootDir}`);
    const playersWorker = createPlayersLogicWorker(this);
    const logsWorker = createLogsLogicWorker(this);
    const incidentsWorker = createIncidentsLogicWorker(this);
    return { playersWorker, logsWorker, incidentsWorker };
  }
}
