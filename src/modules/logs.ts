import { createEffect, createEvent, Effect, Event } from 'effector';

import {
  createFileContentsWatcher,
  extractServerLog,
  FileContentsWatcher,
  FileEvent,
  SculkWorld,
  ServerLog,
} from '..';

export type LogsModuleOpts = {
  readonly watcher: SculkWorld['watcher'];
};

export type LogsModule = {
  readonly logsEvents: {
    readonly logsFileDetected: Event<FileEvent>;
  };
  readonly rawLogsEvents: {
    readonly lineAdded: Event<string>;
  };
  readonly serverLogsEvents: {
    readonly serverLogged: Event<ServerLog>;
  };
  readonly logsEffects: {
    readonly followLogsFileFx: Effect<FileEvent, FileContentsWatcher>;
    readonly reportLoggedLinesFx: Effect<FileContentsWatcher, void>;
    readonly extractServerLogFx: Effect<string, ServerLog>;
  };
};

export const createLogsEffects = (reportLineEvent: Event<string>) => {
  const followLogsFileFx = createEffect(({ fullPath }: FileEvent) =>
    createFileContentsWatcher(fullPath)
  );
  const extractServerLogFx = createEffect(extractServerLog);

  const reportLoggedLinesFx = createEffect(
    ({ lineAdded }: FileContentsWatcher) => {
      lineAdded.watch((v) => reportLineEvent(v));
    }
  );

  return {
    extractServerLogFx,
    followLogsFileFx,
    reportLoggedLinesFx,
  };
};

export const useLogsModule = ({
  watcher: { fileDetected },
}: LogsModuleOpts): LogsModule => {
  const logsEvents = {
    logsFileDetected: fileDetected.filter({
      fn: ({ path }) => path === 'logs/latest.log',
    }),
  };
  const rawLogsEvents = {
    lineAdded: createEvent<string>(),
  };

  const serverLogsEvents = {
    serverLogged: createEvent<ServerLog>(),
  };

  const logsEffects = createLogsEffects(rawLogsEvents.lineAdded);

  return {
    logsEvents,
    rawLogsEvents,
    serverLogsEvents,
    logsEffects,
  };
};
