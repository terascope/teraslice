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
    engines?: {
        node?: string;
        yarn?: string;
    };
};

export enum Service {
    Kafka = 'kafka',
    Elasticsearch = 'elasticsearch',
    Minio = 'minio',
    RabbitMQ = 'rabbitmq',
    Opensearch = 'opensearch',
    RestrainedElasticsearch = 'restrained_elasticsearch',
    RestrainedOpensearch = 'restrained_opensearch'
}

export type PackageConfig = {
    main?: boolean;
    enableTypedoc?: boolean;
    testSuite?: string;
    allowBumpWhenPrivate?: boolean;
    linkToMain?: boolean;
};

export enum Hook {
    AFTER_RELEASE_BUMP = 'AFTER_RELEASE_BUMP',
    AFTER_SYNC = 'AFTER_SYNC',
}

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
        version?: 1|2;
        compilerOptions?: Record<string, unknown>;
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
        /**
         * The path to the javascript file to be called after
         * the hook is registered
        */
        hook_file?: string;
    };
    engines: {
        node: string;
        yarn: string;
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
    'enableTypedoc', 'testSuite', 'main', 'allowBumpWhenPrivate', 'linkToMain'
];

export type TSCommands = 'docs';

export type GlobalCMDOptions = EmptyObject;
