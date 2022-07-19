/* eslint-disable functional/no-mixed-type */
/* eslint-disable functional/no-this-expression */
/* eslint-disable functional/no-class */
import { join, resolve } from 'node:path';
import { homedir } from 'os';

import { existsSync, mkdirSync } from 'fs-extra';

import { Worker } from '../helpers';
import { createFileWatcher, FileWatcher } from '../helpers/files';
import {
  MirrorUpdatesSynchronized,
  SynchronizeMirrorUpdates,
} from '../helpers/mirrors';
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

  constructor({ cwd, projectName, remote, attachLogic }: SculkWorldOpts) {
    this.rootDir =
      cwd || resolve(join(homedir(), '.sculk', projectName || 'default'));

    if (!existsSync(this.rootDir)) {
      mkdirSync(this.rootDir);
    }

    this.watcher = createFileWatcher(this.rootDir, '.');
    this.mirror = createMirrorSyncWorker(remote, this.rootDir);
    this.players = usePlayersModule(this.watcher);
    this.logic = attachLogic(this);
  }

  start() {
    logger.info(`starting sculk for world: ${this.rootDir}`);
    const playersWorker = createPlayersLogicWorker(this.players);
    return { playersWorker };
  }
}
