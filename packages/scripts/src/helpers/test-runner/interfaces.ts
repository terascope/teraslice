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
    logs: boolean;
};

export type GroupedPackages = {
    [suite: string]: PackageInfo[];
};

export type CleanupFN = (...args: any[]) => (Promise<void> | void);
export type RunSuiteResult = {
    errors: string[];
    cleanup: CleanupFN;
};

export interface OpenSearchInfo {
    name: string;
    cluster_name: string;
    cluster_uuid: string;
    version: {
        distribution: string;
        number: string;
        build_type: string;
        build_hash: string;
        build_date: string;
        build_snapshot: boolean;
        lucene_version: string;
        minimum_wire_compatibility_version: string;
        minimum_index_compatibility_version: string;
    };
    tagline: string;
}

export function isOpenSearchInfo(body: unknown): body is OpenSearchInfo {
    return typeof body === 'object' && body !== null;
}
