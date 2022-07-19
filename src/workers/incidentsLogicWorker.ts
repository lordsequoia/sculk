import { forward } from 'effector';

import { SculkWorld } from '..';

export const createIncidentsLogicWorker = ({
  logs: {
    serverLogsEvents: { serverLogged },
  },
  incidents: {
    incidentsEvents: { incidentLogged },
    incidentsEffects: { extractIncidentFx },
  },
}: SculkWorld) => {
  forward({ from: serverLogged, to: extractIncidentFx });
  forward({
    from: extractIncidentFx.doneData,
    to: incidentLogged,
  });
};
