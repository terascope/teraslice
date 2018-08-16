'use strict';

import { TestContext } from '@terascope/teraslice-types';
import { registerApis } from '../src';

describe('registerApis', () => {
    const context = new TestContext('teraslice-operations');

    beforeAll(() => {
        registerApis(context);
    });

    it('should have the correct apis', () => {
        expect(context.apis).toHaveProperty('op_runner');
        expect(context.apis.op_runner).toHaveProperty('getClient');
        expect(typeof context.apis.op_runner.getClient).toEqual('function');
    });

    describe('->getClient', () => {
        it('op_runner.getClient should return a client', () => {
            const { getClient } = context.apis.op_runner;

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

        it('getClient will error properly', (done) => {
            const makeError = () => {
                throw new Error('a client error');
            };
            context.apis.foundation.getConnection = makeError;
            const events = context.apis.foundation.getSystemEvents();
            const errStr = 'No configuration for endpoint default '
                            + 'was found in the terafoundation connectors';

            events.once('client:initialization:error', (errMsg) => {
                expect(errMsg.error.includes(errStr)).toEqual(true);
                done();
            });
            context.apis.op_runner.getClient();
        });
    });
});
