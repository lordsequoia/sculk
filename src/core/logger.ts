import { createLogger, format } from 'winston';
import { Console, File } from 'winston/lib/winston/transports';

export const logger = createLogger({
  transports: [
    new Console({
      level: 'info',
      format: format.combine(format.timestamp(), format.cli()),
    }),
    new File({
      dirname: 'logs',
      filename: 'debug.log',
      format: format.combine(format.timestamp(), format.json()),
    }),
    new File({
      dirname: 'logs',
      filename: 'info.log',
      format: format.combine(format.timestamp(), format.simple()),
    }),
  ],
});

export default logger;
