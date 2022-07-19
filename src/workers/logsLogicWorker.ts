import { forward } from 'effector';

import { SculkWorld } from '..';

export const createLogsLogicWorker = ({
  logs: {
    logsEvents: { logsFileDetected },
    rawLogsEvents: { lineAdded },
    logsEffects: { followLogsFileFx, extractServerLogFx, reportLoggedLinesFx },
    serverLogsEvents: { serverLogged },
  },
}: SculkWorld) => {
  forward({ from: logsFileDetected, to: followLogsFileFx });
  forward({ from: followLogsFileFx.doneData, to: reportLoggedLinesFx });
  forward({ from: lineAdded, to: extractServerLogFx });
  forward({ from: extractServerLogFx.doneData, to: serverLogged });
};
