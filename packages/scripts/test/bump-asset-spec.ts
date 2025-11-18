import 'jest-extended';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { cloneDeep } from '@terascope/core-utils';
import { BumpPkgInfo, BumpAssetOnlyOptions } from '../src/helpers/bump/interfaces';
import { PackageInfo } from '../src/helpers/interfaces';
import { bumpAssetVersion } from '../src/helpers/bump/index';
import { getBumpCommitMessages } from '../src/helpers/bump/utils';

describe('Bump-asset-only', () => {
    const tempRootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'asset'));
    const testPackages: PackageInfo[] = [
        {
            name: 'package-asset',
            version: '1.0.0',
            relativeDir: 'asset',
            dependencies: {
            },
            devDependencies: {
            },
        } as any,
        {
            name: 'package-2',
            version: '1.0.0',
            dependencies: {
                'package-1': '~2.1.0'
            },
            devDependencies: {
            },
        } as any,
        {
            name: 'package-1',
            version: '2.1.0',
            dependencies: {
            },
            devDependencies: {
            },
        } as any,
        {
            name: 'package-main-asset',
            version: '1.0.0',
            relativeDir: '.',
            dir: `${tempRootDir}`,
            dependencies: {
            },
            terascope: {
                main: true,
                root: true
            }
        } as any,
    ];

    const assetJSONData = `{
        "name": "asset-json",
        "version": "1.0.0",
        "description": "A set of processors for working with files"
    }`;
    afterAll(async () => {
        /// Remove the temp root file after all tests have been done
        fs.rmSync(tempRootDir, { recursive: true, force: true });
    });
    describe('when bumping an Asset', () => {
        describe('when release=patch', () => {
            const packages = cloneDeep(testPackages);
            const options: BumpAssetOnlyOptions = {
                release: 'patch',
            };
            let bumpAssetInfo: Record<string, BumpPkgInfo>;

            beforeAll(async () => {
                /// Create an asset folder with asset.json
                const assetPath = `${tempRootDir}/asset`;
                fs.mkdirSync(assetPath);
                fs.writeFileSync(`${assetPath}/asset.json`, assetJSONData);
            });

            afterAll(async () => {
                /// Remove the asset folder within the temp root file
                fs.rmSync(`${tempRootDir}/asset`, { recursive: true, force: true });
            });

            it('should return a list of package.json files to bump', async () => {
                bumpAssetInfo = await bumpAssetVersion(packages, options, true);
                expect(bumpAssetInfo).toEqual({
                    'package-main-asset': {
                        from: '1.0.0',
                        to: '1.0.1',
                        main: false,
                        deps: []
                    },
                    'package-asset': {
                        from: '1.0.0',
                        to: '1.0.1',
                        main: false,
                        deps: []
                    }
                });
            });

            it('should bump asset.json in temp folder', () => {
                const pathToAssetJson = `${tempRootDir}/asset/asset.json`;
                const assetJsonInfo = JSON.parse(fs.readFileSync(pathToAssetJson, 'utf8'));
                expect(assetJsonInfo.version).toEqual('1.0.1');
            });

            it('should be able to get a readable commit message', () => {
                const messages = getBumpCommitMessages(bumpAssetInfo, options.release);
                expect(messages).toEqual([
                    'bump: (patch) package-asset@1.0.1, package-main-asset@1.0.1'
                ]);
            });
        });

        describe('when release=minor', () => {
            const packages = cloneDeep(testPackages);
            const options: BumpAssetOnlyOptions = {
                release: 'minor',
            };
            let bumpAssetInfo: Record<string, BumpPkgInfo>;

            beforeAll(async () => {
                /// Create an asset folder with asset.json
                const assetPath = `${tempRootDir}/asset`;
                fs.mkdirSync(assetPath);
                fs.writeFileSync(`${assetPath}/asset.json`, assetJSONData);
            });

            afterAll(async () => {
                /// Remove the asset folder within the temp root file
                fs.rmSync(`${tempRootDir}/asset`, { recursive: true, force: true });
            });

            it('should return a list of package.json files to bump', async () => {
                bumpAssetInfo = await bumpAssetVersion(packages, options, true);
                expect(bumpAssetInfo).toEqual({
                    'package-main-asset': {
                        from: '1.0.0',
                        to: '1.1.0',
                        main: false,
                        deps: []
                    },
                    'package-asset': {
                        from: '1.0.0',
                        to: '1.1.0',
                        main: false,
                        deps: []
                    }
                });
            });

            it('should bump asset.json in temp folder', () => {
                const pathToAssetJson = `${tempRootDir}/asset/asset.json`;
                const assetJsonInfo = JSON.parse(fs.readFileSync(pathToAssetJson, 'utf8'));
                expect(assetJsonInfo.version).toEqual('1.1.0');
            });

            it('should be able to get a readable commit message', () => {
                const messages = getBumpCommitMessages(bumpAssetInfo, options.release);
                expect(messages).toEqual([
                    'bump: (minor) package-asset@1.1.0, package-main-asset@1.1.0'
                ]);
            });
        });

        describe('when release=major', () => {
            const packages = cloneDeep(testPackages);
            const options: BumpAssetOnlyOptions = {
                release: 'major',
            };
            let bumpAssetInfo: Record<string, BumpPkgInfo>;

            beforeAll(async () => {
                /// Create an asset folder with asset.json
                const assetPath = `${tempRootDir}/asset`;
                fs.mkdirSync(assetPath);
                fs.writeFileSync(`${assetPath}/asset.json`, assetJSONData);
            });

            afterAll(async () => {
                /// Remove the asset folder within the temp root file
                fs.rmSync(`${tempRootDir}/asset`, { recursive: true, force: true });
            });

            it('should return a list of package.json files to bump', async () => {
                bumpAssetInfo = await bumpAssetVersion(packages, options, true);
                expect(bumpAssetInfo).toEqual({
                    'package-main-asset': {
                        from: '1.0.0',
                        to: '2.0.0',
                        main: false,
                        deps: []
                    },
                    'package-asset': {
                        from: '1.0.0',
                        to: '2.0.0',
                        main: false,
                        deps: []
                    }
                });
            });

            it('should bump asset.json in temp folder', () => {
                const pathToAssetJson = `${tempRootDir}/asset/asset.json`;
                const assetJsonInfo = JSON.parse(fs.readFileSync(pathToAssetJson, 'utf8'));
                expect(assetJsonInfo.version).toEqual('2.0.0');
            });

            it('should be able to get a readable commit message', () => {
                const messages = getBumpCommitMessages(bumpAssetInfo, options.release);
                expect(messages).toEqual([
                    'bump: (major) package-asset@2.0.0, package-main-asset@2.0.0'
                ]);
            });
        });
    });
});
