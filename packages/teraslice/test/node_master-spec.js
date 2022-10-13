import _ from 'lodash';
import eventsModule from 'events';
import { debugLogger } from '@terascope/job-components';
import nodeModule from '../lib/cluster/node_master';

process.env.assignment = 'node_master';

describe('Node master', () => {
    let eventEmitter = {};

    const logger = debugLogger('node-master-spec');

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
        __test_job: JSON.stringify(require('../../../examples/jobs/data_generator.json')),
        __test_assignment: 'worker'
    };

    const fakeClusterMaster = require('socket.io')({
        path: '/native-clustering'
    });

    fakeClusterMaster.on('connection', (socket) => {
        socket.on('node:state', (data) => {
            eventEmitter.emit('node:state', data);
        });
        socket.on('node:online', (data) => {
            eventEmitter.emit('node:online', data);
        });
        socket.on('messaging:response', (data) => {
            eventEmitter.emit('messaging:response', data);
        });
    });

    fakeClusterMaster.listen(9999);

    function waitForEvent(eventName, fn) {
        return new Promise((resolve) => {
            eventEmitter.once(eventName, (data) => {
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
            this._isDead = false;
            processCounter += 1;
            _.forOwn(obj, (value, key) => {
                this[key] = value;
            });
            this.process = {
                connected: this.connected,
                pid: processCounter,
                _msgSent: null,
                kill: (signal) => {
                    this._isDead = true;
                    this.connected = false;
                    if (delayRemoval && signal === 'SIGTERM') {
                        setTimeout(() => eventEmitter.emit('deleteWorker', this.id), 500);
                    } else {
                        eventEmitter.emit('deleteWorker', this.id);
                    }
                }
            };

            this.connected = true;
        }

        kill(signal) {
            this.process.kill(signal);
        }

        isDead() {
            return this._isDead;
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
                    assignment: 'worker'
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
                    assignment: 'worker'
                }),
                worker4: makeWorker({
                    id: 'worker4',
                    ex_id: '1212',
                    job_id: '2323',
                    assets: [{ id: 1234567890 }],
                    assignment: 'worker'
                })
            }
        };
        context.apis.foundation.getSystemEvents = () => newEmitter;
        context.cluster = Object.assign(Object.create(newEmitter), startingWorkers);
        eventEmitter.on('deleteWorker', (id) => delete context.cluster.workers[id]);
        return nodeModule(context);
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

    afterAll(() => fakeClusterMaster.close());

    it('can load without throwing', () => {
        expect(() => setUpNodeMaster()).not.toThrowError();
    });

    it('can remove workers', async () => {
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

        await waitForEvent('node:online');
        await Promise.all([sendMsg(networkMsg), waitFor(700)]);
        const processesAlive = Object.keys(context.cluster.workers).length;
        expect(processesAlive).toEqual(3);
    });
});
