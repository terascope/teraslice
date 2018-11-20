'use strict';

const path = require('path');

const fs = require('fs-extra');

const AssetSrc = require('../../../../cmds/assets/lib/AssetSrc');

describe('AssetSrc', () => {
    let testAsset;
    const srcDir = path.join(__dirname, '../../../fixtures/testAsset');

    beforeEach(() => {
        testAsset = new AssetSrc(srcDir);
    });

    afterEach(() => {
        testAsset = {};
    });

    test('should have srcDir and assetFile properties', () => {
        expect(testAsset.srcDir).toEqual(srcDir);
        expect(testAsset.assetFile).toEqual(
            path.join(srcDir, 'asset', 'asset.json')
        );
    });

    test('should throw in constructor when provided non-asset path', () => {
        const nonAssetDir = path.join(__dirname, '../../../fixtures');
        expect(() => new AssetSrc(nonAssetDir)).toThrow();
    });

    test('should generate correct name with zipFileName()', () => {
        expect(testAsset.zipFileName).toMatch(/testAsset-v0.0.1-node-.*.zip/);
    });

    test('->zip', async () => {
        const outFile = 'out.zip';
        const zipOutput = await AssetSrc.zip('../../../fixtures/testAsset/asset', outFile);
        // console.log(`zipOutput ${JSON.stringify(zipOutput, null, 2)}`);
        expect(zipOutput.success).toEqual('out.zip');
        fs.removeSync(outFile);
    });
});

describe('AssetSrc with build', () => {
    let testAsset;
    const srcDir = path.join(__dirname, '../../../fixtures/testAssetWithBuild');

    beforeEach(() => {
        testAsset = new AssetSrc(srcDir);
    });

    afterEach(() => {
        testAsset = {};
    });

    test('->_yarnCmd', () => {
        const yarn = testAsset._yarnCmd(path.join(testAsset.srcDir, 'asset'), ['run', 'asset:build']);
        expect(yarn.status).toEqual(0);
        expect(yarn.stdout.toString()).toInclude('$ echo');
    });
});
