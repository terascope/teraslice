import 'jest-extended';
import { listPackages } from '../src/helpers/packages';
import { onlyUnitTests, filterBySuite, groupBySuite } from '../src/helpers/test-runner/utils';
import { TestSuite } from '../src/helpers/interfaces';

describe('Test Runner Helpers', () => {
    const packages = listPackages();

    describe('->onlyUnitTest', () => {
        it('should return false any of the packages are not unit tests', () => {
            const suites = [TestSuite.Unit, TestSuite.Elasticsearch];
            const filtered = packages.filter((pkgInfo) => suites.includes(pkgInfo.terascope.testSuite!));
            expect(onlyUnitTests(filtered)).toBeFalse();
        });
        it('should return true if all of the packages are unit tests', () => {
            const suites = [TestSuite.Unit];
            const filtered = packages.filter((pkgInfo) => suites.includes(pkgInfo.terascope.testSuite!));
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
        it('should be able to group by suite', () => {
            const grouped = groupBySuite(packages);
            for (const [suite, group] of Object.entries(grouped)) {
                const options: any = {
                    all: false,
                    suite,
                };
                const filtered = filterBySuite(packages, options);
                expect(group).toEqual(filtered);
            }
        });
    });
});
