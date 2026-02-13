import 'jest-extended';
import { PackageInfo } from '../src/helpers/interfaces';
import { syncVersions } from '../src/helpers/sync/utils';
import { getRootInfo } from '../src/helpers/misc';

describe('Sync Helpers', () => {
    describe('->syncVersions', () => {
        describe('when the dependencies are out of sync', () => {
            let packages: PackageInfo[];
            beforeAll(() => {
                packages = [
                    {
                        name: 'package-1',
                        version: '1.0.0',
                        resolutions: {
                            'other-1': '~1.0.0',
                            '**/ex-1': '~0.3.3'
                        },
                        dependencies: {
                            'ex-1': '~0.2.0',
                            'fixed-1': 'not-semver-reference',
                        }
                    } as any,
                    {
                        name: 'package-2',
                        version: '2.0.0',
                        dependencies: {
                            'ex-1': '~0.1.0',
                            'package-1': '~1.0.1',
                            'ex-3': '~4.4.4',
                            'star-1': '*',
                        },
                        peerDependencies: {
                            'ex-2': '~1.0.0',
                            'ex-3': '~5.0.0-beta.2'
                        },
                    } as any,
                    {
                        name: 'package-3',
                        version: '3.0.0',
                        dependencies: {
                            'package-1': '~0.1.0',
                            'ex-2': '~2.0.0'
                        },
                        devDependencies: {
                            'ex-1': '~3.0.0',
                            'package-2': '~2.1.0',
                            'ex-3': '~5.5.5-beta.3',
                        },
                    } as any
                ];
                syncVersions(packages, getRootInfo());
            });

            it('should return 3 packages', () => {
                expect(packages).toBeArrayOfSize(3);
            });

            it('should correctly update package-1', () => {
                const pkg = packages.find(({ name }) => name === 'package-1');
                expect(pkg).toEqual({
                    name: 'package-1',
                    version: '1.0.0',
                    resolutions: {
                        'other-1': '~1.0.0',
                        'ex-1': '~3.0.0'
                    },
                    dependencies: {
                        'ex-1': '~3.0.0',
                        'fixed-1': 'not-semver-reference',
                    }
                });
            });

            it('should correctly update package-2', () => {
                const pkg = packages.find(({ name }) => name === 'package-2');
                expect(pkg).toEqual({
                    name: 'package-2',
                    version: '2.0.0',
                    dependencies: {
                        'ex-1': '~3.0.0',
                        'package-1': 'workspace:*',
                        'ex-3': '~5.5.5-beta.3',
                        'star-1': '*',
                    },
                    peerDependencies: {
                        'ex-2': '~2.0.0',
                        'ex-3': '~5.5.5-beta.3',
                    },
                });
            });

            it('should correctly update package-3', () => {
                const pkg = packages.find(({ name }) => name === 'package-3');
                expect(pkg).toEqual({
                    name: 'package-3',
                    version: '3.0.0',
                    dependencies: {
                        'package-1': 'workspace:*',
                        'ex-2': '~2.0.0'
                    },
                    devDependencies: {
                        'ex-1': '~3.0.0',
                        'package-2': 'workspace:*',
                        'ex-3': '~5.5.5-beta.3',
                    }
                });
            });
        });
    });
});
