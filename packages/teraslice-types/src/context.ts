import * as bunyan from 'bunyan';
import * as debugnyan from 'debugnyan';
import { EventEmitter } from 'events';

export interface TerasliceConfig {
    ops_directory?: string;
    assets_directory?: string;
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
    makeLogger(...params: any[]): bunyan;
    getSystemEvents(): EventEmitter;
    getConnection(config: ConnectionConfig): { client: any };
}

export interface ContextApis {
    foundation: FoundationApis;
    registerAPI(namespace: string, apis: any): void;
    [namespace: string]: any;
}

export interface Context {
    logger: bunyan;
    sysconfig: SysConfig;
    apis: ContextApis;
}

class TestContextApis implements ContextApis {
    foundation: FoundationApis;

    constructor(testName: string) {
        const events = new EventEmitter();
        this.foundation = {
            makeLogger(...params: any[]): bunyan {
                let suffix: string = '';
                if (typeof params[0] === 'string') {
                    suffix = params[0];
                } else {
                    suffix = params[0].module;
                }
                return debugnyan(`teraslice:${testName}`, {}, { suffix, simple: false });
            },
            getConnection(config: ConnectionConfig): { client: any } {
                return { client: config };
            },
            getSystemEvents(): EventEmitter {
                return events;
            },
        };
    }

    registerAPI(namespace: string, apis: any): void {
        this[namespace] = apis;
    }
}

export class TestContext implements Context {
    logger: bunyan;
    sysconfig: SysConfig;
    apis: ContextApis;

    constructor(testName: string) {
        this.logger = debugnyan(`teraslice:${testName}`);

        this.sysconfig = {
            terafoundation: {
                connectors: {},
            },
            teraslice: {
                ops_directory: '',
            },
        };

        this.apis = new TestContextApis(testName);
    }
}
