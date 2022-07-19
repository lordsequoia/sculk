/* eslint-disable functional/prefer-readonly-type */
import Rsync from 'rsync';

export type SynchronizeMirrorUpdates = {
  readonly source: string;
  readonly destination: string;
  readonly include?: string[];
  readonly exclude?: string[];
  readonly flags?: string;
};

export type MirrorUpdatesSynchronized = {
  readonly err: Error;
  readonly code: number;
  readonly cmd: string;
};

export const createDefaultMirrorIncludes = (levelName?: string) => {
  const filter = levelName || `**`;

  return [
    'logs/latest.log',
    'banned-ips.json',
    'banned-players.json',
    'ops.json',
    'server.properties',
    'usercache.json',
    'whitelist.json',
    `${filter}/advancements/`,
    `${filter}/playerdata/`,
    `${filter}/stats/`,
    `${filter}/icon.png`,
    `${filter}/level.dat`,
    `${filter}/level.dat_old`,
    `${filter}/data/`,
  ];
};

export const createDefaultMirrorExcludes = () => {
  return ['**/*.mca', '**/*.jar', '**/*.zip', '**/*.sqlite'];
};

export const synchronizeMirror = async ({
  source,
  destination,
  include,
  exclude,
  flags,
}: SynchronizeMirrorUpdates): Promise<MirrorUpdatesSynchronized> => {
  const rsync = new Rsync()
    .shell('ssh')
    .source(source)
    .destination(destination)
    .flags(flags || 'avz')
    .include(
      include || [
        '**/*.log',
        '**/*.properties',
        '**/*.json',
        '**/*.dat',
        '**/*.dat_old',
      ]
    )
    .exclude(
      exclude || [
        '**/*.mca',
        '**/*.jar',
        '**/*.sqlite',
        '**/template/',
        '**/.fabric/',
        '**/libraries/',
      ]
    );

  const executor = new Promise<MirrorUpdatesSynchronized>((resolve) => {
    rsync.execute((err, code, cmd) => resolve({ err, code, cmd }));
  });

  const result = await executor;

  return result;
};
