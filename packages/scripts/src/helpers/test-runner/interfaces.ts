import { PackageInfo } from '../interfaces.js';

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
    jestArgs?: string[];
    ignoreMount: boolean;
    clusteringType: 'native' | 'kubernetesV2';
    kindClusterName: string;
    skipImageDeletion: boolean;
    useHelmfile: boolean;
};

export type GroupedPackages = {
    [suite: string]: PackageInfo[];
};

export type CleanupFN = (...args: any[]) => (Promise<void> | void);
export type RunSuiteResult = {
    errors: string[];
    cleanup: CleanupFN;
};
