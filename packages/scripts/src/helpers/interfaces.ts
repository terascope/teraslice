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
    enableTypedoc?: boolean;
    testSuite?: TestSuite;
};

export const AvailablePackageConfigKeys: ReadonlyArray<keyof PackageConfig> = ['enableTypedoc', 'testSuite'];

export type TSCommands = 'docs';
