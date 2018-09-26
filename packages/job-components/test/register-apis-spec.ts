'use strict';

import { newTestJobConfig, TestContext } from '@terascope/teraslice-types';
import 'jest-extended'; // require for type definitions
import { registerApis } from '../src';

describe('registerApis', () => {
    const context = new TestContext('teraslice-operations');
    const jobConfig = newTestJobConfig();

    jobConfig.operations.push({
        _op: 'hello',
    });

    jobConfig.operations.push({
        _op: 'hi',
    });

    registerApis(context, jobConfig);

    it('should have the correct apis', () => {
        expect(context.apis).toHaveProperty('op_runner');
        expect(context.apis.op_runner.getClient).toBeFunction();
        expect(context.apis).toHaveProperty('job_runner');
        expect(context.apis.job_runner.getOpConfig).toBeFunction();
        expect(context.apis).toHaveProperty('executionContext');
        expect(context.apis.executionContext.register).toBeFunction();
        expect(context.apis.executionContext.create).toBeFunction();
    });

    describe('->getOpConfig', () => {
        const { getOpConfig } = context.apis.job_runner;

        it('should return the given operation', () => {
            expect(getOpConfig('hello')).toEqual({
                _op: 'hello',
            });
        });

        it('should return undefined if not found', () => {
            expect(getOpConfig('unknown')).toBeUndefined();
        });
    });

    describe('->getClient', () => {
        const { getClient } = context.apis.op_runner;

        it('op_runner.getClient should return a client', () => {
            expect(getClient({}, 'elasticsearch')).toEqual({
                cached: true,
                endpoint: 'default',
                type: 'elasticsearch',
            });
            expect(getClient({ connection: 'someConnection' }, 'kafka')).toEqual({
                cached: true,
                endpoint: 'someConnection',
                type: 'kafka',
            });
            expect(getClient({ connection_cache: false }, 'mongo')).toEqual({
                cached: true,
                endpoint: 'default',
                type: 'mongo',
            });
        });

        it('getClient will error properly', done => {
            const failingContext = new TestContext('teraslice-operations');
            const failJobConfig = newTestJobConfig();

            jobConfig.operations.push({
                _op: 'hello',
            });

            jobConfig.operations.push({
                _op: 'hi',
            });

            registerApis(failingContext, failJobConfig);
            const makeError = () => {
                throw new Error('a client error');
            };

            failingContext.foundation.getConnection = makeError;

            const events = failingContext.apis.foundation.getSystemEvents();
            const errStr =
                'No configuration for endpoint default ' +
                'was found in the terafoundation connectors';

            events.once('client:initialization:error', errMsg => {
                expect(errMsg.error.includes(errStr)).toEqual(true);
                done();
            });

            failingContext.apis.op_runner.getClient();
        });

        it('getClient returns client with certain defaults', () => {
            const opConfig1 = {};
            const opConfig2 = {
                connection: 'otherConnection',
            };
            const opConfig3 = {
                connection: 'thirdConnection',
                connection_cache: false,
            };

            const type = 'elasticsearch';

            const results1 = getClient(opConfig1, type);
            const results2 = getClient(opConfig2, type);
            const results3 = getClient(opConfig3, type);

            expect(results1).toEqual({ endpoint: 'default', cached: true, type: 'elasticsearch' });

            expect(results2).toEqual({
                cached: true,
                endpoint: 'otherConnection',
                type: 'elasticsearch',
            });

            expect(results3).toEqual({
                cached: false,
                endpoint: 'thirdConnection',
                type: 'elasticsearch',
            });
        });
    });

    describe('->executionContext', () => {
        describe('->register', () => {
            it('should succeed', () => {
                expect(() => {
                    context.apis.executionContext.register('hello', () => 'hi');
                }).not.toThrow();
            });
        });

        describe('->create', () => {
            it('should throw an error when the API is not found', async () => {
                expect.hasAssertions();

                try {
                    await context.apis.executionContext.create('uh-oh');
                } catch (err) {
                    expect(err.message).toEqual('Unable to find API by name "uh-oh"');
                }
            });

            it('should succeed when called with "hello"', async () => {
                const result = await context.apis.executionContext.create('hello');
                expect(result).toEqual('hi');
            });
        });
    });
});
