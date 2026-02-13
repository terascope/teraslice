import 'jest-extended';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { cloneDeep } from '@terascope/core-utils';
import { BumpPackageOptions, BumpType, BumpPkgInfo } from '../src/helpers/bump/interfaces';
import { PackageInfo } from '../src/helpers/interfaces';
import { bumpAssetVersion } from '../src/helpers/bump/index';
import {
    getPackagesToBump,
    bumpPackagesList,
    getBumpCommitMessages
} from '../src/helpers/bump/utils';

describe('Bump Utils', () => {
    const testPackages: PackageInfo[] = [
        {
            name: 'package-main',
            version: '1.0.0',
            resolutions: {
                'package-dep-2': '~2.0.0'
            },
            dependencies: {
                'package-dep-1': '~2.0.0'
            },
            terascope: {
                main: true
            }
        } as any,
        {
            name: 'package-dep-1',
            version: '2.0.0',
            dependencies: {
                'package-util-1': '~3.0.0'
            },
            devDependencies: {
            },
        } as any,
        {
            name: 'package-dep-2',
            version: '2.0.0',
            dependencies: {
            },
            devDependencies: {
                'package-util-1': '~3.0.0',
                'package-util-2': '~3.0.0'
            },
        } as any,
        {
            name: 'package-util-1',
            version: '3.0.0',
            dependencies: {
            },
            devDependencies: {
            },
        } as any,
        {
            name: 'package-util-2',
            version: '3.0.0',
            dependencies: {
            },
            devDependencies: {
            },
        } as any
    ];

    describe('when bumping package-util-1', () => {
        const pkgUtil1 = testPackages.find(({ name }) => name === 'package-util-1');

        describe('when deps=true and release=minor', () => {
            const packages = cloneDeep(testPackages);
            const options: BumpPackageOptions = {
                release: 'minor',
                deps: true,
                skipReset: true,
                packages: [cloneDeep(pkgUtil1!)]
            };
            let result: Record<string, BumpPkgInfo>;

            beforeAll(async () => {
                result = await getPackagesToBump(testPackages, options);
            });

            it('should return a list of correctly bump packages', () => {
                expect(result).toEqual({
                    'package-util-1': {
                        from: '3.0.0',
                        to: '3.1.0',
                        main: false,
                        deps: [
                            {
                                type: BumpType.Prod,
                                name: 'package-dep-1'
                            },
                            {
                                type: BumpType.Dev,
                                name: 'package-dep-2'
                            }
                        ]
                    },
                    'package-dep-1': {
                        from: '2.0.0',
                        to: '2.1.0',
                        main: false,
                        deps: [
                            {
                                type: BumpType.Prod,
                                name: 'package-main'
                            },
                        ]
                    },
                });
            });

            it('should corrently bump the packages list', () => {
                bumpPackagesList(result, packages);
                expect(packages).toEqual([
                    {
                        name: 'package-main',
                        version: '1.0.0',
                        resolutions: {
                            'package-dep-2': '~2.0.0'
                        },
                        dependencies: {
                            'package-dep-1': '~2.0.0'
                        },
                        terascope: {
                            main: true
                        }
                    },
                    {
                        name: 'package-dep-1',
                        version: '2.1.0',
                        dependencies: {
                            'package-util-1': '~3.0.0'
                        },
                        devDependencies: {
                        },
                    },
                    {
                        name: 'package-dep-2',
                        version: '2.0.0',
                        dependencies: {
                        },
                        devDependencies: {
                            'package-util-1': '~3.0.0',
                            'package-util-2': '~3.0.0'
                        },
                    },
                    {
                        name: 'package-util-1',
                        version: '3.1.0',
                        dependencies: {
                        },
                        devDependencies: {
                        },
                    },
                    {
                        name: 'package-util-2',
                        version: '3.0.0',
                        dependencies: {
                        },
                        devDependencies: {
                        },
                    }
                ]);
            });

            it('should be able to get a readable commit message', () => {
                const messages = getBumpCommitMessages(result, options.release);
                expect(messages).toEqual([
                    'bump: (minor) package-util-1@3.1.0, package-dep-1@2.1.0'
                ]);
            });
        });

        describe('when deps=false and release=patch', () => {
            const packages = cloneDeep(testPackages);
            const options: BumpPackageOptions = {
                release: 'patch',
                deps: false,
                skipReset: true,
                packages: [cloneDeep(pkgUtil1!)]
            };
            let result: Record<string, BumpPkgInfo>;

            beforeAll(async () => {
                result = await getPackagesToBump(testPackages, options);
            });

            it('should return a list of correctly bump packages', () => {
                expect(result).toEqual({
                    'package-util-1': {
                        from: '3.0.0',
                        to: '3.0.1',
                        main: false,
                        deps: [
                            {
                                type: BumpType.Prod,
                                name: 'package-dep-1'
                            },
                            {
                                type: BumpType.Dev,
                                name: 'package-dep-2'
                            },
                        ]
                    },
                });
            });

            it('should corrently bump the packages list', () => {
                bumpPackagesList(result, packages);
                expect(packages).toEqual([
                    {
                        name: 'package-main',
                        version: '1.0.0',
                        resolutions: {
                            'package-dep-2': '~2.0.0'
                        },
                        dependencies: {
                            'package-dep-1': '~2.0.0'
                        },
                        terascope: {
                            main: true
                        }
                    },
                    {
                        name: 'package-dep-1',
                        version: '2.0.0',
                        dependencies: {
                            'package-util-1': '~3.0.0'
                        },
                        devDependencies: {
                        },
                    },
                    {
                        name: 'package-dep-2',
                        version: '2.0.0',
                        dependencies: {
                        },
                        devDependencies: {
                            'package-util-1': '~3.0.0',
                            'package-util-2': '~3.0.0'
                        },
                    },
                    {
                        name: 'package-util-1',
                        version: '3.0.1',
                        dependencies: {
                        },
                        devDependencies: {
                        },
                    },
                    {
                        name: 'package-util-2',
                        version: '3.0.0',
                        dependencies: {
                        },
                        devDependencies: {
                        },
                    }
                ]);
            });

            it('should be able to get a readable commit message', () => {
                const messages = getBumpCommitMessages(result, options.release);
                expect(messages).toEqual([
                    'bump: (patch) package-util-1@3.0.1'
                ]);
            });
        });
    });

    describe('when bumping package-main and package-dep-2', () => {
        const pkgMain = testPackages.find(({ name }) => name === 'package-main');
        const pkgDep2 = testPackages.find(({ name }) => name === 'package-dep-2');

        const packages = cloneDeep(testPackages);
        const options: BumpPackageOptions = {
            release: 'preminor',
            preId: 'rc',
            deps: true,
            skipReset: true,
            packages: [cloneDeep(pkgMain!), cloneDeep(pkgDep2!)]
        };
        let result: Record<string, BumpPkgInfo>;

        beforeAll(async () => {
            result = await getPackagesToBump(testPackages, options);
        });

        it('should return a list of correctly bump packages', () => {
            expect(result).toEqual({
                'package-main': {
                    from: '1.0.0',
                    to: '1.1.0-rc.0',
                    main: true,
                    deps: []
                },
                'package-dep-2': {
                    from: '2.0.0',
                    to: '2.1.0-rc.0',
                    main: false,
                    deps: [
                        {
                            type: BumpType.Resolution,
                            name: 'package-main'
                        }
                    ]
                },
            });
        });

        it('should corrently bump the packages list', () => {
            bumpPackagesList(result, packages);
            expect(packages).toEqual([
                {
                    name: 'package-main',
                    version: '1.1.0-rc.0',
                    resolutions: {
                        'package-dep-2': '~2.0.0'
                    },
                    dependencies: {
                        'package-dep-1': '~2.0.0'
                    },
                    terascope: {
                        main: true
                    }
                },
                {
                    name: 'package-dep-1',
                    version: '2.0.0',
                    dependencies: {
                        'package-util-1': '~3.0.0'
                    },
                    devDependencies: {
                    },
                },
                {
                    name: 'package-dep-2',
                    version: '2.1.0-rc.0',
                    dependencies: {
                    },
                    devDependencies: {
                        'package-util-1': '~3.0.0',
                        'package-util-2': '~3.0.0'
                    },
                },
                {
                    name: 'package-util-1',
                    version: '3.0.0',
                    dependencies: {
                    },
                    devDependencies: {
                    },
                },
                {
                    name: 'package-util-2',
                    version: '3.0.0',
                    dependencies: {
                    },
                    devDependencies: {
                    },
                }
            ]);
        });

        it('should be able to get a readable commit message', () => {
            const messages = getBumpCommitMessages(result, options.release);
            expect(messages).toEqual([
                'release: (preminor) package-main@1.1.0-rc.0',
                'bump: (preminor) package-dep-2@2.1.0-rc.0'
            ]);
        });
    });
});

