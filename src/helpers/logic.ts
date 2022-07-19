/* eslint-disable functional/no-return-void */
import { Event } from 'effector';

export const on$ = <T>(event: Event<T>, handler: (params: T) => void) => {
  event.watch((v) => handler(v));
};
