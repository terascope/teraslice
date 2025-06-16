import 'jest-extended';
import { jest } from '@jest/globals';
import { TestContext, newTestExecutionConfig, Context } from '../../../src/index.js';
import APICore from '../../../src/operations/core/api-core.js';

describe('APICore', () => {
    class ExampleAPI extends APICore {}

    let api: ExampleAPI;

    beforeAll(() => {
        const context = new TestContext('teraslice-operations') as Context;
        const exConfig = newTestExecutionConfig();
        api = new ExampleAPI(context, { _name: 'example' }, exConfig);
    });

    describe('->initialize', () => {
        it('should resolve undefined', () => expect(api.initialize()).resolves.toBeUndefined());
    });

    describe('->shutdown', () => {
        it('should resolve undefined', () => expect(api.shutdown()).resolves.toBeUndefined());
    });

    describe('->onSliceInitialized', () => {
        it('should not have the method by default', () => {
            expect(api).not.toHaveProperty('onSliceInitialized');
        });
    });

    describe('->onSliceStarted', () => {
        it('should not have the method by default', () => {
            expect(api).not.toHaveProperty('onSliceStarted');
        });
    });

    describe('->onSliceFinalizing', () => {
        it('should not have the method by default', () => {
            expect(api).not.toHaveProperty('onSliceFinalizing');
        });
    });

    describe('->onSliceFinished', () => {
        it('should not have the method by default', () => {
            expect(api).not.toHaveProperty('onSliceFinished');
        });
    });

    describe('->onSliceFailed', () => {
        it('should not have the method by default', () => {
            expect(api).not.toHaveProperty('onSliceFailed');
        });
    });

    describe('->onSliceRetry', () => {
        it('should not have the method by default', () => {
            expect(api).not.toHaveProperty('onSliceRetry');
        });
    });

    describe('->rejectRecord', () => {
        const record = Buffer.from('hello');
        const err = new Error('Bad news bears');

        describe('when the action is log', () => {
            let ogError: any;

            beforeAll(() => {
                ogError = api.logger.error;
                api.deadLetterAction = 'log';
                // @ts-expect-error
                api.logger.error = jest.fn();
            });

            afterAll(() => {
                api.logger.error = ogError;
            });

            it('should log the record', () => {
                const result = api.rejectRecord(record, err);
                expect(api.logger.error).toHaveBeenCalledWith(err, 'Bad record', record);
                expect(result).toBeNull();
            });
        });

        describe('when the action is throw', () => {
            beforeAll(() => {
                api.deadLetterAction = 'throw';
            });

            it('should throw the original error', () => {
                expect(() => {
                    api.rejectRecord(record, err);
                }).toThrow('Bad news bears');
            });
        });
    });

    describe('->tryRecord', () => {
        const record = Buffer.from('hello');
        const err = new Error('Bad news bears');

        let ogReject: any;
        beforeEach(() => {
            ogReject = api.rejectRecord;
            // @ts-expect-error
            api.rejectRecord = jest.fn();
        });

        afterEach(() => {
            api.rejectRecord = ogReject;
        });

        describe('when the fn fails', () => {
            it('should call operation.rejectRecord', () => {
                const fn = api.tryRecord(() => {
                    throw err;
                });

                const result = fn(record);
                expect(api.rejectRecord).toHaveBeenCalledWith(record, err);
                expect(result).toBeNull();
            });
        });

        describe('when the fn succceds', () => {
            it('should not call operation.rejectRecord', () => {
                const fn = api.tryRecord(() => ({ hello: true }));

                const result = fn(record);
                expect(api.rejectRecord).not.toHaveBeenCalled();
                expect(result).toEqual({ hello: true });
            });
        });
    });
});
