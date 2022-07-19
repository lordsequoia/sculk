/* eslint-disable functional/no-loop-statement */
import { ServerLog } from '..';

export const SERVER_EVENT_PATTERNS: { readonly [key: string]: RegExp } =
  Object.freeze({
    serverStarting: /Starting minecraft server version (.*)/m,
    serverStarted: /Time elapsed: (\d*) ms/m,
    serverStopping: /Stopping the server/m,
    serverStopped: /Stopped the server/m,
    preparingSpawn: /Preparing spawn area: (\d*)%/,
    playerJoined: /(.*) joined the game/m,
    playerLeft: /(.*) left the game/m,
    chatMessage: /<(.*)> (.*)/m,
    unknown: /(.*)/m,
  });

export type ServerEventName = keyof typeof SERVER_EVENT_PATTERNS;

export const SERVER_EVENT_PATTERN_NAMES = Object.keys(
  SERVER_EVENT_PATTERNS
) as readonly ServerEventName[];

export type ServerEvent = {
  readonly name: ServerEventName;
  readonly data: readonly string[];
};

export const extractServerEvent = (v: ServerLog): ServerEvent | undefined => {
  for (const name of SERVER_EVENT_PATTERN_NAMES) {
    const pattern = SERVER_EVENT_PATTERNS[name];
    const data = pattern.exec(v.content);

    if (typeof data !== 'undefined' && data !== null) {
      return { name, data };
    }
  }

  return undefined;
};
