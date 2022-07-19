/* eslint-disable functional/no-loop-statement */
/* eslint-disable functional/no-return-void */
import { Event } from 'effector';

import { logger } from './core';

import sculk, { FileEvent, on$, SculkWorld, SculkWorldOpts } from '.';

const extractApi = ({
  logs: { serverLogged },
  incidents: { incidentLogged },
}: SculkWorld) => {
  return {
    serverLogged,
    incidentLogged,
  };
};

const createLogicAttacher = () =>
  function (world: SculkWorld): void {
    logger.info(`attaching sample logic`, world);

    for (const key of Object.keys(world.watcher)) {
      if (key.startsWith('file')) {
        const event = world.watcher[key] as Event<FileEvent>;

        on$(event, (v) => logger.debug(`[${key}] ${v.path}`));
      }
    }

    const { serverLogged, incidentLogged } = extractApi(world);

    on$(serverLogged, (v) =>
      logger.info(`[${v.level}] ${v.timestamp} -> ${v.content}`)
    );
    on$(incidentLogged, (v) => `[${v.name}] ${JSON.stringify(v.data)}`);
  };

export const startExample = () => {
  const worldOpts: SculkWorldOpts = {
    projectName: 'example-world',
    attachLogic: createLogicAttacher(),
    remote: process.argv[2],
  };
  const world = sculk(worldOpts);

  world.start();
};

export default startExample();
