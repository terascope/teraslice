'use strict';

const fs = require('fs-extra');
const path = require('path');
const { createTempDirSync } = require('jest-fixtures');
const init = require('../../cmds/asset/init');

const _testFunctions = {
    asset: true,
    processor: true,
    processor_name: 'test_good',
    asset_desc: 'this is a test',
    asset_version: '0.0.2'
};

const tmpDir = createTempDirSync();

const argv = {
    _: ['asset', 'replace'],
    baseDir: tmpDir,
    init: true,
    cluster: 'cluster.com:5678',
    c: 'cluster.com:5678',
    asset_name: 'test123'
};

describe('init', () => {
    it('should create an asset dir, asset.json, processor dir, processor/index.js', async () => {
        try {
            await init.handler(argv, _testFunctions);
        } catch (e) {
            fail(e);
        }
        const assetDir = await fs.pathExists(path.join(tmpDir, 'asset'));
        const assetJson = await fs.pathExists(path.join(tmpDir, 'asset', 'asset.json'));
        const processorDir = await fs.pathExists(path.join(tmpDir, 'asset', _testFunctions.processor_name));
        const processorIndex = await fs.pathExists(path.join(tmpDir, 'asset', _testFunctions.processor_name, 'index.js'));

        expect(assetDir).toBe(true);
        expect(assetJson).toBe(true);
        expect(processorDir).toBe(true);
        expect(processorIndex).toBe(true);
    });

    it('asset file should be correct', async () => {
        try {
            await init.handler(argv, _testFunctions);
        } catch (e) {
            fail(e);
        }
        const assetFile = await fs.readJson(path.join(tmpDir, 'asset', 'asset.json'));
        expect(assetFile.version).toBe('0.0.2');
        expect(assetFile.name).toBe('test123');
        expect(assetFile.description).toBe('this is a test');
    });

    it('should throw an error if it cannot create a asset dir', async () => {
        delete argv.baseDir;
        try {
            await init.handler(argv, _testFunctions);
        } catch (e) {
            expect(e).toBe('Could not create asset directory');
        }
    });
});
