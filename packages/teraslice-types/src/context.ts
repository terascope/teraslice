import * as Bunyan from 'bunyan';

export interface TerasliceConfig {
    ops_directory: string;
}

export interface SysConfig {
    teraslice: TerasliceConfig;
}

export interface Context {
    logger?: Bunyan;
    sysconfig: SysConfig;
}
