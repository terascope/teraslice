import 'jest-extended';
import { listPackages } from '../src/helpers/packages';
import { filterBySuite, groupBySuite } from '../src/helpers/test-runner/utils';
import { PackageInfo } from '../src/helpers/interfaces';
import { getAvailableTestSuites } from '../src/helpers/misc';

describe('Test Runner Helpers', () => {
    const availableSuites = getAvailableTestSuites();
    const packages = listPackages();

    describe('->filterBySuite', () => {
        it('should be able to filter by a suite', () => {
            const options: any = {
                all: false,
                suite: 'unit-a',
            };
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
                    const filtered = filterBySuite(packages, {
                        all: false,
                        suite,
                    } as any);
                    expect(mapInfo(group)).toEqual(mapInfo(filtered));
                }
            });
        });

        describe('when running all tests in watch mode', () => {
            it('should be able group elasticsearch and unit together', () => {
                const elasticsearchTests = filterBySuite(packages, {
                    all: true,
                    suite: 'elasticsearch',
                } as any);

                const unitATests = filterBySuite(packages, {
                    all: true,
                    suite: 'unit-a',
                } as any);

                const unitBTests = filterBySuite(packages, {
                    all: true,
                    suite: 'unit-b',
                } as any);

                const unitAndESPackages = [
                    ...unitBTests,
                    ...unitATests,
                    ...elasticsearchTests,
                ];

                const grouped = groupBySuite(packages, availableSuites, {
                    all: true,
                    watch: true
                } as any);

                expect(mapInfo(grouped['unit-a'])).toBeArrayOfSize(0);
                expect(mapInfo(grouped['unit-b'])).toBeArrayOfSize(0);
                expect(mapInfo(grouped.elasticsearch)).toEqual(
                    mapInfo(unitAndESPackages)
                );
            });
        });

        describe('when a unit-a test and none-unit-a test, it should group them together', () => {
            it('should be able group elasticsearch and unit-a together', () => {
                const elasticsearchTests = filterBySuite(packages, {
                    all: false,
                    suite: 'elasticsearch',
                } as any).slice(0, 2);

                const unitATests = filterBySuite(packages, {
                    all: false,
                    suite: 'unit-a',
                } as any).slice(0, 2);

                const unitBTests = filterBySuite(packages, {
                    all: false,
                    suite: 'unit-b',
                } as any).slice(0, 2);

                const unitAndESPackages = [
                    ...unitATests,
                    ...unitBTests,
                    ...elasticsearchTests,
                ];

                const grouped = groupBySuite(unitAndESPackages, availableSuites, {
                    all: false,
                } as any);

                expect(mapInfo(grouped['unit-a'])).toBeArrayOfSize(0);
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
function mapInfo(pkgInfos: PackageInfo[]): { name: string; suite?: string }[] {
    return pkgInfos.map((pkgInfo) => ({
        name: pkgInfo.name,
        suite: pkgInfo.terascope.testSuite
    }));
}
