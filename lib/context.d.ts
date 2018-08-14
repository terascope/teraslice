/// <reference types="node" />
import * as bunyan from 'bunyan';
import { EventEmitter } from 'events';
export interface TerasliceConfig {
    ops_directory: string;
}
export interface SysConfig {
    teraslice: TerasliceConfig;
}
export interface ConnectionConfig {
    endpoint: string;
    cached?: boolean;
    type: string;
}
export interface FoundationApis {
    getSystemEvents(): EventEmitter;
    getConnection(config: ConnectionConfig): {
        client: any;
    };
}
export interface ContextApis {
    foundation: FoundationApis;
    registerAPI(namespace: string, apis: any): void;
}
export interface Context {
    logger: bunyan;
    sysconfig: SysConfig;
    apis: ContextApis;
}
