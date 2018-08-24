import debugnyan from 'debugnyan';
import { EventEmitter } from 'events';
import * as c from './context';
import * as j from './jobs';

export function debugLogger(testName: string, ...params: any[]): c.Logger {
    let logger: c.Logger;

    if (params.length === 0) {
        logger = debugnyan(`teraslice:${testName}`) as c.Logger;
    } else if (typeof params[0] === 'string') {
        logger = debugnyan(
            `teraslice:${testName}`,
            {},
            { simple: false, suffix: params[0] as string },
        ) as c.Logger;
    } else {
        logger = debugnyan(`teraslice:${testName}`, params[0] as object, {
            simple: false,
            suffix: params[0].module,
        }) as c.Logger;
    }

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
        };
    }
}
