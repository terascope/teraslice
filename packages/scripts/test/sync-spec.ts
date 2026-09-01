import 'jest-extended';
import { PackageInfo } from '../src/helpers/interfaces.js';
import { syncVersions } from '../src/helpers/sync/utils.js';
import { getRootInfo } from '../src/helpers/misc.js';

describe('Sync Helpers', () => {
    describe('->syncVersions', () => {
        describe('when packages reference internal and external dependencies', () => {
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

            it('should leave external deps untouched but still fix the **/ rename', () => {
                // external versions are now managed by the pnpm catalog, so
                // they are left as-is; only the `**/ex-1` -> `ex-1` rename applies
                const pkg = packages.find(({ name }) => name === 'package-1');
                expect(pkg).toEqual({
                    name: 'package-1',
                    version: '1.0.0',
                    resolutions: {
                        'other-1': '~1.0.0',
                        'ex-1': '~0.3.3'
                    },
                    dependencies: {
                        'ex-1': '~0.2.0',
                        'fixed-1': 'not-semver-reference',
                    }
                });
            });

            it('should convert internal deps to the workspace protocol and leave external deps alone', () => {
                const pkg = packages.find(({ name }) => name === 'package-2');
                expect(pkg).toEqual({
                    name: 'package-2',
                    version: '2.0.0',
                    dependencies: {
                        'ex-1': '~0.1.0',
                        'package-1': 'workspace:~',
                        'ex-3': '~4.4.4',
                        'star-1': '*',
                    },
                    peerDependencies: {
                        'ex-2': '~1.0.0',
                        'ex-3': '~5.0.0-beta.2',
                    },
                });
            });

            it('should convert internal deps in every dependency type', () => {
                const pkg = packages.find(({ name }) => name === 'package-3');
                expect(pkg).toEqual({
                    name: 'package-3',
                    version: '3.0.0',
                    dependencies: {
                        'package-1': 'workspace:~',
                        'ex-2': '~2.0.0'
                    },
                    devDependencies: {
                        'ex-1': '~3.0.0',
                        'package-2': 'workspace:~',
                        'ex-3': '~5.5.5-beta.3',
                    }
                });
            });
        });
    });
});
