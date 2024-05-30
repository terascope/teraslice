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
    kafkaVersion: string;
    kafkaImageVersion: any;
    zookeeperVersion: string;
    minioVersion: string;
    encryptMinio: boolean;
    rabbitmqVersion: string;
    opensearchVersion: string;
    nodeVersion: string;
    jestArgs?: string[];
    ignoreMount: boolean;
    testPlatform: 'native'|'kubernetes'|'kubernetesV2';
    kindClusterName: string;
    k8sVersion?: string;
};

export type GroupedPackages = {
    [suite: string]: PackageInfo[];
};

export type CleanupFN = (...args: any[]) => (Promise<void>|void);
export type RunSuiteResult = {
    errors: string[];
    cleanup: CleanupFN;
}
