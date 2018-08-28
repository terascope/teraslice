import 'jest-extended';

import { Message } from '../src/messenger';
import { findPort } from './helpers/find-port';
import {
    formatURL,
    newMsgId,
    ExecutionController
} from '../src';

describe('ExecutionController', () => {
    describe('->Client', () => {
        describe('when constructed without a executionControllerUrl', () => {
            it('should throw an error', () => {
                expect(() => {
                    // @ts-ignore
                    new ExecutionController.Client({});
                }).toThrowError('ExecutionController.Client requires a valid executionControllerUrl');
            });
        });

        describe('when constructed without a workerId', () => {
            it('should throw an error', () => {
                expect(() => {
                    // @ts-ignore
                    new ExecutionController.Client({
                        executionControllerUrl: 'example.com'
                    });
                }).toThrowError('ExecutionController.Client requires a valid workerId');
            });
        });

        describe('when constructed with an invalid executionControllerUrl', () => {
            let worker: ExecutionController.Client;

            beforeEach(() => {
                worker = new ExecutionController.Client({
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
    })

    describe('Client & Server', () => {
        let worker: ExecutionController.Client;
        let exMessenger: ExecutionController.Server;
        let workerId: string;

        beforeEach(async () => {
            const slicerPort = await findPort();
            const executionControllerUrl = formatURL('localhost', slicerPort);
            exMessenger = new ExecutionController.Server({
                controllerId: newMsgId(),
                port: slicerPort,
                networkLatencyBuffer: 0,
                actionTimeout: 1000,
            });

            await exMessenger.start();

            workerId = newMsgId();
            worker = new ExecutionController.Client({
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
            let enqueuedMsg: object | undefined;

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
                let msg: object | undefined;

                beforeEach((done) => {
                    exMessenger.executionFinished('some-ex-id');

                    const timeout = setTimeout(() => {
                        worker.removeAllListeners('worker:shutdown');
                        done();
                    }, 1000);

                    worker.once('worker:shutdown', (_msg: Message) => {
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
                    }
                });
            });

            describe('when the worker responds with an error', () => {
                let responseMsg: Message | object | undefined;
                let responseErr: Error | undefined;

                beforeEach(async () => {
                    worker.socket.on('some:message', (msg: Message) => {
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
                    // @ts-ignore
                    expect(responseMsg).toBeNil();
                    expect(responseErr && responseErr.toString()).toEqual('Error: this should fail');
                });
            });

            describe('when the worker takes too long to respond', () => {
                let responseMsg: Message | object | undefined;
                let responseErr: Error | undefined;

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
                    // @ts-ignore
                    expect(responseMsg).toBeNil();
                    expect(responseErr && responseErr.toString()).toStartWith(`Error: Timeout error while communicating with ${workerId}, with message:`);
                });
            });
        });
    })
});
