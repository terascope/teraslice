import 'jest-extended';
import { cloneDeep } from '@terascope/utils';
import { BumpPackageOptions, BumpType } from '../src/helpers/bump/interfaces';
import { PackageInfo } from '../src/helpers/interfaces';
import {
    getPackagesToBump
} from '../src/helpers/bump/utils';

describe('Bump Utils', () => {
    const packages: PackageInfo[] = [
        {
            name: 'package-main',
            version: '1.0.0',
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

    describe('getPackagesToBump', () => {
        describe('when bumping package-util-1', () => {
            const pkgUtil1 = packages.find(({ name }) => name === 'package-util-1');

            describe('when deps=true and release=minor', () => {
                const options: BumpPackageOptions = {
                    release: 'minor',
                    deps: true,
                    packages: [cloneDeep(pkgUtil1!)]
                };

                it('should return an array of packages', () => {
                    const result = getPackagesToBump(cloneDeep(packages), options);

                    expect(result).toEqual({
                        'package-util-1': {
                            from: '3.0.0',
                            to: '3.1.0',
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
                            deps: [
                                {
                                    type: BumpType.Prod,
                                    name: 'package-main'
                                },
                            ]
                        },
                    });
                });
            });
        });
    });
});
