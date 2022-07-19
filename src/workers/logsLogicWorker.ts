import { forward } from 'effector';

import { SculkWorld } from '..';

export const createLogsLogicWorker = ({
  logs: {
    rawLogsEvents: { lineAdded },
    logsEffects: { extractServerLogFx },
    serverLogsEvents: { serverLogged },
  },
}: SculkWorld) => {
  forward({ from: lineAdded, to: extractServerLogFx });
  forward({ from: extractServerLogFx.doneData, to: serverLogged });
};
