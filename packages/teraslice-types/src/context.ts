import * as bunyan from 'bunyan';
import debugnyan from 'debugnyan';
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

export interface LegacyFoundationApis {
    makeLogger(...params: any[]): bunyan;
    getEventEmitter(): EventEmitter;
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
    foundation: LegacyFoundationApis
}

function testContextApis(testName: string): ContextApis {
    const events = new EventEmitter();
    return {
        foundation: {
            makeLogger(...params: any[]): bunyan {
                if (typeof params[0] === 'string') {
                    return debugnyan(`teraslice:${testName}`, {}, {
                        simple: false,
                        suffix: params[0] as string,
                    });
                } else {
                    return debugnyan(`teraslice:${testName}`, params[0] as object, {
                        simple: false,
                        suffix: params[0].module,
                    });
                }

            },
            getConnection(config: ConnectionConfig): { client: any } {
                return { client: config };
            },
            getSystemEvents(): EventEmitter {
                return events;
            },
        },
        registerAPI(namespace: string, apis: any): void {
            this[namespace] = apis;
        }
    }
}

export class TestContext implements Context {
    public logger: bunyan;
    public sysconfig: SysConfig;
    public apis: ContextApis;
    public foundation: LegacyFoundationApis;

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

        this.apis = testContextApis(testName);

        this.foundation = {
            getConnection: this.apis.foundation.getConnection,
            getEventEmitter: this.apis.foundation.getSystemEvents,
            makeLogger: this.apis.foundation.makeLogger,
        }
    }
}
