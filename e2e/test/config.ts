import path from 'node:path';
import { z } from 'zod';
import { toBoolean } from '@terascope/core-utils';
import { Logger } from '@terascope/types';
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
    newId
} from './constants.js';

const logLevels: Logger.LogLevelString[] = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];

const E2EEnvSchema = z.object({
    ASSET_STORAGE_CONNECTION: z.string().optional(),
    ASSET_STORAGE_CONNECTION_TYPE: z.string().optional(),
    CERT_PATH: z.string(),
    DEBUG_LOG_LEVEL: z.enum(logLevels).optional(),
    ELASTICSEARCH_HOST: z.string().optional(),
    ENCRYPT_KAFKA: z.stringbool().optional(),
    ENCRYPT_MINIO: z.stringbool().optional(),
    ENCRYPT_OPENSEARCH: z.stringbool().optional(),
    FILE_LOGGING: z.stringbool(),
    GENERATE_ONLY: z.string().optional(),
    HOST_IP: z.string(),
    KAFKA_BROKER: z.string(),
    KAFKA_PORT: z.string().optional(),
    KEEP_OPEN: z.stringbool().optional(),
    KIND_CLUSTER: z.string(),
    MINIO_ACCESS_KEY: z.string().optional(),
    MINIO_HOST: z.string().optional(),
    MINIO_SECRET_KEY: z.string().optional(),
    NODE_VERSION: z.string(),
    OPENSEARCH_HOST: z.string().optional(),
    OPENSEARCH_SSL_HOST: z.string().optional(),
    OPENSEARCH_HOSTNAME: z.string().optional(),
    OPENSEARCH_PORT: z.string().optional(),
    OPENSEARCH_PASSWORD: z.string().optional(),
    OPENSEARCH_USER: z.string().optional(),
    OPENSEARCH_VERSION: z.string().optional(),
    SEARCH_TEST_HOST: z.string(),
    TERASLICE_PORT: z.string(),
    TEST_INDEX_PREFIX: z.string(),
    TEST_OPENSEARCH: z.stringbool().optional(),
    TEST_PLATFORM: z.string(),
    USE_DEV_ASSETS: z.stringbool().optional(),
    USE_HELMFILE: z.stringbool(),
});

const envConfig = E2EEnvSchema.parse(process.env);

export const config = {
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
