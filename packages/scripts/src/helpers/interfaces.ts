import { EmptyObject } from '@terascope/utils';

export type PackageInfo = {
    dir: string;
    relativeDir: string;
    folderName: string;
    private?: boolean;
    name: string;
    main: string;
    srcMain?: string;
    displayName: string;
    version: string;
    description: string;
    license: string;
    publishConfig?: {
        access: 'public'|'private';
        registry: string;
    };
    terascope: PackageConfig;
    resolutions: {
        [pattern: string]: string;
    };
    dependencies: {
        [pkg: string]: string;
    };
    devDependencies: {
        [pkg: string]: string;
    };
    peerDependencies: {
        [pkg: string]: string;
    };
};

export enum Service {
    Kafka = 'kafka',
    Elasticsearch = 'elasticsearch',
}

export type PackageConfig = {
    main?: boolean;
    enableTypedoc?: boolean;
    testSuite?: string;
    allowBumpWhenPrivate?: boolean;
};

export type RootPackageInfo = {
    version: string;
    dir: string;
    relativeDir: string;
    folderName: string;
    name: string;
    displayName: string;
    bugs: {
        url: string;
    };
    documentation: string;
    homepage: string;
    workspaces: string[]|{ packages: string[] };
    terascope: {
        root: boolean;
        type: 'monorepo';
        target: string;
        tests: {
            suites: {
                [suite: string]: Service[];
            };
        };
        docker: {
            registries: string[];
        };
        npm: {
            registry: string;
        };
    };
    resolutions: {
        [pattern: string]: string;
    };
    dependencies?: {
        [pkg: string]: string;
    };
    devDependencies?: {
        [pkg: string]: string;
    };
    peerDependencies?: {
        [pkg: string]: string;
    };
};

export const AvailablePackageConfigKeys: readonly (keyof PackageConfig)[] = [
    'enableTypedoc', 'testSuite', 'main', 'allowBumpWhenPrivate',
];

export type TSCommands = 'docs';

export type GlobalCMDOptions = EmptyObject;
