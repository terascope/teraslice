import { EventEmitter } from 'events';
import {
    debugLogger,
    newTestJobConfig,
    newTestSlice,
    newTestExecutionContext,
    newTestExecutionConfig,
    TestContext,
} from '../src';

describe('Test Helpers', () => {
    it('should have a debugLogger', async () => {
        expect(debugLogger).toBeFunction();

        const logger = debugLogger('test-name');
        expect(logger).toHaveProperty('flush');
        expect(logger).toHaveProperty('info');
        expect(logger).toHaveProperty('debug');
        expect(logger).toHaveProperty('warn');
        expect(logger).toHaveProperty('error');
        expect(logger).toHaveProperty('trace');
        expect(logger).toHaveProperty('fatal');
        await logger.flush();
    });

    it('should have a newTestJobConfig', () => {
        expect(newTestJobConfig).toBeFunction();

        const jobConfig = newTestJobConfig();
        expect(jobConfig).toHaveProperty('name', 'test-job');
        expect(jobConfig.operations).toBeArrayOfSize(0);
        expect(jobConfig.assets).toBeArrayOfSize(0);
    });

    it('should have a newTestExecutionConfig', () => {
        expect(newTestSlice).toBeFunction();

        const exConfig = newTestExecutionConfig();
        expect(exConfig).toHaveProperty('name', 'test-job');
        expect(exConfig.operations).toBeArrayOfSize(0);
        expect(exConfig.assets).toBeArrayOfSize(0);
    });

    it('should have a newTestSlice', () => {
        expect(newTestSlice).toBeFunction();

        const slice = newTestSlice();
        expect(slice).toHaveProperty('slice_id');
        expect(slice.slice_id).toBeString();
        expect(slice).toHaveProperty('slicer_id');
        expect(slice.slicer_id).toBeNumber();
        expect(slice).toHaveProperty('slicer_order');
        expect(slice.slicer_order).toBeNumber();
        expect(slice).toHaveProperty('request');
        expect(slice.request).toBeObject();
        expect(slice).toHaveProperty('_created');
        expect(slice._created).toBeString();
    });

    it('should have a newTestExecutionContext (ExecutionController)', () => {
        expect(newTestExecutionConfig).toBeFunction();

        const exConfig = newTestExecutionConfig();
        const exContext = newTestExecutionContext('execution_controller', exConfig);
        expect(exContext.config).toEqual(exConfig);
        expect(exContext.reader).toBeNull();
        expect(exContext.slicer).toBeFunction();
    });

    it('should have a newTestExecutionContext (Worker)', () => {
        expect(newTestExecutionContext).toBeFunction();

        const exConfig = newTestExecutionConfig();
        const exContext = newTestExecutionContext('worker', exConfig);
        expect(exContext.config).toEqual(exConfig);
        expect(exContext.reader).toBeFunction();
        expect(exContext.slicer).toBeFunction();
    });

    it('should have a TestContext', () => {
        expect(TestContext).toBeTruthy();
        const context = new TestContext('test-name');
        expect(context).toHaveProperty('sysconfig');
        expect(context).toHaveProperty('apis');
        expect(context).toHaveProperty('foundation');
        expect(context.apis.foundation.getSystemEvents()).toBeInstanceOf(EventEmitter);
        expect(() => {
            context.apis.foundation.getConnection({
                endpoint: 'default',
                type: 'example',
            });
        }).toThrowError('No client was found for connection "example:default"');
        expect(context.apis.foundation.makeLogger()).toBeTruthy();
        expect(context.apis.foundation.makeLogger({ module: 'hi' })).toBeTruthy();
        expect(context.apis.foundation.makeLogger('hello')).toBeTruthy();

        const api = { there: () => 'peter' };
        expect(context.apis.registerAPI('hello', api)).toBeUndefined();
        expect(context.apis.hello.there()).toEqual('peter');
    });
});
