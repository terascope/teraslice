
import debugnyan from 'debugnyan';
import { EventEmitter } from 'events';
import * as i from './interfaces';
import { random, isString, uniq } from './utils';

interface DebugParamObj {
    module: string;
    assignment?: string;
}

function newId(prefix: string): string {
    return `${prefix}-${random(10000, 99999)}`;
}

type debugParam = DebugParamObj | string;

export function debugLogger(testName: string, param?: debugParam, otherName?: string): i.Logger {
    let logger: i.Logger;
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

    logger = debugnyan(uniq(parts).join(':'), options) as i.Logger;

    logger.flush = () => Promise.resolve();

    return logger;
}

export function newTestSlice(): i.Slice {
    return {
        slice_id: newId('slice-id'),
        slicer_id: random(0, 99999),
        slicer_order: random(0, 99999),
        request: {},
        _created: new Date().toISOString(),
    };
}

export function newTestJobConfig(): i.ValidatedJobConfig {
    return {
        analytics: false,
        assets: [],
        lifecycle: i.LifeCycle.Once,
        max_retries: 1,
        name: 'test-job',
        operations: [],
        probation_window: 30000,
        recycle_worker: 0,
        slicers: 1,
        workers: 1,
    };
}

export function newTestExecutionConfig(): i.ExecutionConfig {
    const exConfig = newTestJobConfig() as i.ExecutionConfig;
    exConfig.slicer_hostname = 'example.com';
    exConfig.slicer_port = random(8000, 60000);
    exConfig.ex_id = newId('ex-id');
    exConfig.job_id = newId('job-id');
    return exConfig;
}

export function newTestExecutionContext(type: i.Assignment, config: i.ExecutionConfig): i.LegacyExecutionContext {
    if (type === i.Assignment.ExecutionController) {
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
        slicer: () => {},
        dynamicQueueLength: false,
        queueLength: 10000,
        reporter: null,
    };
}

function testContextApis(testName: string): i.ContextApis {
    const events = new EventEmitter();
    return {
        foundation: {
            makeLogger(...params: any[]): i.Logger {
                return debugLogger(testName, ...params);
            },
            getConnection(config: i.ConnectionConfig): { client: any } {
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

export class TestContext implements i.Context {
    logger: i.Logger;
    sysconfig: i.SysConfig;
    apis: i.ContextApis;
    foundation: i.LegacyFoundationApis;
    name: string;
    assignment = 'worker';
    platform = process.platform;
    arch = process.arch;

    constructor(testName: string) {
        this.name = testName;

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
