
import debugnyan from 'debugnyan';
import { EventEmitter } from 'events';
import * as c from './interfaces/context';
import * as j from './interfaces/jobs';
import { random, isString, uniq } from './utils';

interface DebugParamObj {
    module: string;
    assignment?: string;
}

function newId(prefix: string): string {
    return `${prefix}-${random(10000, 99999)}`;
}

type debugParam = DebugParamObj | string;

export function debugLogger(testName: string, param?: debugParam, otherName?: string): c.Logger {
    let logger: c.Logger;
    const options = {};
    const parts: string[] = ['teraslice', testName];
    if (param) {
        if (isString(param)) {
            parts.push(param as string);
        } else if (typeof param === 'object') {
            parts.push(param.module);
            if (param.assignment) {
                parts.push(param.assignment);
            }
        }
    }

    if (otherName) {
        parts.push(otherName);
    }

    logger = debugnyan(uniq(parts).join(':'), options) as c.Logger;

    logger.flush = () => Promise.resolve();

    return logger;
}

export function newTestSlice(): j.Slice {
    return {
        slice_id: newId('slice-id'),
        slicer_id: random(0, 99999),
        slicer_order: random(0, 99999),
        request: {},
        _created: new Date().toISOString(),
    };
}

export function newTestJobConfig(): j.ValidatedJobConfig {
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

export function newTestExecutionConfig(): j.ExecutionConfig {
    const exConfig: j.ExecutionConfig = newTestJobConfig();
    exConfig.slicer_hostname = 'example.com';
    exConfig.slicer_port = random(8000, 60000);
    exConfig.ex_id = newId('ex-id');
    exConfig.job_id = newId('job-id');
    return exConfig;
}

export function newTestExecutionContext(type: c.Assignment, config: j.ExecutionConfig): j.ExecutionContext {
    if (type === c.Assignment.ExecutionController) {
        return {
            config,
            queue: [],
            reader: null,
            slicer: () => {},
            dynamicQueueLength: false,
            queueLength: 10000,
            reporter: null,
        };
    }

    return {
        config,
        queue: config.operations.map(() => () => {}),
        reader: () => {},
        slicer: null,
        dynamicQueueLength: false,
        queueLength: 10000,
        reporter: null,
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
