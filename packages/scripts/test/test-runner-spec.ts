import 'jest-extended';
import { listPackages } from '../src/helpers/packages';
import { filterBySuite, groupByFrameworkSuite } from '../src/helpers/test-runner/utils';
import { PackageInfo } from '../src/helpers/interfaces';
import { getAvailableTestSuites } from '../src/helpers/misc';
import { TestOptions } from '../src/helpers/test-runner/interfaces';

describe('Test Runner Helpers', () => {
    const availableSuites = getAvailableTestSuites();
    const packages = listPackages();

    const defaultsOptions: TestOptions = {
        bail: false,
        debug: false,
        watch: false,
        trace: false,
        all: true,
        keepOpen: false,
        reportCoverage: false,
        useExistingServices: false,
        ignoreMount: true,
        clusteringType: 'native',
        kindClusterName: 'default',
        skipImageDeletion: false,
        logs: false
    };

    function makeTestOptions(input: Partial<TestOptions>): TestOptions {
        return Object.assign({}, defaultsOptions, input);
    }

    describe('->filterBySuite', () => {
        it('should be able to filter by a suite', () => {
            const options = makeTestOptions({
                all: false,
                suite: ['unit'],
            });
            const filtered = filterBySuite(packages, options);
            const suites = filtered.map((pkgInfo) => pkgInfo.terascope.testSuite);

            expect(suites).not.toContain('e2e');
            expect(suites).not.toContain('opensearch');
            expect(suites).not.toContain('disabled');
            expect(suites).not.toContain('kafka');
        });

        it('should be able to filter by a suite opensearch', () => {
            const options = makeTestOptions({
                all: false,
                suite: ['opensearch'],
            });

            const filtered = filterBySuite(packages, options);
            const suites = filtered.map((pkgInfo) => pkgInfo.terascope.testSuite);

            expect(suites).not.toContain('e2e');
            expect(suites).not.toContain('unit');
            expect(suites).not.toContain('disabled');
            expect(suites).not.toContain('kafka');
        });
    });

    describe('->groupBySuite', () => {
        describe('when running all tests', () => {
            it('should be able to group by suite', () => {
                const opts = { all: true } as TestOptions;
                const grouped = groupByFrameworkSuite(packages, availableSuites, opts).jest;

                expect(grouped).toBeDefined();

                for (const [suite, group] of Object.entries(grouped!)) {
                    const filtered = filterBySuite(packages, makeTestOptions({
                        all: false,
                        suite: [suite],
                    }));

                    expect(mapInfo(group)).toEqual(mapInfo(filtered));
                }
            });
        });

        describe('when running all tests in watch mode', () => {
            it('should be able group opensearch and unit together', () => {
                const cacheTests = filterBySuite(packages, makeTestOptions({
                    all: true,
                    suite: ['cache']
                }));

                const elasticsearchTests = filterBySuite(packages, makeTestOptions({
                    all: true,
                    suite: ['opensearch'],
                }));

                const opensearchTests = filterBySuite(packages, makeTestOptions({
                    all: true,
                    suite: ['search'],
                }));

                const restrainedTests = filterBySuite(packages, makeTestOptions({
                    all: true,
                    suite: ['restrained'],
                }));

                const unitTests = filterBySuite(packages, makeTestOptions({
                    all: true,
                    suite: ['unit', 'unit-slow']
                }));

                const unitAndESPackages = [
                    ...unitTests,
                    ...restrainedTests,
                    ...opensearchTests,
                    ...elasticsearchTests,
                    ...cacheTests
                ];

                const grouped = groupByFrameworkSuite(
                    packages,
                    availableSuites,
                    makeTestOptions({
                        all: true,
                        watch: true
                    })
                ).jest;

                expect(grouped).toBeDefined();

                expect(mapInfo(grouped?.unit)).toBeArrayOfSize(0);
                expect(mapInfo(grouped?.opensearch).length).toEqual(
                    mapInfo(unitAndESPackages).length
                );
            });
        });

        describe('when a unit test and none-unit test, it should group them together', () => {
            it('should be able group opensearch and unit together', () => {
                const opensearchTests = filterBySuite(packages, makeTestOptions({
                    all: false,
                    suite: ['opensearch'],
                })).slice(0, 2);

                const unitATests = filterBySuite(packages, makeTestOptions({
                    all: false,
                    suite: ['unit'],
                })).slice(0, 2);

                const unitAndESPackages = [
                    ...unitATests,
                    ...opensearchTests
                ];

                const grouped = groupByFrameworkSuite(
                    unitAndESPackages,
                    availableSuites,
                    makeTestOptions({ all: false })
                ).jest;

                expect(grouped).toBeDefined();
                expect(mapInfo(grouped?.opensearch)).toEqual(
                    mapInfo(unitAndESPackages)
                );
            });
        });

        describe('framework', () => {
            it('should default to jest when no framework is specified', () => {
                const grouped = groupByFrameworkSuite(packages, availableSuites, {
                    all: true
                } as TestOptions);

                expect(Object.keys(grouped)).toStrictEqual(['jest']);
            });

            it('should throw if given invalid framework', () => {
                expect.hasAssertions();

                const pkgs = [{
                    name: 'myPkg',
                    terascope: {
                        testSuite: 'foo',
                        testFrameworks: ['invalidFramework'] as any
                    }
                }] as PackageInfo[];

                try {
                    groupByFrameworkSuite(pkgs, availableSuites, {
                        all: true
                    } as TestOptions);
                } catch (error) {
                    expect(error.message).toBe(`Received unsupported test framework(s) "invalidFramework" for "myPkg"`);
                }
            });

            it('should properly group framework suites', () => {
                const pkgs = [
                    {
                        name: 'pkgJestA',
                        terascope: {
                            testSuite: 'opensearch',
                            testFrameworks: ['jest']
                        }
                    },
                    {
                        name: 'pkgPlaywrightA',
                        terascope: {
                            testSuite: 'opensearch',
                            testFrameworks: ['playwright']
                        }
                    },
                    {
                        name: 'pkgJestB',
                        terascope: {
                            testSuite: 'unit',
                            testFrameworks: ['jest']
                        }
                    },
                    {
                        name: 'pkgBothA',
                        terascope: {
                            testSuite: 'opensearch',
                            testFrameworks: ['jest', 'playwright']
                        }
                    },
                    {
                        name: 'pkgNoneB',
                        terascope: {
                            testSuite: 'unit'
                        }
                    },
                ] as PackageInfo[];

                const grouped = groupByFrameworkSuite(pkgs, availableSuites, {
                    all: true
                } as TestOptions);

                expect(grouped).toMatchObject({
                    jest: {
                        opensearch: [
                            { name: 'pkgJestA' },
                            { name: 'pkgBothA' },
                        ],
                        unit: [
                            { name: 'pkgJestB' },
                            { name: 'pkgNoneB' },
                        ]
                    },
                    playwright: {
                        opensearch: [
                            { name: 'pkgPlaywrightA' },
                            { name: 'pkgBothA' },
                        ]
                    }
                });
            });
        });
    });
});

/**
 * Used for more readable test failures
*/
function mapInfo(pkgInfos: PackageInfo[] = []): { name: string; suite?: string }[] {
    return pkgInfos.map((pkgInfo) => ({
        name: pkgInfo.name,
        suite: pkgInfo.terascope.testSuite
    }));
}
