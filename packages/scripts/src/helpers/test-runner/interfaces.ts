import { PackageInfo } from '../interfaces';

export type TestOptions = {
    bail: boolean;
    debug: boolean;
    watch: boolean;
    all: boolean;
    reportCoverage: boolean;
    suite?: string;
    useExistingServices: boolean;
    elasticsearchVersion: string;
    elasticsearchAPIVersion: string;
    kafkaVersion: string;
    jestArgs?: string[];
};

export type GroupedPackages = {
    [suite: string]: PackageInfo[];
};
