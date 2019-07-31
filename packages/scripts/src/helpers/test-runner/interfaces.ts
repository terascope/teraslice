import { TestSuite, PackageInfo } from '../interfaces';

export type TestOptions = {
    bail: boolean;
    debug: boolean;
    all: boolean;
    suite?: TestSuite;
    elasticsearchHost: string;
    elasticsearchVersion: string;
    kafkaBroker: string;
    kafkaVersion: string;
    jestArgs?: string[];
};

export type GroupedPackages = {
    [TestSuite.E2E]: PackageInfo[];
    [TestSuite.Unit]: PackageInfo[];
    [TestSuite.Elasticsearch]: PackageInfo[];
    [TestSuite.Kafka]: PackageInfo[];
};
