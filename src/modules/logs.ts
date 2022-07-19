import { createEffect, createEvent, Effect, Event, forward } from 'effector';

import {
  createFileContentsWatcher,
  extractServerLog,
  FileContentsWatcher,
  FileEvent,
  isLatestLogFile,
  SculkWorld,
  ServerLog,
} from '..';

export type LogsModule = {
  readonly logsFileDetected: Event<FileEvent>;
  readonly lineAdded: Event<string>;
  readonly serverLogged: Event<ServerLog>;
  readonly followLogsFileFx: Effect<FileEvent, FileContentsWatcher>;
  readonly reportLoggedLinesFx: Effect<FileContentsWatcher, void>;
  readonly extractServerLogFx: Effect<string, ServerLog>;
  readonly applyLogsLogicFx: Effect<SculkWorld, void>
};

export const useLogsModule = ({ watcher: { fileDetected } }: SculkWorld): LogsModule => {
  const logsFileDetected = fileDetected.filter({ fn: isLatestLogFile })
  const lineAdded = createEvent<string>()
  const serverLogged = createEvent<ServerLog>()

  const followLogsFileFx = createEffect(({ fullPath }: FileEvent) =>
    createFileContentsWatcher(fullPath)
  );
  const extractServerLogFx = createEffect(extractServerLog);

  const reportLoggedLinesFx = createEffect(
    (contentsWatcher: FileContentsWatcher) => {
      contentsWatcher.lineAdded.watch((v) => lineAdded(v));
    }
  );

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const applyLogsLogic = (_world: SculkWorld) => {
    forward({ from: logsFileDetected, to: followLogsFileFx });
    forward({ from: followLogsFileFx.doneData, to: reportLoggedLinesFx });
    forward({ from: lineAdded, to: extractServerLogFx });
    forward({ from: extractServerLogFx.doneData, to: serverLogged });
  }

  const applyLogsLogicFx = createEffect(applyLogsLogic)

  return {
    logsFileDetected,
    lineAdded,
    serverLogged,
    followLogsFileFx,
    extractServerLogFx,
    reportLoggedLinesFx,
    applyLogsLogicFx,
  };
};
