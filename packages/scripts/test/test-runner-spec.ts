import 'jest-extended';
import { listPackages } from '../src/helpers/packages';
import { onlyUnitTests, filterBySuite, groupBySuite } from '../src/helpers/test-runner/utils';
import { TestSuite, PackageInfo } from '../src/helpers/interfaces';

describe('Test Runner Helpers', () => {
    const packages = listPackages();

    describe('->onlyUnitTest', () => {
        it('should return false any of the packages are not unit tests', () => {
            const suites = [TestSuite.Unit, TestSuite.Elasticsearch];
            const filtered = packages.filter((pkgInfo) => {
                const suite = pkgInfo.terascope.testSuite!;
                return suites.includes(suite);
            });
            expect(onlyUnitTests(filtered)).toBeFalse();
        });

        it('should return true if all of the packages are unit tests', () => {
            const suites = [TestSuite.Unit];
            const filtered = packages.filter((pkgInfo) => {
                const suite = pkgInfo.terascope.testSuite!;
                return suites.includes(suite);
            });
            expect(onlyUnitTests(filtered)).toBeTrue();
        });
    });

    describe('->filterBySuite', () => {
        it('should be able to filter by a suite', () => {
            const options: any = {
                all: false,
                suite: TestSuite.Unit,
            };
            const filtered = filterBySuite(packages, options);
            const suites = filtered.map((pkgInfo) => pkgInfo.terascope.testSuite);
            expect(suites).not.toContain(TestSuite.E2E);
            expect(suites).not.toContain(TestSuite.Elasticsearch);
            expect(suites).not.toContain(TestSuite.Disabled);
            expect(suites).not.toContain(TestSuite.Kafka);
        });
    });

    describe('->groupBySuite', () => {
        describe('when running all tests', () => {
            it('should be able to group by suite', () => {
                const grouped = groupBySuite(packages, {
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
                    suite: TestSuite.Elasticsearch,
                } as any);

                const unitTests = filterBySuite(packages, {
                    all: true,
                    suite: TestSuite.Unit,
                } as any);

                const unitAndESPackages = [
                    ...unitTests,
                    ...elasticsearchTests,
                ];

                const grouped = groupBySuite(packages, {
                    all: true,
                    watch: true
                } as any);

                expect(mapInfo(grouped[TestSuite.Unit])).toBeArrayOfSize(0);
                expect(mapInfo(grouped[TestSuite.Elasticsearch])).toEqual(
                    mapInfo(unitAndESPackages)
                );
            });
        });

        describe('when a unit test and none-unit test, it should group them together', () => {
            it('should be able group elasticsearch and unit together', () => {
                const elasticsearchTests = filterBySuite(packages, {
                    all: false,
                    suite: TestSuite.Elasticsearch,
                } as any).slice(0, 2);

                const unitTests = filterBySuite(packages, {
                    all: false,
                    suite: TestSuite.Unit,
                } as any).slice(0, 2);

                const unitAndESPackages = [
                    ...unitTests,
                    ...elasticsearchTests,
                ];

                const grouped = groupBySuite(unitAndESPackages, {
                    all: false,
                } as any);

                expect(mapInfo(grouped[TestSuite.Unit])).toBeArrayOfSize(0);
                expect(mapInfo(grouped[TestSuite.Elasticsearch])).toEqual(
                    mapInfo(unitAndESPackages)
                );
            });
        });
    });
});

/**
 * Used for more readable test failures
*/
function mapInfo(pkgInfos: PackageInfo[]): { name: string; suite?: TestSuite }[] {
    return pkgInfos.map((pkgInfo) => ({
        name: pkgInfo.name,
        suite: pkgInfo.terascope.testSuite
    }));
}
