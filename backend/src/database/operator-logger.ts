import { Logger } from 'typeorm';

// Operator CLIs return reviewed status codes. TypeORM's migration logger can
// otherwise print raw driver messages, queries or parameters before our catch.
export const operatorLogger: Logger = {
  logQuery() {},
  logQueryError() {},
  logQuerySlow() {},
  logSchemaBuild() {},
  logMigration() {},
  log() {},
};
