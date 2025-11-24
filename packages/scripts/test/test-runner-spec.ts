import 'jest-extended';
import { listPackages } from '../src/helpers/packages';
import { filterBySuite, groupBySuite } from '../src/helpers/test-runner/utils';
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
        useHelmfile: false,
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
            expect(suites).not.toContain('elasticsearch');
            expect(suites).not.toContain('disabled');
            expect(suites).not.toContain('kafka');
        });
    });

    describe('->groupBySuite', () => {
        describe('when running all tests', () => {
            it('should be able to group by suite', () => {
                const grouped = groupBySuite(packages, availableSuites, {
                    all: true,
                } as any);

                for (const [suite, group] of Object.entries(grouped)) {
                    const filtered = filterBySuite(packages, makeTestOptions({
                        all: false,
                        suite: [suite],
                    }));

                    expect(mapInfo(group)).toEqual(mapInfo(filtered));
                }
            });
        });

        describe('when running all tests in watch mode', () => {
            it('should be able group elasticsearch and unit together', () => {
                const elasticsearchTests = filterBySuite(packages, makeTestOptions({
                    all: true,
                    suite: ['elasticsearch'],
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
                    suite: ['unit']
                }));

                const unitAndESPackages = [
                    ...unitTests,
                    ...restrainedTests,
                    ...opensearchTests,
                    ...elasticsearchTests
                ];

                const grouped = groupBySuite(packages, availableSuites, makeTestOptions({
                    all: true,
                    watch: true
                }));

                expect(mapInfo(grouped.unit)).toBeArrayOfSize(0);
                expect(mapInfo(grouped.elasticsearch).length).toEqual(
                    mapInfo(unitAndESPackages).length
                );
            });
        });

        describe('when a unit test and none-unit test, it should group them together', () => {
            it('should be able group elasticsearch and unit together', () => {
                const elasticsearchTests = filterBySuite(packages, makeTestOptions({
                    all: false,
                    suite: ['elasticsearch'],
                })).slice(0, 2);

                const unitATests = filterBySuite(packages, makeTestOptions({
                    all: false,
                    suite: ['unit'],
                })).slice(0, 2);

                const unitAndESPackages = [
                    ...unitATests,
                    ...elasticsearchTests
                ];

                const grouped = groupBySuite(unitAndESPackages, availableSuites, makeTestOptions({
                    all: false,
                }));

                expect(mapInfo(grouped.unit)).toBeArrayOfSize(0);
                expect(mapInfo(grouped.elasticsearch)).toEqual(
                    mapInfo(unitAndESPackages)
                );
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
