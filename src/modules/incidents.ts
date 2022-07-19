import { createEffect, createEvent, Effect, Event } from 'effector';

import { extractServerEvent, SculkWorld, ServerEvent, ServerLog } from '..';

export type IncidentsModuleOpts = {
  readonly logs: SculkWorld['logs'];
};

export type IncidentsModule = {
  readonly incidentsEvents: {
    readonly incidentLogged: Event<ServerEvent>;
  };
  readonly incidentsEffects: {
    readonly extractIncidentFx: Effect<ServerLog, ServerEvent | undefined>;
  };
};

export const createIncidentsEffects = () => {
  const extractIncidentFx = createEffect(extractServerEvent);

  return {
    extractIncidentFx,
  };
};

export const useIncidentsModule = (): IncidentsModule => {
  const incidentsEvents = {
    incidentLogged: createEvent<ServerEvent>(),
  };
  const incidentsEffects = createIncidentsEffects();

  return {
    incidentsEvents,
    incidentsEffects,
  };
};
