import { EventEmitter } from 'events';
import 'jest-extended'; // require for type definitions
import * as index from '../src/index';

it('should be truthy', () => {
    expect(index).toBeTruthy();
});

describe('TestContext', () => {
    it('should have a debugLogger', async () => {
        expect(index.debugLogger).toBeFunction();

        const logger = index.debugLogger('test-name');
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
        expect(index.newTestJobConfig).toBeFunction();

        const jobConfig = index.newTestJobConfig();
        expect(jobConfig).toHaveProperty('name', 'test-job');
        expect(jobConfig.operations).toBeArrayOfSize(0);
        expect(jobConfig.assets).toBeArrayOfSize(0);
    });

    it('should have a newTestExecutionConfig', () => {
        expect(index.newTestExecutionConfig).toBeFunction();

        const exConfig = index.newTestExecutionConfig();
        expect(exConfig).toHaveProperty('name', 'test-job');
        expect(exConfig.operations).toBeArrayOfSize(0);
        expect(exConfig.assets).toBeArrayOfSize(0);
    });

    it('should have a newTestSlice', () => {
        expect(index.newTestSlice).toBeFunction();

        const slice = index.newTestSlice();
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
        expect(index.newTestExecutionContext).toBeFunction();

        const exConfig = index.newTestExecutionConfig();
        const exContext = index.newTestExecutionContext(index.Assignment.ExecutionController, exConfig);
        expect(exContext.config).toEqual(exConfig);
        expect(exContext.reader).toBeNull();
        expect(exContext.slicer).toBeFunction();
    });

    it('should have a newTestExecutionContext (Worker)', () => {
        expect(index.newTestExecutionContext).toBeFunction();

        const exConfig = index.newTestExecutionConfig();
        const exContext = index.newTestExecutionContext(index.Assignment.Worker, exConfig);
        expect(exContext.config).toEqual(exConfig);
        expect(exContext.reader).toBeFunction();
        expect(exContext.slicer).toBeNull();
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
