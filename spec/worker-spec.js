'use strict';

const events = require('events');
const eventEmitter = new events.EventEmitter();

fdescribe('Worker', () => {
    const workerExecutorModule = require('../lib/cluster/worker/executor');
    let sentMsg;
    let loggerErrMsg;
    let debugMsg;
    let logInfo;
    let warnMsg;

    const logger = {
        error(err) {
            loggerErrMsg = err;
        },
        info(info) {
            logInfo = info;
        },
        warn(msg) {
            warnMsg = msg;
        },
        trace() {},
        debug(msg) {
            debugMsg = msg;
        },
        flush() {}
    };

    const context = {
        sysconfig: {
            teraslice: {
                hostname: 'testHostName'
            }
        },
        apis: {
            foundation: {
                makeLogger: () => logger,
                getSystemEvents: () => eventEmitter
            }
        },
        cluster: {
            worker: {
                id: 'someID'
            }
        }
    };
    const messaging = {
        register: () => {},
        getHostUrl: () => 'someURL',
        send: _sentMsg => sentMsg = _sentMsg,
        initialize: () => {}
    };
    const executionContext = {
        queue: [],
        config: {
            max_retries: 3,
            analytics: true,
            recycle_worker: false
        }
    };
    const stateStore = {};
    const analyticsStore = {};

    function getWorker() {
        return workerExecutorModule(context, messaging, executionContext, stateStore, analyticsStore);
    }

    it('can load', () => {
        expect(() => getWorker()).not.toThrowError();
    });
});
