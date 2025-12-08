import path from 'node:path';
import { SchemaValidator, toBoolean } from '@terascope/core-utils';
import { E2ETestEnv, Logger, Terafoundation } from '@terascope/types';
import {
    ASSET_BUNDLES_PATH,
    ASSETS_PATH,
    AUTOLOAD_PATH,
    BASE_PATH,
    CONFIG_PATH,
    DEFAULT_NODES,
    DEFAULT_WORKERS,
    EXAMPLE_INDEX_SIZES,
    LOG_PATH,
    USE_DEV_ASSETS,
    WORKERS_PER_NODE,
    newId,
    E2EConstants
} from './constants.js';

const logLevels: Logger.LogLevelString[] = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];

const E2EEnvSchema: Terafoundation.Schema<any> = {
    ASSET_STORAGE_CONNECTION: {
        default: null,
        format: 'optional_String'
    },
    ASSET_STORAGE_CONNECTION_TYPE: {
        default: null,
        format: 'optional_String'
    },
    CERT_PATH: {
        default: undefined,
        format: String
    },
    DEBUG_LOG_LEVEL: {
        default: undefined,
        format: logLevels
    },
    ELASTICSEARCH_HOST: {
        default: null,
        format: 'optional_String'
    },
    ENCRYPT_KAFKA: {
        default: null,
        format: 'optional_bool'
    },
    ENCRYPT_MINIO: {
        default: null,
        format: 'optional_bool'
    },
    ENCRYPT_OPENSEARCH: {
        default: null,
        format: 'optional_bool'
    },
    FILE_LOGGING: {
        default: null,
        format: 'optional_bool'
    },
    GENERATE_ONLY: {
        default: null,
        format: 'optional_String'
    },
    HOST_IP: {
        default: undefined,
        format: String
    },
    KAFKA_BROKER: {
        default: undefined,
        format: String
    },
    KAFKA_PORT: {
        default: null,
        format: 'optional_String'
    },
    KEEP_OPEN: {
        default: null,
        format: 'optional_bool'
    },
    KIND_CLUSTER: {
        default: undefined,
        format: String
    },
    MINIO_ACCESS_KEY: {
        default: null,
        format: 'optional_String'
    },
    MINIO_HOST: {
        default: null,
        format: 'optional_String'
    },
    MINIO_SECRET_KEY: {
        default: null,
        format: 'optional_String'
    },
    NODE_VERSION: {
        default: undefined,
        format: String
    },
    OPENSEARCH_HOST: {
        default: null,
        format: 'optional_String'
    },
    OPENSEARCH_SSL_HOST: {
        default: null,
        format: 'optional_String'
    },
    OPENSEARCH_HOSTNAME: {
        default: null,
        format: 'optional_String'
    },
    OPENSEARCH_PORT: {
        default: null,
        format: 'optional_String'
    },
    OPENSEARCH_PASSWORD: {
        default: null,
        format: 'optional_String'
    },
    OPENSEARCH_USER: {
        default: null,
        format: 'optional_String'
    },
    OPENSEARCH_VERSION: {
        default: null,
        format: 'optional_String'
    },
    SEARCH_TEST_HOST: {
        default: undefined,
        format: String
    },
    TERASLICE_PORT: {
        default: undefined,
        format: String
    },
    TEST_INDEX_PREFIX: {
        default: undefined,
        format: String
    },
    TEST_OPENSEARCH: {
        default: null,
        format: 'optional_bool'
    },
    TEST_PLATFORM: {
        default: undefined,
        format: String
    },
    USE_DEV_ASSETS: {
        default: null,
        format: 'optional_bool'
    },
    USE_HELMFILE: {
        default: null,
        format: 'optional_bool'
    },
};

const validator = new SchemaValidator<E2ETestEnv>(E2EEnvSchema, 'E2EEnvSchema');
const envConfig = validator.validate(process.env);

export const config: E2ETestEnv & E2EConstants = {
    ...envConfig,
    ASSET_BUNDLES_PATH,
    ASSETS_PATH,
    AUTOLOAD_PATH,
    BASE_PATH,
    // the uniq cluster name
    CLUSTER_NAME: newId(`${envConfig.TEST_INDEX_PREFIX}teracluster`, true, 2),
    CONFIG_PATH,
    DEFAULT_NODES,
    DEFAULT_WORKERS,
    EXAMPLE_INDEX_PREFIX: `${envConfig.TEST_INDEX_PREFIX}example`,
    EXAMPLE_INDEX_SIZES,
    LOG_PATH,
    newId,
    ROOT_CERT_PATH: path.join(envConfig.CERT_PATH, 'CAs/rootCA.pem'),
    SPEC_INDEX_PREFIX: `${envConfig.TEST_INDEX_PREFIX}spec`,
    TEST_HOST: toBoolean(envConfig.TEST_OPENSEARCH)
        ? toBoolean(envConfig.ENCRYPT_OPENSEARCH)
            ? envConfig.OPENSEARCH_SSL_HOST
            : envConfig.OPENSEARCH_HOST
        : envConfig.ELASTICSEARCH_HOST,
    USE_DEV_ASSETS,
    WORKERS_PER_NODE,
};
