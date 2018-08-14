'use strict';

import * as fs from 'fs-extra';
import * as path from 'path';
import { OperationLoader } from '../src';
import { JobConfig, TestContext, testJobConfig } from '@terascope/teraslice-types';

describe('OperationLoader', () => {
    const assetId = '1234';
    const testDir = path.join(__dirname, 'op_test');
    const assetPath = path.join(testDir, assetId);
    const terasliceOpPath = path.join(__dirname, '../../teraslice/lib');
    const processorPath = path.join(terasliceOpPath, 'processors/noop.js');
    const context = new TestContext('teraslice-op-loader');

    beforeAll(async () => {
        await fs.ensureDir(testDir);
        await fs.copy(processorPath, path.join(assetPath, 'noop.js'));
    });

    afterAll(() => fs.remove(testDir));

    it('can instantiate', () => {
        let opLoader;

        expect(() => {
            opLoader = new OperationLoader({
                terasliceOpPath,
                opPath: '',
            });
        }).not.toThrowError();

        expect(typeof opLoader).toEqual('object');
        expect(opLoader.load).toBeDefined();
        expect(typeof opLoader.load).toEqual('function');
    });

    it('can load an operation', () => {
        const opLoader = new OperationLoader({
            terasliceOpPath,
            opPath: '',
        });
        const results = opLoader.load('noop');

        expect(results).toBeDefined();
        expect(typeof results).toEqual('object');
        expect(results.newProcessor).toBeDefined();
        expect(results.schema).toBeDefined();
        expect(typeof results.newProcessor).toEqual('function');
        expect(typeof results.schema).toEqual('function');

        const opSchema = results.schema();
        expect(opSchema).toBeDefined();
        expect(typeof opSchema).toEqual('object');

        const processor = results.newProcessor(context, testJobConfig, { _op: 'noop' });

        expect(processor).toBeDefined();
        expect(typeof processor).toEqual('function');

        const someData = 'someData';
        const processorResults = processor(someData);
        expect(processorResults).toEqual(someData);
    });

    it('can throw proper errors if op code does not exits', () => {
        const opLoader = new OperationLoader({
            terasliceOpPath,
            opPath: '',
        });

        expect(() => {
            opLoader.load('someOp');
        }).toThrowError();
    });

    it('can load asset ops', () => {
        const opLoader = new OperationLoader({
            terasliceOpPath,
            opPath: '',
            assetPath: testDir,
        });

        let results;

        expect(() => {
            results = opLoader.load('noop', [assetId]);
        }).not.toThrowError();

        expect(results).toBeDefined();
        expect(typeof results).toEqual('object');
        expect(results.newProcessor).toBeDefined();
        expect(results.schema).toBeDefined();
        expect(typeof results.newProcessor).toEqual('function');
        expect(typeof results.schema).toEqual('function');

        const opSchema = results.schema();
        expect(opSchema).toBeDefined();
        expect(typeof opSchema).toEqual('object');

        const processor = results.newProcessor();

        expect(processor).toBeDefined();
        expect(typeof processor).toEqual('function');

        const someData = 'someData';
        const processorResults = processor(someData);
        expect(processorResults).toEqual(someData);
    });
});
