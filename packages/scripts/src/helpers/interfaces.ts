import { EmptyObject } from '@terascope/utils';
import type { V1Volume, V1VolumeMount } from '@kubernetes/client-node';

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
        access: 'public' | 'private';
        registry: string | undefined;
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
    RestrainedOpensearch = 'restrained_opensearch',
    Utility = 'utility'
}

export type PackageConfig = {
    main?: boolean;
    enableTypedoc?: boolean;
    testSuite?: string;
    allowBumpWhenPrivate?: boolean;
    linkToMain?: boolean;
    root?: boolean;
    asset?: boolean;
    tests?: Record<string, Record<string, string[]>>;
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
    workspaces: string[] | { packages: string[] };
    terascope: {
        root: boolean;
        asset: boolean;
        type: 'monorepo';
        target: string;
        version?: 1 | 2;
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
    'enableTypedoc',
    'testSuite',
    'main',
    'allowBumpWhenPrivate',
    'linkToMain',
    'root',
    'tests',
    'asset'
];

export type TSCommands = 'docs';

export type GlobalCMDOptions = EmptyObject;

export type KindCluster = {
    kind: string;
    apiVersion: string;
    name: string;
    nodes: [
        {
            role: string;
            image?: string;
            extraPortMappings: [
                {
                    containerPort: number;
                    hostPort: number;
                },
                {
                    containerPort: number;
                    hostPort: number;
                },
                {
                    containerPort: number;
                    hostPort: number;
                }
            ];
            extraMounts?: [
                {
                    hostPath: string;
                    containerPath: string;
                }
            ];
        }
    ];
};

export interface TsVolumeSet {
    extraMounts: any[];
    volumes: V1Volume[];
    volumeMounts: V1VolumeMount[];
}

export interface OCIImageManifest {
    mediaType: string;
    digest: string;
    size: number;
    platform: {
        architecture: string;
    };
}

export interface OCIindexManifest {
    schemaVersion: number;
    mediaType: string;
    manifests: OCIImageManifest[];
    config: {
        digest: string;
    };
}

export interface OCIimageConfig {
    config: {
        Labels: Record<string, string>;
    };
}

export interface ServiceObj {
    name: string;
    namespace: string;
    revision: string;
    updated: string;
    status: string;
    deployed: string;
    chart: string;
    app_version: string;
}

export type CustomKindService = | 'opensearch1' | 'opensearch2' | 'opensearch3'
    | 'elasticsearch7' | 'kafka' | 'minio';

export interface CustomKindDefaultPort {
    containerPorts: number[];
    hostPorts: number[];
    hostPath: string;
}

export type CustomKindDefaultPorts = Record<CustomKindService, CustomKindDefaultPort>;