/// Testing bump when running in Asset Mode

describe('Bump Assets', () => {
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
    describe('when bumping package-1', () => {
        const pkg1 = testPackages.find(({ name }) => name === 'package-1');

        describe('when release=patch and deps=true', () => {
            const packages = cloneDeep(testPackages);
            const options: BumpPackageOptions = {
                release: 'patch',
                deps: true,
                skipReset: true,
                packages: [cloneDeep(pkg1!)]
            };
            let result: Record<string, BumpPkgInfo>;
            let assetPackages: Record<string, BumpPkgInfo>;

            beforeAll(async () => {
                result = await getPackagesToBump(testPackages, options);
                /// Create an asset folder with asset.json
                const assetPath = `${tempRootDir}/asset`;
                await fs.promises.mkdir(assetPath);
                await fs.promises.writeFile(`${assetPath}/asset.json`, assetJSONData);
            });

            afterAll(async () => {
                /// Remove the asset folder within the temp root file
                await fs.promises.rm(`${tempRootDir}/asset`, { recursive: true, force: true });
            });

            it('should return a list of correctly bump packages', () => {
                expect(result).toEqual({
                    'package-1': {
                        from: '2.1.0',
                        to: '2.1.1',
                        main: false,
                        deps: [
                            {
                                type: BumpType.Prod,
                                name: 'package-2'
                            },
                        ]
                    },
                    'package-2': {
                        from: '1.0.0',
                        to: '1.0.1',
                        main: false,
                        deps: []
                    }
                });
            });

            it('should correctly bump the packages list', () => {
                bumpPackagesList(result, packages);
                expect(packages).toEqual([
                    {
                        name: 'package-asset',
                        version: '1.0.0',
                        relativeDir: 'asset',
                        dependencies: {
                        },
                        devDependencies: {
                        }
                    },
                    {
                        name: 'package-2',
                        version: '1.0.1',
                        dependencies: {
                            'package-1': '~2.1.0'
                        },
                        devDependencies: {
                        },
                    },
                    {
                        name: 'package-1',
                        version: '2.1.1',
                        dependencies: {
                        },
                        devDependencies: {
                        },
                    },
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
                    },
                ]);
            });

            it('should return a list with all packages including assets bump', async () => {
                assetPackages = await bumpAssetVersion(packages, options, true);
                const allBumps = { ...result, ...assetPackages };
                expect(allBumps).toEqual({
                    'package-1': {
                        from: '2.1.0',
                        to: '2.1.1',
                        main: false,
                        deps: [
                            {
                                type: BumpType.Prod,
                                name: 'package-2'
                            },
                        ]
                    },
                    'package-2': {
                        from: '1.0.0',
                        to: '1.0.1',
                        main: false,
                        deps: []
                    },
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
                const allBumps = { ...result, ...assetPackages };
                const messages = getBumpCommitMessages(allBumps, options.release);
                expect(messages).toEqual([
                    'bump: (patch) package-1@2.1.1, package-2@1.0.1',
                    'bump: (patch) package-asset@1.0.1, package-main-asset@1.0.1'
                ]);
            });
        });
    });
});
