import 'jest-extended';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'fs-extra';
import tmp from 'tmp';
import { AssetSrc } from '../../src/helpers/asset-src.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('AssetSrc', () => {
    const srcDir = path.join(__dirname, '../fixtures/testAsset');
    const buildAssetDir = path.join(__dirname, '../fixtures/testAssetWithBuild');

    it('should have srcDir and assetFile properties', () => {
        const testAsset = new AssetSrc(buildAssetDir);

        expect(testAsset.srcDir).toEqual(buildAssetDir);
        expect(testAsset.assetFile).toEqual(
            path.join(buildAssetDir, 'asset', 'asset.json')
        );
        expect(testAsset.name).toEqual('testAssetWithBuild');
        expect(testAsset.version).toEqual('0.0.1');
    });

    it('should throw in constructor when provided non-asset path', () => {
        const nonAssetDir = path.join(__dirname, '../fixtures');
        expect(() => new AssetSrc(nonAssetDir)).toThrow();
    });

    it('should generate correct name with zipFileName()', () => {
        const testAsset = new AssetSrc(buildAssetDir);
        expect(testAsset.zipFileName).toMatch(/testAssetWithBuild-v0.0.1-node-.*.zip/);
    });

    it('build', async () => {
        const testAsset = new AssetSrc(buildAssetDir);
        const r = await testAsset.build();

        try {
            expect(r.name).toEndWith('.zip');
        } finally {
            await fs.remove(r.name);
        }
    });

    it('#zip', async () => {
        const tmpDir = tmp.dirSync();
        const outFile = path.join(tmpDir.name, 'out.zip');
        try {
            const zipOutput = await AssetSrc.zip(path.join(__dirname, '..', 'fixtures', 'testAsset', 'asset'), outFile);
            expect(zipOutput.name).toEqual(outFile);
        } finally {
            await fs.remove(tmpDir.name);
        }
    });

    it('can call generateRegistry for older assets', async () => {
        const oldTestAsset = new AssetSrc(srcDir);
        const registry = await oldTestAsset.generateRegistry();

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

    it('can call the assets build script call', async () => {
        const buildTestAsset = new AssetSrc(buildAssetDir);
        // @ts-expect-error
        const yarn = await buildTestAsset._yarnCmd(
            path.join(buildTestAsset.srcDir, 'asset'), ['run', 'asset:build']
        );
        expect(yarn.exitCode).toEqual(0);
        expect(yarn.stdout.toString()).toInclude('$ echo');
    });

    it('bundle must be set to true', async () => {
        expect.hasAssertions();

        const devMode = false;
        const debug = false;
        const bundle = false;
        const bundleTarget = 'node18';
        const overwrite = false;

        try {
            new AssetSrc(
                buildAssetDir, devMode, debug, bundle, bundleTarget, overwrite
            );
            throw new Error('should have errored');
        } catch (err) {
            expect(err.message).toContain('bundle must be set to true');
        }
    });

    it('can build a node 18 bundle', async () => {
        expect.hasAssertions();

        const devMode = false;
        const debug = false;
        const bundle = true;
        const bundleTarget = 'node18';
        const overwrite = false;

        const myTestAsset = new AssetSrc(
            buildAssetDir, devMode, debug, bundle, bundleTarget, overwrite
        );

        let resp: any;

        try {
            resp = await myTestAsset.build();
            expect(resp.name).toContain('node-18');
        } finally {
            if (resp) {
                await fs.remove(resp.name);
            }
        }
    });
});
