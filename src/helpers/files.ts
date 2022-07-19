/* eslint-disable functional/no-mixed-type */
/* eslint-disable functional/no-return-void */
/* eslint-disable functional/immutable-data */
/* eslint-disable functional/prefer-readonly-type */
import { join } from 'node:path';
import { parse } from 'node:path';

import * as chokidar from 'chokidar';
import { createApi, createStore, Event, fromObservable } from 'effector';
import * as fs from 'fs-extra';
import { Stats } from 'fs-extra';
import { isMatch } from 'micromatch';
import { splitMap } from 'patronum';
import * as nbt from 'prismarine-nbt';
import { fromEvent, map, Observable, Subject } from 'rxjs';
import { Tail } from 'tail';
import { Except } from 'type-fest';

import { logger, Player, PlayerData, PlayerStats } from '..';

export type FileEvent = {
  path: FileWatcherEvent['filePath'];
  fullPath: FileWatcherEvent['fullPath'];
};
export type FileWatcherApi = {
  fileDetected: Event<FileEvent>;
  fileCreated: Event<FileEvent>;
  fileDeleted: Event<FileEvent>;
  fileChanged: Event<FileEvent>;
};
export type FileWatcher = FileWatcherApi & {
  makeApi: (pattern?: string | string[]) => FileWatcherApi;
  stopWatching: () => void;
};

export type FileWatcherEvent = {
  name: 'fileDetected' | 'fileCreated' | 'fileDeleted' | 'fileChanged';
  source: ChokidarEvent;
  filePath: string;
  fullPath: string;
  fileStats: Stats;
};

export type ChokidarEvent = {
  eventName: 'add' | 'addDir' | 'change' | 'unlink' | 'unlinkDir';
  path: string;
  fullPath: string;
  stats?: Stats;
  wasReady: boolean;
};

export const readNbtFile = async (fullPath: string) => {
  const contents = await fs.readFile(fullPath);
  const { parsed } = await nbt.parse(contents);

  return nbt.simplify(parsed);
};

export const readPlayerDataFile = async ({ fullPath }: FileEvent) => {
  const nbtData = await readNbtFile(fullPath);

  return {
    id: parse(fullPath).name,
    data: nbtData as unknown as PlayerData,
  } as Except<Player, 'stats' | 'user'>;
};

export const readPlayerStatsFile = async ({ fullPath }: FileEvent) => {
  const statsData = await fs.readJson(fullPath);
  return {
    id: stripUuid(fullPath),
    stats: (statsData as unknown as { stats: PlayerStats; DataVersion: number })
      .stats,
  } as Except<Player, 'data' | 'user'>;
};

export const createFileWatcher = (
  rootDir: string,
  path: string | string[]
): FileWatcher => {
  const watcherOpts = {
    cwd: rootDir,
    alwaysStat: true,
  };

  const watcher = chokidar.watch(path, watcherOpts);

  const $ready = createStore<boolean>(false);

  const { setReady } = createApi($ready, {
    setReady: () => true,
  });

  watcher.once('ready', setReady);

  const trigger = fromEvent(watcher, 'all').pipe(
    map(
      ([eventName, path, stats]) =>
        ({
          eventName,
          path,
          stats,
          wasReady: $ready.getState() === true,
        } as ChokidarEvent)
    ),
    map((v) => Object.assign(v, { fullPath: join(rootDir, v.path) }))
  );
  const source = fromObservable<ChokidarEvent>(trigger);

  const makeApi = (pattern?: string | string[]) => {
    const fn = ({ path }: ChokidarEvent) =>
      typeof pattern === 'undefined' ? true : isMatch(path, pattern);

    const api = splitMap({
      source: source.filter({ fn }),
      cases: {
        fileDetected: ({ eventName, path, fullPath, wasReady }) =>
          eventName === 'add' && wasReady === false
            ? { path, fullPath }
            : undefined,
        fileCreated: ({ eventName, path, fullPath, wasReady }) =>
          eventName === 'add' && wasReady === true
            ? { path, fullPath }
            : undefined,
        fileChanged: ({ eventName, path, fullPath }) =>
          eventName === 'change' ? { path, fullPath } : undefined,
        fileDeleted: ({ eventName, path, fullPath }) =>
          eventName === 'unlink' ? { path, fullPath } : undefined,
      },
    });

    return api;
  };

  const { fileDetected, fileCreated, fileDeleted, fileChanged } = makeApi();

  const stopWatching = () => {
    watcher.close();
  };

  return {
    fileDetected,
    fileCreated,
    fileChanged,
    fileDeleted,
    makeApi,
    stopWatching,
  };
};

export type FileContentsWatcher = {
  fullPath: string;
  linesSource: Observable<string>;
  lineAdded: Event<string>;
  stopWatching: () => void;
};

export const createFileContentsWatcher = (
  fullPath: string
): FileContentsWatcher => {
  logger.info(`[TAIL] ${fullPath}`);

  const linesSource = new Subject<string>();
  const lineAdded = fromObservable<string>(linesSource);

  lineAdded.watch((v) => logger.info(`[TAIL] --> ${v}`));

  const tailer = new Tail(fullPath);
  tailer.on('line', (line) => linesSource.next(line));
  tailer.on('error', (error) => linesSource.error(error));

  const stopWatching = () => {
    tailer.unwatch();
    linesSource.complete();
  };

  return {
    fullPath,
    linesSource,
    lineAdded,
    stopWatching,
  };
};

export const stripUuid = (filePath: string) => parse(filePath).name;
