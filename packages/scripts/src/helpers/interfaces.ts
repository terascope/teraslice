export type PackageInfo = {
    dir: string;
    folderName: string;
    private?: boolean;
    name: string;
    displayName: string;
    version: string;
    description: string;
    license: string;
    terascope: PackageConfig;
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

export enum TestSuite {
    Kafka = 'kafka',
    Elasticsearch = 'elasticsearch',
    Unit = 'unit',
    E2E = 'e2e',
    Disabled = 'disabled',
}

export type PackageConfig = {
    main?: boolean;
    enableTypedoc?: boolean;
    testSuite?: TestSuite;
};

export type RootPackageInfo = {
    root: boolean;
    // TODO support more than monorepo
    type: 'monorepo';
    name: string;
    displayName: string;
    bugs: {
        url: string;
    };
    documentation: string;
    homepage: string;
    docker: {
        image: string;
        cache_layers: ({ from: string; name: string })[];
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
