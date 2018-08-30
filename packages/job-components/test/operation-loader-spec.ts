'use strict';

import { LegacyProcessor, LegacyReader, newTestJobConfig, TestContext } from '@terascope/teraslice-types';
import fse from 'fs-extra';
import 'jest-extended'; // require for type definitions
import path from 'path';
import { OperationLoader } from '../src';

describe('OperationLoader', () => {
    const assetId = '1234';
    const testDir = path.join(__dirname, 'op_test');
    const assetPath = path.join(testDir, assetId);
    const terasliceOpPath = path.join(__dirname, '../../teraslice/lib');
    const processorPath = path.join(terasliceOpPath, 'processors/noop.js');
    const context = new TestContext('teraslice-op-loader');

    beforeAll(async () => {
        await fse.ensureDir(testDir);
        await fse.copy(processorPath, path.join(assetPath, 'noop.js'));
    });

    afterAll(() => fse.remove(testDir));

    it('can instantiate', () => {
        const opLoader = new OperationLoader({
            terasliceOpPath,
        });

        expect(typeof opLoader).toEqual('object');
        expect(opLoader.load).toBeDefined();
        expect(typeof opLoader.load).toEqual('function');
    });

    it('can load an operation', () => {
        const opLoader = new OperationLoader({
            terasliceOpPath,
        });
        const results = opLoader.load('noop') as LegacyProcessor;

        expect(results).toBeDefined();
        expect(typeof results).toEqual('object');
        expect(results.newProcessor).toBeDefined();
        expect(results.schema).toBeDefined();
        expect(typeof results.newProcessor).toEqual('function');
        expect(typeof results.schema).toEqual('function');

        const opSchema = results.schema();
        expect(opSchema).toBeDefined();
        expect(typeof opSchema).toEqual('object');

        const jobConfig = newTestJobConfig();
        const processor = results.newProcessor(context, { _op: 'noop' }, jobConfig);

        expect(processor).toBeDefined();
        expect(typeof processor).toEqual('function');

        const someData = 'someData';
        const processorResults = processor(someData);
        expect(processorResults).toEqual(someData);
    });

    it('can load by file path', () => {
        const opLoader = new OperationLoader({
            terasliceOpPath,
        });
        const op = opLoader.load(path.join(__dirname, 'fixtures', 'test-op')) as LegacyProcessor;

        expect(op).toBeDefined();
        expect(typeof op).toEqual('object');
        expect(op.newProcessor).toBeDefined();
        expect(op.schema).toBeDefined();
        expect(typeof op.newProcessor).toEqual('function');
        expect(typeof op.schema).toEqual('function');

        const reader = opLoader.load(path.join(__dirname, 'fixtures', 'test-reader')) as LegacyReader;

        expect(reader).toBeDefined();
        expect(typeof reader).toEqual('object');
        expect(reader.newReader).toBeDefined();
        expect(reader.schema).toBeDefined();
        expect(typeof reader.newReader).toEqual('function');
        expect(typeof reader.schema).toEqual('function');
    });

    it('can throw proper errors if op code does not exits', () => {
        const opLoader = new OperationLoader({
            terasliceOpPath,
        });

        expect(() => {
            opLoader.load('someOp');
        }).toThrowError();
    });

    it('can load asset ops', () => {
        const opLoader = new OperationLoader({
            terasliceOpPath,
            assetPath: testDir,
        });

        const results = opLoader.load('noop', [assetId]) as LegacyProcessor;

        expect(results).toBeDefined();
        expect(typeof results).toEqual('object');
        expect(results.newProcessor).toBeDefined();
        expect(results.schema).toBeDefined();
        expect(typeof results.newProcessor).toEqual('function');
        expect(typeof results.schema).toEqual('function');

        const opSchema = results.schema();
        expect(opSchema).toBeDefined();
        expect(typeof opSchema).toEqual('object');

        const processor = results.newProcessor(context, { _op: 'hello' }, newTestJobConfig());

        expect(processor).toBeDefined();
        expect(typeof processor).toEqual('function');

        const someData = 'someData';
        const processorResults = processor(someData);
        expect(processorResults).toEqual(someData);
    });
});
