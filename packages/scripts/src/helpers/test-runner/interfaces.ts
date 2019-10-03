import { TestSuite, PackageInfo } from '../interfaces';

export type TestOptions = {
    bail: boolean;
    debug: boolean;
    watch: boolean;
    all: boolean;
    reportCoverage: boolean;
    suite?: TestSuite;
    useExistingServices: boolean;
    elasticsearchVersion: string;
    elasticsearchAPIVersion: string;
    kafkaVersion: string;
    jestArgs?: string[];
};

export type GroupedPackages = {
    [TestSuite.E2E]: PackageInfo[];
    [TestSuite.Unit]: PackageInfo[];
    [TestSuite.Elasticsearch]: PackageInfo[];
    [TestSuite.Kafka]: PackageInfo[];
};
