export type PackageInfo = {
    dir: string;
    folderName: string;
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
    mainPackage?: boolean;
    enableTypedoc?: boolean;
    testSuite?: TestSuite;
};

export type RootPackageInfo = {
    root: boolean;
    // TODO support more than monorepo
    type: 'monorepo';
    docker: {
        image: string;
        cache_layers: ({ from: string; name: string })[];
    };
};

export const AvailablePackageConfigKeys: ReadonlyArray<keyof PackageConfig> = ['enableTypedoc', 'testSuite', 'mainPackage'];

export type TSCommands = 'docs';

export type GlobalCMDOptions = {};
