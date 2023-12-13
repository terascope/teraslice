import { PackageInfo } from '../interfaces';

export type TestOptions = {
    bail: boolean;
    debug: boolean;
    watch: boolean;
    trace: boolean;
    all: boolean;
    keepOpen: boolean;
    reportCoverage: boolean;
    forceSuite?: string;
    suite?: string[];
    useExistingServices: boolean;
    elasticsearchVersion: string;
    elasticsearchAPIVersion: string;
    kafkaVersion: string;
    kafkaImageVersion: any;
    zookeeperVersion: string;
    minioVersion: string;
    rabbitmqVersion: string;
    opensearchVersion: string;
    nodeVersion: string;
    jestArgs?: string[];
    ignoreMount: boolean;
    testPlatform: string;
    clusterName?: string;
};

export type GroupedPackages = {
    [suite: string]: PackageInfo[];
};

export type CleanupFN = (...args: any[]) => (Promise<void>|void);
export type RunSuiteResult = {
    errors: string[];
    cleanup: CleanupFN;
}
