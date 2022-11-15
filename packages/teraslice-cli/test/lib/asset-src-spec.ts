import 'jest-extended';
import path from 'path';
import fs from 'fs-extra';
import tmp from 'tmp';
import { fileURLToPath } from 'url';
import { AssetSrc } from '../../src/helpers/asset-src.js';

const dirPath = fileURLToPath(new URL('.', import.meta.url));

describe('Assetsrc/index.js', () => {
    let testAsset: AssetSrc;
    const srcDir = path.join(dirPath, '../fixtures/testAsset');

    beforeEach(() => {
        testAsset = new AssetSrc(srcDir);
    });

    test('should have srcDir and assetFile properties', () => {
        expect(testAsset.srcDir).toEqual(srcDir);
        expect(testAsset.assetFile).toEqual(
            path.join(srcDir, 'asset', 'asset.json')
        );
        expect(testAsset.name).toEqual('testAsset');
        expect(testAsset.version).toEqual('0.0.1');
    });

    test('should throw in constructor when provided non-asset path', () => {
        const nonAssetDir = path.join(dirPath, '../fixtures');
        expect(() => new AssetSrc(nonAssetDir)).toThrow();
    });

    test('should generate correct name with zipFileName()', () => {
        expect(testAsset.zipFileName).toMatch(/testAsset-v0.0.1-node-.*.zip/);
    });

    test('build', async () => {
        const r = await testAsset.build();
        try {
            expect(r.name).toEndWith('.zip');
        } finally {
            await fs.remove(r.name);
        }
    });

    test('#zip', async () => {
        const tmpDir = tmp.dirSync();
        const outFile = path.join(tmpDir.name, 'out.zip');
        try {
            const zipOutput = await AssetSrc.zip(path.join(dirPath, '..', 'fixtures', 'testAsset', 'asset'), outFile);
            expect(zipOutput.name).toEqual(outFile);
        } finally {
            await fs.remove(tmpDir.name);
        }
    });
});

describe('AssetSrc with build', () => {
    let testAsset: any;
    const srcDir = path.join(dirPath, '../fixtures/testAssetWithBuild');

    beforeEach(() => {
        testAsset = new AssetSrc(srcDir);
    });

    afterEach(() => {
        testAsset = {};
    });

    test('->_yarnCmd', async () => {
        const yarn = await testAsset._yarnCmd(
            path.join(testAsset.srcDir, 'asset'), ['run', 'asset:build']
        );
        expect(yarn.exitCode).toEqual(0);
        expect(yarn.stdout.toString()).toInclude('$ echo');
    });
});

describe('AssetSrc generateRegistry', () => {
    let testAsset: any;
    const srcDir = path.join(dirPath, '../fixtures/testAsset');

    beforeEach(() => {
        testAsset = new AssetSrc(srcDir);
    });

    test('-> registry object', async () => {
        const registry = await testAsset.generateRegistry();

        expect(registry).toEqual({
            proc: {
                Processor: 'processor.js',
                Schema: 'schema.js',
                Slicer: 'slicer.js'
            },
            proc2: {
                API: 'api.js',
                Schema: 'schema.js',
                Fetcher: 'fetcher.js'
            }
        });
    });
});
