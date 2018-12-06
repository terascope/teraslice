'use strict';

const GithubAsset = require('../../lib/github-asset');

describe('GithubAsset', () => {
    let config;
    let testAsset;

    beforeEach(() => {
        config = {
            arch: 'x64',
            assetString: 'terascope/file-assets@v2.0.0',
            nodeVersion: 'v8.12.0',
            platform: 'linux'
        };
        testAsset = new GithubAsset(config);
    });

    // FIXME: I feel like I should do something here, not sure if this is the
    // right thing.  Maybe I don't even need beforeEach, but it guarantees clean
    // starting state right?
    afterEach(() => {
        config = {};
        testAsset = {};
    });

    test('should have expected properties', () => {
        expect(testAsset).toEqual({
            arch: config.arch,
            assetString: config.assetString,
            nodeVersion: config.nodeVersion,
            platform: config.platform,
            user: 'terascope',
            name: 'file-assets',
            version: 'v2.0.0'
        });
    });

    test('should know the nodeMajorVersion', () => {
        expect(testAsset.nodeMajorVersion()).toEqual('8');
    });
});

describe('GithubAsset static methods', () => {
    test('->filterRelease', () => {
        expect(GithubAsset.filterRelease({ foo: 'foo' })).toBeTrue();
        expect(GithubAsset.filterRelease({ foo: 'foo', draft: true })).toBeFalse();
        expect(GithubAsset.filterRelease({ foo: 'foo', prerelease: true })).toBeFalse();
        expect(GithubAsset.filterRelease({ foo: 'foo', draft: true, prerelease: true })).toBeFalse();
    });

    test('->genFilterAsset', () => {
        const filter = GithubAsset.genFilterAsset('8', 'linux', 'x64');
        expect(filter({ name: 'file-asset-node-8-linux-x64.zip' })).toBeTrue();
        expect(filter({ name: 'file-asset-node-10-linux-x64.zip' })).toBeFalse();
    });
});

describe('parseAssetString', () => {
    test('should accept strings like \'terascope/file-assets\'', () => {
        expect(GithubAsset.parseAssetString('terascope/file-assets')).toEqual(
            {
                user: 'terascope',
                name: 'file-assets',
                version: undefined
            }
        );
    });

    test('should accept strings like \'terascope/file-assets@v2.0.0\'', () => {
        expect(GithubAsset.parseAssetString('terascope/file-assets@v2.0.0')).toEqual(
            {
                user: 'terascope',
                name: 'file-assets',
                version: 'v2.0.0'
            }
        );
    });

    test('should reject strings like \'r/n@v@\'', () => {
        expect(() => {
            GithubAsset.parseAssetString('r/n@v@');
        }).toThrow();
    });

    test('should reject strings like \'r/n/n2\'', () => {
        expect(() => {
            GithubAsset.parseAssetString('r/n/n2');
        }).toThrow();
    });

    test('should reject strings like \'r\'', () => {
        expect(() => {
            GithubAsset.parseAssetString('r');
        }).toThrow();
    });
});
