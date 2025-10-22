import 'jest-extended';
import { AnyObject } from '@terascope/core-utils';
import {
    ExecutionContextAPI, newTestExecutionConfig, TestContext,
    APIFactoryRegistry
} from '../../src/index.js';
import FactoryAPITest from '../fixtures/asset/api-factory/api.js';

type API = APIFactoryRegistry<AnyObject, AnyObject>;

describe('APIFactory', () => {
    const apiName = 'FactoryAPITest';
    let context: TestContext;

    beforeEach(() => {
        context = new TestContext('teraslice-operations');
        const exConfig = newTestExecutionConfig();

        exConfig.operations.push({
            _op: 'noop',
        });

        const exContextApi = new ExecutionContextAPI(context, exConfig);
        exContextApi.addToRegistry(apiName, FactoryAPITest);

        context.apis.registerAPI('executionContext', exContextApi);
    });

    it('should be able to be created', async () => {
        const api: API = await context.apis.executionContext.initAPI(apiName);

        expect(api.size).toEqual(0);
        expect(api.get).toBeFunction();
        expect(api.create).toBeFunction();
        expect(api.remove).toBeFunction();
        expect(api.entries).toBeFunction();
        expect(api.keys).toBeFunction();
        expect(api.values).toBeFunction();
    });

    it('can cache values', async () => {
        const expectedData = { name: 'test', config: { some: 'config' } };
        const api: API = await context.apis.executionContext.initAPI(apiName);

        expect(api.size).toEqual(0);
        expect(api.get('test')).toBeUndefined();

        const results = await api.create('test', { some: 'config' });
        expect(results).toMatchObject(expectedData);

        expect(api.size).toEqual(1);
        expect(api.get('test')).toMatchObject(expectedData);

        await api.remove('test');

        expect(api.size).toEqual(0);
        expect(api.get('test')).toBeUndefined();
    });

    it('can get the same cached instance', async () => {
        const expectedData = { name: 'test', config: { some: 'config' } };
        const api: API = await context.apis.executionContext.initAPI(apiName);

        expect(api.size).toEqual(0);
        expect(api.get('test')).toBeUndefined();

        const results = await api.create('test', { some: 'config' });
        expect(results).toMatchObject(expectedData);
        expect(api.size).toEqual(1);

        const secondApi: API = await context.apis.executionContext.getAPI(apiName);

        expect(secondApi.size).toEqual(1);
        expect(secondApi.get('test')).toMatchObject(expectedData);
    });

    it('can call enumerable methods', async () => {
        const expectedData = { name: 'test', config: { some: 'config' } };
        const api: API = await context.apis.executionContext.initAPI(apiName);

        expect(api.size).toEqual(0);
        expect(api.get('test')).toBeUndefined();

        const results = await api.create('test', { some: 'config' });
        expect(results).toMatchObject(expectedData);

        expect(api.size).toEqual(1);
        expect(api.get('test')).toMatchObject(expectedData);

        const keys: string[] = [];

        for (const key of api.keys()) {
            keys.push(key);
        }

        expect(keys).toBeArrayOfSize(1);
        expect(keys[0]).toEqual('test');

        const values: AnyObject[] = [];

        for (const value of api.values()) {
            values.push(value);
        }

        expect(values).toBeArrayOfSize(1);
        expect(values[0]).toEqual(expectedData);

        const entries: [string, AnyObject][] = [];

        for (const entry of api.entries()) {
            entries.push(entry);
        }

        expect(entries).toBeArrayOfSize(1);
        expect(entries[0]).toEqual(['test', expectedData]);
    });
});
