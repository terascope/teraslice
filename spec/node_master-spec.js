'use strict';

const eventsModule = require('events');
const _ = require('lodash');
const Promise = require('bluebird');

describe('Node master', () => {
    const nodeModule = require('../lib/cluster/node_master');
    let eventEmitter = {};

    const logger = {
        error() {},
        info() {},
        warn() {},
        trace() {},
        debug() {},
        flush() {}
    };

    const context = {
        sysconfig: {
            teraslice: {
                master_hostname: 'localhost',
                port: 9999,
                shutdown_timeout: 400,
                workers: 10,
                assets_directory: '',
                slicer_port_range: '5678:5700',
                action_timeout: 500
            },
            _nodeName: 'testNodeName'
        },
        apis: {
            foundation: {
                makeLogger: () => logger,
                getSystemEvents: () => eventEmitter
            },
            registerAPI: () => {}
        },
        cluster: {},
        logger,
    };

    const testConfig = {
        execution: _.cloneDeep(require('../examples/jobs/data_generator.json')),
        assignment: 'worker',
    };

    const fakeClusterMaster = require('socket.io')();

    fakeClusterMaster.on('connection', (socket) => {
        socket.on('node:state', (data) => {
            eventEmitter.emit('node:state', data);
        });
        socket.on('node:online', (data) => {
            eventEmitter.emit('node:online', data);
        });
        socket.on('node:workers:over_allocated', (data) => {
            eventEmitter.emit('node:workers:over_allocated', data);
        });
        socket.on('messaging:response', (data) => {
            eventEmitter.emit('messaging:response', data);
        });
    });

    fakeClusterMaster.listen(9999);

    function waitForEvent(eventName, fn) {
        return new Promise((resolve) => {
            eventEmitter.on(eventName, (data) => {
                resolve(data);
            });
            if (fn) {
                fn();
            }
        });
    }

    // act like the pid
    let processCounter = 0;
    let delayRemoval = false;

    class ProcessWorker {
        constructor(obj) {
            processCounter += 1;
            _.forOwn(obj, (value, key) => {
                this[key] = value;
            });
            this.process = {
                pid: processCounter,
                _msgSent: null,
                kill: () => eventEmitter.emit('deleteWorker', this.id)
            };
        }

        send(processMsg) {
            if (delayRemoval && processMsg.message === 'worker:shutdown') {
                setTimeout(() => eventEmitter.emit('deleteWorker', this.id), 500);
            }
        }
    }

    function makeWorker(config) {
        return new ProcessWorker(config);
    }

    function setUpNodeMaster() {
        const newEmitter = new eventsModule.EventEmitter();
        eventEmitter = newEmitter;
        const startingWorkers = {
            workers: {
                worker1: makeWorker({
                    id: 'worker1',
                    ex_id: '1234',
                    job_id: '5678',
                    assignment: 'worker',
                }),
                worker2: makeWorker({
                    id: 'worker2',
                    ex_id: '1234',
                    job_id: '5678',
                    assignment: 'slicer'
                }),
                worker3: makeWorker({
                    id: 'worker3',
                    ex_id: '1234',
                    job_id: '5678',
                    assignment: 'worker',
                }),
                worker4: makeWorker({
                    id: 'worker4',
                    ex_id: '1212',
                    job_id: '2323',
                    assets: [{ id: 1234567890 }],
                    assignment: 'worker',
                })
            }
        };
        context.apis.foundation.getSystemEvents = () => newEmitter;
        context.cluster = Object.assign(Object.create(newEmitter), startingWorkers);
        eventEmitter.on('deleteWorker', id => delete context.cluster.workers[id]);
        return nodeModule(context, testConfig);
    }

    function waitFor(timeout) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(true);
            }, timeout);
        });
    }

    function sendMsg(data) {
        fakeClusterMaster.emit('networkMessage', data);
    }

    beforeEach(() => {
        delayRemoval = false;
    });

    it('can load without throwing', () => {
        expect(() => setUpNodeMaster()).not.toThrowError();
    });

    it('can remove workers', (done) => {
        setUpNodeMaster();

        const networkMsg = {
            ex_id: '1234',
            response: true,
            to: 'node_master',
            message: 'cluster:workers:remove',
            __source: 'cluster_master',
            payload: { workers: 1 }
        };
        delayRemoval = true;

        Promise.resolve()
            .then(() => waitForEvent('node:online'))
            .then(() => Promise.all([sendMsg(networkMsg), waitFor(700)]))
            .then(() => {
                const processesAlive = Object.keys(context.cluster.workers).length;
                expect(processesAlive).toEqual(3);
            })
            .catch(fail)
            .finally(done);
    });
});
