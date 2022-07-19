import { FileEvent } from "./files";

export const SERVER_LOG_REGEX = /\[(.*)\] \[(.*)\/(.*)\]: (.*)/m;

export type ServerLog = {
  readonly rawLog: string;
  readonly timestamp: string;
  readonly thread: string;
  readonly level: string;
  readonly content: string;
};

export const execServerLogRegex = (line: string) => {
  return SERVER_LOG_REGEX.exec(line);
};

export const extractServerLogRegexResult = ([
  rawLog,
  timestamp,
  thread,
  level,
  content,
]: RegExpExecArray): ServerLog => ({
  rawLog,
  timestamp,
  thread,
  level,
  content,
});

export const extractServerLog = (line: string) =>
  extractServerLogRegexResult(execServerLogRegex(line));

export const isLatestLogFile = ({ path }: FileEvent) => path === 'logs/latest.log'