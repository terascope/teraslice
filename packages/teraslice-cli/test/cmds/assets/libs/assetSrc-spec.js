'use strict';

const path = require('path');

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

    test('->runAssetBuild', () => {
        expect(testAsset.runAssetBuild(srcDir)).toEqual({});
    });
});

describe('AssetSrc with build', () => {
    let testAsset;
    const srcDir = path.join(__dirname, '../../../fixtures/testAssetWithBuild');

    test('->runAssetBuild', () => {
        testAsset = new AssetSrc(srcDir);
        const runReturnObj = testAsset.runAssetBuild(srcDir);
        expect(runReturnObj).toBeObject();
        expect(runReturnObj.status).toEqual(0);
        expect(runReturnObj.stdout.toString()).toEqual('$ echo foo\nfoo\n');
    });
});
