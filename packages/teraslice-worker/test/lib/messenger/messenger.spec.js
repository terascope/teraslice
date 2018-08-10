'use strict';

/* eslint-disable no-console, no-new */

const { EventEmitter } = require('events');
const newId = require('../../../lib/utils/new-id');
const { formatURL } = require('../../../lib/utils');
const { findPort } = require('../../helpers');
const MessengerServer = require('../../../lib/messenger/server');
const MessengerCore = require('../../../lib/messenger/core');
const MessengerClient = require('../../../lib/messenger/client');
const WorkerMessenger = require('../../../lib/worker/messenger');
const ExecutionControllerMessenger = require('../../../lib/execution-controller/messenger');
const ClusterMasterClient = require('../../../lib/execution-controller/cluster-master-client');

describe('Messenger', () => {
    describe('when Messenger is constructed without a valid actionTimeout', () => {
        it('should throw an error', () => {
            expect(() => {
                new MessengerCore({});
            }).toThrowError('Messenger requires a valid actionTimeout');
        });
    });

    describe('when Messenger is constructed without a valid networkLatencyBuffer', () => {
        it('should throw an error', () => {
            expect(() => {
                new MessengerCore({
                    actionTimeout: 10,
                    networkLatencyBuffer: 'abc'
                });
            }).toThrowError('Messenger requires a valid networkLatencyBuffer');
        });
    });

    describe('when MessengerClient is constructed without a valid hostUrl', () => {
        it('should throw an error', () => {
            expect(() => {
                new MessengerClient({
                    actionTimeout: 1,
                    networkLatencyBuffer: 0
                });
            }).toThrowError('MessengerClient requires a valid hostUrl');
        });
    });

    describe('when MessengerClient is constructed without a valid socketOptions', () => {
        it('should throw an error', () => {
            expect(() => {
                new MessengerClient({
                    hostUrl: '',
                    actionTimeout: 1,
                    networkLatencyBuffer: 0
                });
            }).toThrowError('MessengerClient requires a valid socketOptions');
        });
    });

    describe('when WorkerMessenger is constructed without a executionControllerUrl', () => {
        it('should throw an error', () => {
            expect(() => {
                new WorkerMessenger();
            }).toThrowError('WorkerMessenger requires a valid executionControllerUrl');
        });
    });

    describe('when WorkerMessenger is constructed without a workerId', () => {
        it('should throw an error', () => {
            expect(() => {
                new WorkerMessenger({
                    executionControllerUrl: 'example.com'
                });
            }).toThrowError('WorkerMessenger requires a valid workerId');
        });
    });

    describe('when ClusterMasterClient is constructed without a clusterMasterUrl', () => {
        it('should throw an error', () => {
            expect(() => {
                new ClusterMasterClient();
            }).toThrowError('ClusterMasterClient requires a valid clusterMasterUrl');
        });
    });

    describe('when ClusterMasterClient is constructed without a workerId', () => {
        it('should throw an error', () => {
            expect(() => {
                new ClusterMasterClient({
                    clusterMasterUrl: 'example.com'
                });
            }).toThrowError('ClusterMasterClient requires a valid executionContext');
        });
    });

    describe('when ExecutionControllerMessenger is constructed without a port', () => {
        it('should throw an error', () => {
            expect(() => {
                new ExecutionControllerMessenger({
                    actionTimeout: 1000,
                });
            }).toThrowError('MessengerServer requires a valid port');
        });
    });

    describe('when ExecutionControllerMessenger started twice', () => {
        it('should throw an error', async () => {
            const port = await findPort();
            const exMessenger = new ExecutionControllerMessenger({
                port,
                actionTimeout: 1000,
            });
            await exMessenger.start();
            await expect(exMessenger.start()).rejects.toThrowError(`Port ${port} is already in-use`);
            await exMessenger.shutdown();
        });
    });

    describe('when WorkerMessenger constructed with an invalid executionControllerUrl', () => {
        let worker;
        beforeEach(() => {
            worker = new WorkerMessenger({
                executionControllerUrl: 'http://idk.example.com',
                workerId: 'hello',
                actionTimeout: 1000,
                socketOptions: {
                    timeout: 1000,
                    reconnection: false,
                }
            });
        });

        it('start should throw an error', () => {
            const errMsg = /^Unable to connect to execution controller/;
            return expect(worker.start()).rejects.toThrowError(errMsg);
        });
    });

    describe('when ClusterMasterClient constructed with an invalid clusterMasterUrl', () => {
        let clusterMaster;
        beforeEach(() => {
            clusterMaster = new ClusterMasterClient({
                clusterMasterUrl: 'http://idk.example.com',
                executionContext: {
                    nodeId: 'hello',
                },
                actionTimeout: 1000,
                socketOptions: {
                    timeout: 1000,
                    reconnection: false,
                }
            });
        });

        it('start should throw an error', () => {
            const errMsg = /^Unable to connect to cluster master/;
            return expect(clusterMaster.start()).rejects.toThrowError(errMsg);
        });
    });

    describe('when constructed with an valid host', () => {
        let worker;
        let exMessenger;
        let workerId;

        beforeEach(async () => {
            const slicerPort = await findPort();
            const executionControllerUrl = formatURL('localhost', slicerPort);
            exMessenger = new ExecutionControllerMessenger({
                port: slicerPort,
                networkLatencyBuffer: 0,
                actionTimeout: 1000,
                events: new EventEmitter(),
            });

            await exMessenger.start();

            workerId = newId('worker-id');
            worker = new WorkerMessenger({
                workerId,
                executionControllerUrl,
                networkLatencyBuffer: 0,
                actionTimeout: 1000,
                socketOptions: {
                    timeout: 1000,
                    reconnection: false,
                },
            });

            await worker.start();
        });

        afterEach(async () => {
            await exMessenger.shutdown();
            await worker.shutdown();
        });

        describe('when calling start on the worker again', () => {
            it('should not throw an error', () => expect(worker.start()).resolves.toBeNil());
        });

        it('should have no available workers', () => {
            expect(exMessenger.availableWorkers()).toEqual(0);
        });

        describe('when the worker is ready', () => {
            let enqueuedMsg;

            beforeEach(async () => {
                worker.ready();
                enqueuedMsg = await exMessenger.onceWithTimeout(`worker:enqueue:${workerId}`);
            });

            it('should call worker ready on the exMessenger', () => {
                expect(enqueuedMsg).toEqual({ worker_id: workerId });
            });

            it('should have one client connected', async () => {
                expect(exMessenger.availableWorkers()).toEqual(1);
                expect(exMessenger.connectedWorkers()).toEqual(1);
            });

            describe('when sending worker:slice:complete', () => {
                it('should emit worker:slice:complete on the exMessenger', async () => {
                    const msg = await worker.sliceComplete({
                        slice: {
                            slice_id: 'worker-slice-complete'
                        },
                        analytics: 'hello',
                        error: 'hello'
                    });

                    expect(msg).toEqual({
                        slice_id: 'worker-slice-complete',
                        recorded: true,
                    });
                    expect(exMessenger.queue.exists('worker_id', workerId)).toBeTrue();
                });
            });

            describe('when receiving finished', () => {
                let msg;
                beforeEach((done) => {
                    exMessenger.executionFinished('some-ex-id');

                    const timeout = setTimeout(() => {
                        worker.removeAllListeners('worker:shutdown');
                        done();
                    }, 1000);

                    worker.once('worker:shutdown', (_msg) => {
                        clearTimeout(timeout);
                        msg = _msg;
                        done();
                    });
                });

                it('should receive the message on the worker', () => {
                    expect(msg).toEqual({
                        ex_id: 'some-ex-id',
                    });
                });
            });

            describe('when receiving slicer:slice:new', () => {
                describe('when the worker is set as available', () => {
                    beforeEach(() => {
                        worker.available = true;
                    });

                    it('should resolve with correct messages', async () => {
                        const response = exMessenger.sendNewSlice(workerId, {
                            example: 'slice-new-message'
                        });

                        const slice = worker.onceWithTimeout('slicer:slice:new');

                        await expect(response).resolves.toEqual({ willProcess: true });
                        await expect(slice).resolves.toEqual({ example: 'slice-new-message' });
                    });
                });

                describe('when the worker is set as unavailable', () => {
                    beforeEach(() => {
                        worker.available = false;
                    });

                    it('should reject with the correct error messages', async () => {
                        const response = exMessenger.sendNewSlice(workerId, {
                            example: 'slice-new-message'
                        });

                        const slice = worker.onceWithTimeout('slicer:slice:new');

                        await expect(response).rejects.toThrowError(`Worker ${workerId} will not process new slice`);
                        await expect(slice).rejects.toThrowError('Timed out after 1000ms, waiting for event "slicer:slice:new"');
                    });
                });
            });

            describe('when waiting for message that will never come', () => {
                it('should throw a timeout error', async () => {
                    expect.hasAssertions();
                    try {
                        await worker.onceWithTimeout('mystery:message');
                    } catch (err) {
                        expect(err).not.toBeNil();
                        expect(err.message).toEqual('Timed out after 1000ms, waiting for event "mystery:message"');
                        expect(err.code).toEqual(408);
                    }
                });
            });

            describe('when the worker responds with an error', () => {
                let responseMsg;
                let responseErr;

                beforeEach(async () => {
                    worker.socket.on('some:message', (msg) => {
                        worker.socket.emit('messaging:response', {
                            __msgId: msg.__msgId,
                            __source: 'execution_controller',
                            error: 'this should fail'
                        });
                    });
                    try {
                        responseMsg = await exMessenger.sendWithResponse({
                            address: workerId,
                            message: 'some:message',
                            payload: { hello: true }
                        });
                    } catch (err) {
                        responseErr = err;
                    }
                });

                it('exMessenger should get an error back', () => {
                    expect(responseMsg).toBeNil();
                    expect(responseErr.toString()).toEqual('Error: this should fail');
                });
            });

            describe('when the worker takes too long to respond', () => {
                let responseMsg;
                let responseErr;

                beforeEach(async () => {
                    try {
                        responseMsg = await exMessenger.sendWithResponse({
                            address: workerId,
                            message: 'some:message',
                            payload: { hello: true }
                        });
                    } catch (err) {
                        responseErr = err;
                    }
                });

                it('exMessenger should get an error back', () => {
                    expect(responseMsg).toBeNil();
                    expect(responseErr.toString()).toStartWith(`Error: Timeout error while communicating with ${workerId}, with message:`);
                });
            });
        });
    });

    describe('when testing server close', () => {
        describe('when close errors', () => {
            it('should reject with the error', () => {
                const messenger = new MessengerServer({
                    port: 123,
                    actionTimeout: 1000
                });
                messenger.server = {
                    close: jest.fn(done => done(new Error('oh no')))
                };
                return expect(messenger.shutdown()).rejects.toThrowError('oh no');
            });
        });

        describe('when close errors with Not running', () => {
            it('should resolve', () => {
                const messenger = new MessengerServer({
                    port: 123,
                    actionTimeout: 1000
                });
                messenger.server = {
                    close: jest.fn(done => done(new Error('Not running')))
                };
                return expect(messenger.shutdown()).resolves.toBeNil();
            });
        });

        describe('when close succeeds', () => {
            it('should resolve', () => {
                const messenger = new MessengerServer({
                    port: 123,
                    actionTimeout: 1000
                });
                messenger.server = {
                    close: jest.fn(done => done())
                };
                return expect(messenger.shutdown()).resolves.toBeNil();
            });
        });
    });
});
