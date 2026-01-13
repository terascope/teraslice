import { EventEmitter } from 'node:events';
import { debugLogger } from '@terascope/core-utils';
import { Server as SocketServer, Socket } from 'socket.io';
import { nodeMaster } from '../src/lib/cluster/node_master.js';

process.env.assignment = 'node_master';

describe('Node master', () => {
    let eventEmitter: EventEmitter;

    const logger = debugLogger('node-master-spec');

    const jobJson = {
        name: 'Data Generator',
        lifecycle: 'persistent',
        workers: 1,
        assets: ['elasticsearch', 'standard'],
        apis: [
            {
                _name: 'elasticsearch_sender_api',
                index: 'example-logs',
                type: 'events',
                size: 5000
            }
        ],
        operations: [
            {
                _op: 'data_generator',
                size: 5000
            },
            {
                _op: 'elasticsearch_bulk',
                _api_name: 'elasticsearch_sender_api'
            }
        ]
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
        cluster: {} as Record<string, any>,
        logger,
        __test_job: JSON.stringify(jobJson),
        __test_assignment: 'worker'
    };

    const fakeClusterMaster = new SocketServer({
        path: '/native-clustering'
    });

    fakeClusterMaster.on('connection', (socket: Socket) => {
        socket.on('node:state', (data: Record<string, any>) => {
            eventEmitter.emit('node:state', data);
        });
        socket.on('node:online', (data: Record<string, any>) => {
            eventEmitter.emit('node:online', data);
        });
        socket.on('messaging:response', (data: Record<string, any>) => {
            eventEmitter.emit('messaging:response', data);
        });
    });

    fakeClusterMaster.listen(9999);

    function waitForEvent(eventName: string, fn?: () => void) {
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
        _isDead = false;
        connected = true;
        process: Record<string, any>;
        id!: string;
        constructor(envConfig: Record<string, any>) {
            processCounter += 1;

            for (const [key, value] of Object.entries(envConfig)) {
                this[key as keyof this] = value;
            }

            this.process = {
                connected: this.connected,
                pid: processCounter,
                _msgSent: null,
                kill: (signal: string) => {
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

        kill(signal: string) {
            this.process.kill(signal);
        }

        isDead() {
            return this._isDead;
        }
    }

    function makeWorker(config: Record<string, any>) {
        return new ProcessWorker(config);
    }

    function setUpNodeMaster() {
        const newEmitter = new EventEmitter();
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
        return nodeMaster(context as any);
    }

    function waitFor(timeout: number) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(true);
            }, timeout);
        });
    }

    function sendMsg(data: any) {
        fakeClusterMaster.emit('networkMessage', data);
    }

    beforeEach(() => {
        delayRemoval = false;
    });

    afterAll(() => fakeClusterMaster.close());

    it('can load without throwing', () => {
        expect(() => setUpNodeMaster()).not.toThrow();
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
