// @ts-ignore
import bunyan from '@types/bunyan';
import { EventEmitter } from 'events';

export interface Logger extends bunyan {
    flush(): Promise<void>;
}

export interface TerasliceConfig {
    assets_directory?: string;
    cluster_manager_type?: string;
}

export interface TerafoundationConfig {
    connectors: object;
}

export interface SysConfig {
    terafoundation: TerafoundationConfig;
    teraslice: TerasliceConfig;
}

export interface ConnectionConfig {
    endpoint: string;
    cached?: boolean;
    type: string;
}

export interface FoundationApis {
    makeLogger(...params: any[]): Logger;
    getSystemEvents(): EventEmitter;
    getConnection(config: ConnectionConfig): { client: any };
}

export interface LegacyFoundationApis {
    makeLogger(...params: any[]): Logger;
    getEventEmitter(): EventEmitter;
    getConnection(config: ConnectionConfig): { client: any };
}

export interface ContextApis {
    foundation: FoundationApis;
    registerAPI(namespace: string, apis: any): void;
    [namespace: string]: any;
}

export interface Context {
    logger: Logger;
    sysconfig: SysConfig;
    apis: ContextApis;
    foundation: LegacyFoundationApis;
    assignment: string;
    arch: string;
    platform: string;
    name: string;
}

export enum Assignment {
    Worker = 'worker',
    ExecutionController = 'execution_controller',
    NodeMaster = 'node_master',
    ClusterMaster = 'cluster_master',
    AssetsService = 'assets_service'
}
