'use strict';

const engineCode = require('../../lib/cluster/execution_controller/engine');
const events = require('events');
const Promise = require('bluebird');

const eventEmitter = new events.EventEmitter();

xdescribe('execution engine', () => {
    const logger = {
        error() {
        },
        info() {
        },
        warn() {
        },
        trace() {
        },
        debug() {
        }
    };
    let sentMsg = null;
    let testSlices;
    const executionModules = {
        context: {
            apis: {
                foundation: {
                    makeLogger: () => logger,
                    getSystemEvents: () => eventEmitter
                }
            }
        },
        messaging: {
            send: (msg) => {
                sentMsg = msg;
            }
        },
        executionAnalytics: { getAnalytics: () => ({}) },
        exStore: {
            failureMetaData: () => {
            },
            setStatus: () => {
            }
        },
        stateStore: {
            executionStartingSlice: () => {},
            recoverSlices: () => {
                const data = testSlices.slice();
                testSlices = [];
                return Promise.resolve(data);
            }
        },
        engine: {
            enqueueSlice: () => {
            }
        },
        executionContext: { config: { slicers: 2 } }
    };

    xit('can instantiate', () => {
        const engine = engineCode(executionModules);

        expect(engine).toBeDefined();
        expect(engine.initialize).toBeDefined();
        expect(engine.registerSlicers).toBeDefined();
        expect(engine.setQueueLength).toBeDefined();
        expect(engine.adjustQueueLength).toBeDefined();
        expect(engine.enqueueWorker).toBeDefined();
        expect(engine.removeWorker).toBeDefined();
        expect(engine.enqueueSlice).toBeDefined();
        expect(engine.pause).toBeDefined();
        expect(engine.resume).toBeDefined();
        expect(engine.shutdown).toBeDefined();

    });

    xit('can instantiate', () => {
        const engine = engineCode(executionModules);

        expect(engine).toBeDefined();
        expect(engine.initialize).toBeDefined();
        expect(engine.registerSlicers).toBeDefined();
        expect(engine.setQueueLength).toBeDefined();
        expect(engine.adjustQueueLength).toBeDefined();
        expect(engine.enqueueWorker).toBeDefined();
        expect(engine.removeWorker).toBeDefined();
        expect(engine.enqueueSlice).toBeDefined();
        expect(engine.pause).toBeDefined();
        expect(engine.resume).toBeDefined();
        expect(engine.shutdown).toBeDefined();

    });
});
