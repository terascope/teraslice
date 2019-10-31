export type PackageInfo = {
    dir: string;
    folderName: string;
    private?: boolean;
    name: string;
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
};

export type RootPackageInfo = {
    version: string;
    dir: string;
    folderName: string;
    name: string;
    displayName: string;
    bugs: {
        url: string;
    };
    documentation: string;
    homepage: string;
    terascope: {
        root: boolean;
        type: 'monorepo';
        tests: {
            suites: {
                [suite: string]: Service[];
            };
        };
        docker: {
            registries: string[];
            cache_layers: ({ from: string; name: string })[];
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

export const AvailablePackageConfigKeys: readonly (keyof PackageConfig)[] = ['enableTypedoc', 'testSuite', 'main'];

export type TSCommands = 'docs';

export type GlobalCMDOptions = {};
