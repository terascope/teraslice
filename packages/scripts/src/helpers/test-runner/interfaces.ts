import { TestSuite, PackageInfo } from '../interfaces';

export type TestOptions = {
    bail: boolean;
    debug: boolean;
    filter?: string;
    all: boolean;
    suite?: TestSuite;
    serviceVersion?: string;
    elasticsearchUrl: string;
    kafkaBrokers: string[];
};

export type GroupedPackages = {
    [TestSuite.E2E]: PackageInfo[];
    [TestSuite.Unit]: PackageInfo[];
    [TestSuite.Elasticsearch]: PackageInfo[];
    [TestSuite.Kafka]: PackageInfo[];
};
