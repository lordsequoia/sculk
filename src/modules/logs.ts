import { createEffect, createEvent, Effect, Event } from 'effector';

import {
  createFileContentsWatcher,
  extractServerLog,
  SculkWorld,
  ServerLog,
} from '..';

export type LogsModuleOpts = {
  readonly rootDir: SculkWorld['rootDir'];
};

export type LogsModule = {
  readonly rawLogsEvents: {
    readonly lineAdded: Event<string>;
  };
  readonly serverLogsEvents: {
    readonly serverLogged: Event<ServerLog>;
  };
  readonly logsEffects: {
    readonly extractServerLogFx: Effect<string, ServerLog>;
  };
};

export const createLogsEffects = () => {
  const extractServerLogFx = createEffect(extractServerLog);

  return {
    extractServerLogFx,
  };
};

export const useLogsModule = ({ rootDir }: LogsModuleOpts): LogsModule => {
  const rawLogsEvents = createFileContentsWatcher(rootDir, 'logs/latest.log');
  const serverLogsEvents = {
    serverLogged: createEvent<ServerLog>(),
  };
  const logsEffects = createLogsEffects();

  return {
    rawLogsEvents,
    serverLogsEvents,
    logsEffects,
  };
};
