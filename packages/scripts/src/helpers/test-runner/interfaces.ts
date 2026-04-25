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
    frameworkArgs?: string[];
    framework: TestFramework;
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

export enum TestFrameworks {
    jest = 'jest',
    playwright = 'playwright'
    // TODO: maybe experimental vitest support
}
export type TestFramework = keyof typeof TestFrameworks;

// NOTE: don't think we need this, i was stupid and didn't
// understand what -- at end of script does so that should work instead
export enum PlaywrightOptions {
    debug = 'debug',
    ui = 'ui',
    projects = 'projects',
    pattern = 'pattern'
}
export type PlaywrightOption = keyof typeof PlaywrightOptions;
