import { createEffect, createEvent, Effect, Event, forward } from 'effector';

import { extractServerEvent, SculkWorld, ServerEvent, ServerLog } from '..';

export type IncidentsModule = {
  readonly incidentLogged: Event<ServerEvent>;
  readonly extractIncidentFx: Effect<ServerLog, ServerEvent | undefined>;
  readonly applyIncidentsLogicFx: Effect<SculkWorld, void>
};

export const useIncidentsModule = (): IncidentsModule => {
  const incidentLogged = createEvent<ServerEvent>()
  const extractIncidentFx = createEffect(extractServerEvent);

  const applyIncidentsLogic = ({
    logs: { serverLogged }
  }: SculkWorld) => {
    forward({ from: serverLogged, to: extractIncidentFx });
    forward({ from: extractIncidentFx.doneData, to: incidentLogged });
  }

  const applyIncidentsLogicFx = createEffect(applyIncidentsLogic)

  return {
    incidentLogged,
    extractIncidentFx,
    applyIncidentsLogicFx,
  };
};
