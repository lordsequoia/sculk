/* eslint-disable functional/no-mixed-type */
/* eslint-disable functional/no-this-expression */
/* eslint-disable functional/no-class */
import { join, resolve } from 'node:path';
import { homedir } from 'os';

import { existsSync, mkdirSync } from 'fs-extra';

import { createFileWatcher, FileWatcher } from '../helpers/files';
import { LogsModule, MirrorModule, useMirrorModule } from '../modules';
import { IncidentsModule, useIncidentsModule } from '../modules/incidents';
import { useLogsModule } from '../modules/logs';
import { PlayersModule, usePlayersModule } from '../modules/players';

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
  public readonly mirror: MirrorModule;
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
    this.mirror = useMirrorModule(remote, this.rootDir);
    this.players = usePlayersModule(this);
    this.logs = useLogsModule(this);
    this.incidents = useIncidentsModule();

    logger.info(`[SCULK] cwd=${this.rootDir} remote=${remote}`);

    this.logic = attachLogic(this);
  }

  start() {
    logger.info(`starting sculk for world: ${this.rootDir}`);

    this.mirror.applyMirrorLogicFx(this);
    this.players.applyPlayersLogicFx(this);
    this.logs.applyLogsLogicFx(this);
    this.incidents.applyIncidentsLogicFx(this);
  }
}
