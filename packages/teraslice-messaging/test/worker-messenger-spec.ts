import 'jest-extended';

import { WorkerMessenger } from '../src';

describe('WorkerMessenger', () => {
    describe('when constructed without a executionControllerUrl', () => {
        it('should throw an error', () => {
            expect(() => {
                // @ts-ignore
                new WorkerMessenger({});
            }).toThrowError('WorkerMessenger requires a valid executionControllerUrl');
        });
    });

    describe('when constructed without a workerId', () => {
        it('should throw an error', () => {
            expect(() => {
                // @ts-ignore
                new WorkerMessenger({
                    executionControllerUrl: 'example.com'
                });
            }).toThrowError('WorkerMessenger requires a valid workerId');
        });
    });

    describe('when constructed with an invalid executionControllerUrl', () => {
        let worker: WorkerMessenger;

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
});
