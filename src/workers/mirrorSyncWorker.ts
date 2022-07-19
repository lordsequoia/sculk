import { createWorker } from '../helpers';
import {
  MirrorUpdatesSynchronized,
  synchronizeMirror,
  SynchronizeMirrorUpdates,
} from '../helpers/mirrors';

export const createMirrorSynchronizer = (options: SynchronizeMirrorUpdates) => {
  const fn = async () => {
    const result = await synchronizeMirror(options);

    return result;
  };
  return fn;
};

export const createMirrorSyncWorker = (
  source: string,
  destination: string,
  delayInSeconds?: number
) =>
  createWorker<SynchronizeMirrorUpdates, MirrorUpdatesSynchronized>(
    createMirrorSynchronizer({ source, destination }),
    delayInSeconds || 15
  );
