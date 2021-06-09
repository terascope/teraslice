import tmp from 'tmp';
import fs from 'fs-extra';
import decompress from 'decompress';
import path from 'path';
import nock from 'nock';
import GithubAsset from '../../src/helpers/github-asset';
import { GithubServer } from '../servers';

const server = new GithubServer();

describe('GithubAsset', () => {
    let config: any;
    let testAsset: any;

    beforeEach(() => {
        config = {
            arch: 'x64',
            assetString: 'terascope/file-assets@v2.0.0',
            bundle: false,
            nodeVersion: 'v8.12.0',
            platform: 'linux'
        };
        testAsset = new GithubAsset(config);
    });

    it('should have expected properties', () => {
        expect(testAsset).toEqual({
            arch: config.arch,
            assetString: config.assetString,
            bundle: false,
            nodeVersion: config.nodeVersion,
            platform: config.platform,
            user: 'terascope',
            name: 'file-assets',
            version: 'v2.0.0'
        });
    });

    it('should have bundle true if it is set', () => {
        config.bundle = true;
        testAsset = new GithubAsset(config);
        expect(testAsset.bundle).toBe(true);
    });

    it('should know the nodeMajorVersion', () => {
        expect(testAsset.nodeMajorVersion).toEqual('8');
    });

    describe('Downloading', () => {
        let tmpDir: tmp.DirResult;

        beforeEach(() => {
            server.init();
            tmpDir = tmp.dirSync({ unsafeCleanup: true });
        });

        afterEach(() => {
            nock.cleanAll();
            tmpDir.removeCallback();
        });

        it('can download assets', async () => {
            const testConfig = {
                arch: 'x64',
                assetString: 'terascope/elasticsearch-assets',
                bundle: false,
                nodeVersion: 'v10.16.3',
                platform: 'linux'
            };

            const github = new GithubAsset(testConfig);

            const assetPath = await github.download(tmpDir.name);
            const zipExists = await fs.pathExists(assetPath);

            expect(zipExists).toEqual(true);

            await decompress(assetPath, tmpDir.name);

            const jsonPath = path.join(tmpDir.name, 'testAsset/asset/asset.json');
            const { name, version } = await fs.readJSON(jsonPath);

            expect(name).toEqual('elasticsearch');
            // the zipped asset in fixtures has this version despite differences
            // in the assets release data
            expect(version).toEqual('1.0.0');
        });

        it('can download specific versions of assets', async () => {
            const testConfig = {
                arch: 'x64',
                assetString: 'terascope/elasticsearch-assets@v9.9.9',
                bundle: false,
                nodeVersion: 'v8.16.1',
                platform: 'linux'
            };

            const github = new GithubAsset(testConfig);

            const assetPath = await github.download(tmpDir.name);
            const zipExists = await fs.pathExists(assetPath);

            expect(zipExists).toEqual(true);

            await decompress(assetPath, tmpDir.name);

            const jsonPath = path.join(tmpDir.name, 'testAsset/asset/asset.json');
            const { name, version } = await fs.readJSON(jsonPath);

            expect(name).toEqual('elasticsearch-test');
            expect(version).toEqual('9.9.9');
        });

        it('can download specific versions of assets despite it being draft or prerelease', async () => {
            const testConfig = {
                arch: 'x64',
                assetString: 'terascope/elasticsearch-assets@v1.5.6',
                bundle: false,
                nodeVersion: 'v8.16.1',
                platform: 'linux'
            };

            const github = new GithubAsset(testConfig);

            const assetPath = await github.download(tmpDir.name);
            const zipExists = await fs.pathExists(assetPath);

            expect(zipExists).toEqual(true);

            await decompress(assetPath, tmpDir.name);

            const jsonPath = path.join(tmpDir.name, 'testAsset/asset/asset.json');
            const { name, version } = await fs.readJSON(jsonPath);

            expect(name).toEqual('testAsset');
            expect(version).toEqual('1.5.6');
        });
    });

    describe('GithubAsset static methods', () => {
        describe('parseAssetString', () => {
            it('should accept strings like \'terascope/file-assets\'', () => {
                expect(GithubAsset.parseAssetString('terascope/file-assets')).toEqual(
                    {
                        user: 'terascope',
                        name: 'file-assets',
                        version: undefined
                    }
                );
            });

            it('should accept strings like \'terascope/file-assets@v2.0.0\'', () => {
                expect(GithubAsset.parseAssetString('terascope/file-assets@v2.0.0')).toEqual(
                    {
                        user: 'terascope',
                        name: 'file-assets',
                        version: 'v2.0.0'
                    }
                );
            });

            it('should reject strings like \'r/n@v@\'', () => {
                expect(() => {
                    GithubAsset.parseAssetString('r/n@v@');
                }).toThrow();
            });

            it('should reject strings like \'r/n/n2\'', () => {
                expect(() => {
                    GithubAsset.parseAssetString('r/n/n2');
                }).toThrow();
            });

            it('should reject strings like \'r\'', () => {
                expect(() => {
                    GithubAsset.parseAssetString('r');
                }).toThrow();
            });
        });
    });
});
