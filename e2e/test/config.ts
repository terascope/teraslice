import path from 'node:path';
import { z } from 'zod';
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

type BoolStrings = 'true' | 'false';
const boolean: BoolStrings[] = ['true', 'false'];
const logLevels: Logger.LogLevelString[] = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];

const E2EEnvSchema = z.object({
    ASSET_STORAGE_CONNECTION: z.string().optional(),
    ASSET_STORAGE_CONNECTION_TYPE: z.string().optional(),
    CERT_PATH: z.string(),
    DEBUG_LOG_LEVEL: z.enum(logLevels).optional(),
    ENCRYPT_KAFKA: z.enum(boolean).optional(),
    ENCRYPT_MINIO: z.enum(boolean).optional(),
    ENCRYPT_OPENSEARCH: z.enum(boolean).optional(),
    FILE_LOGGING: z.enum(boolean),
    GENERATE_ONLY: z.string().optional(),
    HOST_IP: z.string(),
    KAFKA_BROKER: z.string(),
    KAFKA_PORT: z.string().optional(),
    KEEP_OPEN: z.enum(boolean).optional(),
    KIND_CLUSTER: z.string(),
    MINIO_ACCESS_KEY: z.string().optional(),
    MINIO_HOST: z.string().optional(),
    MINIO_SECRET_KEY: z.string().optional(),
    NODE_VERSION: z.string(),
    OPENSEARCH_PASSWORD: z.string().optional(),
    OPENSEARCH_USER: z.string().optional(),
    OPENSEARCH_VERSION: z.string().optional(),
    SEARCH_TEST_HOST: z.string(),
    TERASLICE_PORT: z.string(),
    TEST_INDEX_PREFIX: z.string(),
    TEST_OPENSEARCH: z.enum(boolean).optional(),
    TEST_PLATFORM: z.string(),
    USE_DEV_ASSETS: z.enum(boolean).optional(),
    USE_HELMFILE: z.enum(boolean),
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
    TEST_HOST: envConfig.SEARCH_TEST_HOST,
    USE_DEV_ASSETS,
    WORKERS_PER_NODE,
};
