import * as Bunyan from 'bunyan';

export interface Context {
    logger: Bunyan;
    sysconfig: object;
}
