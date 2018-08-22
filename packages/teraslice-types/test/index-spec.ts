import { EventEmitter } from 'events';
import 'jest-extended'; // require for type definitions
import * as index from '../src/index';

it('should be truthy', () => {
    expect(index).toBeTruthy();
});

describe('TestContext', () => {
    it('should have a debugLogger', () => {
        expect(index.debugLogger).toBeFunction();

        const logger = index.debugLogger('test-name');
        expect(logger).toHaveProperty('flush');
        expect(logger).toHaveProperty('info');
        expect(logger).toHaveProperty('debug');
        expect(logger).toHaveProperty('warn');
        expect(logger).toHaveProperty('error');
        expect(logger).toHaveProperty('trace');
        expect(logger).toHaveProperty('fatal');
    });

    it('should have a newTestJobConfig', () => {
        expect(index.newTestJobConfig).toBeFunction();

        const jobConfig = index.newTestJobConfig();
        expect(jobConfig).toHaveProperty('name', 'test-job');
        expect(jobConfig.operations).toBeArrayOfSize(0);
        expect(jobConfig.assets).toBeArrayOfSize(0);
    });

    it('should have a TestContext', () => {
        expect(index.TestContext).toBeTruthy();
        const context = new index.TestContext('test-name');
        expect(context).toHaveProperty('sysconfig');
        expect(context).toHaveProperty('apis');
        expect(context).toHaveProperty('foundation');
        expect(context.apis.foundation.getSystemEvents()).toBeInstanceOf(EventEmitter);
        expect(
            context.apis.foundation.getConnection({
                endpoint: 'default',
                type: 'example',
            }),
        ).toEqual({ client: { endpoint: 'default', type: 'example' } });
        expect(context.apis.foundation.makeLogger()).toBeTruthy();
        expect(context.apis.foundation.makeLogger({ module: 'hi' })).toBeTruthy();
        expect(context.apis.foundation.makeLogger('hello')).toBeTruthy();

        const api = { there: () => 'peter' };
        expect(context.apis.registerAPI('hello', api)).toBeUndefined();
        expect(context.apis.hello.there()).toEqual('peter');
    });
});
