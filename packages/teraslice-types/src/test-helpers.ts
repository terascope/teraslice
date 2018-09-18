
import _ from 'lodash';
import debugnyan from 'debugnyan';
import { EventEmitter } from 'events';
import * as c from './context';
import * as j from './jobs';
interface DebugParamObj {
    module: string;
    assignment?: string;
}

type debugParam = DebugParamObj | string;

export function debugLogger(testName: string, param?: debugParam, otherName?: string): c.Logger {
    let logger: c.Logger;
    const options = {};
    const parts: string[] = ['teraslice', testName];
    if (param) {
        if (_.isString(param)) {
            parts.push(param as string);
        } else if (_.isPlainObject(param)) {
            parts.push(param.module);
            if (param.assignment) {
                parts.push(param.assignment);
            }
        }
    }

    if (otherName) {
        parts.push(otherName);
    }

    logger = debugnyan(_.uniq(parts).join(':'), options) as c.Logger;

    logger.flush = () => Promise.resolve();

    return logger;
}

export function newTestJobConfig(): j.JobConfig {
    return {
        analytics: false,
        assets: [],
        lifecycle: j.LifeCycle.Once,
        max_retries: 1,
        name: 'test-job',
        operations: [],
        probation_window: 30000,
        recycle_worker: 0,
        slicers: 1,
        workers: 1,
    };
}

function testContextApis(testName: string): c.ContextApis {
    const events = new EventEmitter();
    return {
        foundation: {
            makeLogger(...params: any[]): c.Logger {
                return debugLogger(testName, ...params);
            },
            getConnection(config: c.ConnectionConfig): { client: any } {
                return { client: config };
            },
            getSystemEvents(): EventEmitter {
                return events;
            },
        },
        registerAPI(namespace: string, apis: any): void {
            this[namespace] = apis;
        },
    };
}

export class TestContext implements c.Context {
    public logger: c.Logger;
    public sysconfig: c.SysConfig;
    public apis: c.ContextApis;
    public foundation: c.LegacyFoundationApis;

    constructor(testName: string) {
        this.logger = debugLogger(testName);

        this.sysconfig = {
            terafoundation: {
                connectors: {
                    elasticsearch: {
                        default: {}
                    }
                },
            },
            teraslice: {
            },
        };

        this.apis = testContextApis(testName);

        this.foundation = {
            getConnection: this.apis.foundation.getConnection,
            getEventEmitter: this.apis.foundation.getSystemEvents,
            makeLogger: this.apis.foundation.makeLogger,
        };
    }
}
