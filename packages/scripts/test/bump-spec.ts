import 'jest-extended';
import { cloneDeep } from '@terascope/utils';
import {
    BumpPackageOptions, BumpType, BumpPkgInfo
} from '../src/helpers/bump/interfaces.js';
import { PackageInfo } from '../src/helpers/interfaces.js';
import {
    getPackagesToBump, bumpPackagesList, getBumpCommitMessages
} from '../src/helpers/bump/utils.js';

describe('Bump Utils', () => {
    const testPackages: PackageInfo[] = [
        {
            name: 'package-main',
            version: '1.0.0',
            resolutions: {
                'package-dep-2': '^2.0.0'
            },
            dependencies: {
                'package-dep-1': '^2.0.0'
            },
            terascope: {
                main: true
            }
        } as any,
        {
            name: 'package-dep-1',
            version: '2.0.0',
            dependencies: {
                'package-util-1': '^3.0.0'
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
                'package-util-1': '^3.0.0',
                'package-util-2': '^3.0.0'
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
                            'package-dep-2': '^2.0.0'
                        },
                        dependencies: {
                            'package-dep-1': '^2.1.0'
                        },
                        terascope: {
                            main: true
                        }
                    },
                    {
                        name: 'package-dep-1',
                        version: '2.1.0',
                        dependencies: {
                            'package-util-1': '^3.1.0'
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
                            'package-util-1': '^3.1.0',
                            'package-util-2': '^3.0.0'
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
                            'package-dep-2': '^2.0.0'
                        },
                        dependencies: {
                            'package-dep-1': '^2.0.0'
                        },
                        terascope: {
                            main: true
                        }
                    },
                    {
                        name: 'package-dep-1',
                        version: '2.0.0',
                        dependencies: {
                            'package-util-1': '^3.0.1'
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
                            'package-util-1': '^3.0.1',
                            'package-util-2': '^3.0.0'
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
                        'package-dep-2': '^2.1.0-rc.0'
                    },
                    dependencies: {
                        'package-dep-1': '^2.0.0'
                    },
                    terascope: {
                        main: true
                    }
                },
                {
                    name: 'package-dep-1',
                    version: '2.0.0',
                    dependencies: {
                        'package-util-1': '^3.0.0'
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
                        'package-util-1': '^3.0.0',
                        'package-util-2': '^3.0.0'
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
