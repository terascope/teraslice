import ipPkg from 'ip';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { z } from 'zod';
import {
    toBoolean, toSafeString, isCI,
    toIntegerOrThrow
} from '@terascope/core-utils';
import { Service } from './interfaces.js';

const booleanString = z.enum(['true', 'false']);

const ProcessEnvSchema = z.object({
    // Test service flags
    TEST_TERASLICE: booleanString.default('false'),
    TEST_OPENSEARCH: booleanString.default('false'),
    TEST_ELASTICSEARCH: booleanString.default('false'),
    TEST_KAFKA: booleanString.default('false'),
    TEST_MINIO: booleanString.default('false'),
    TEST_RESTRAINED_OPENSEARCH: booleanString.default('false'),
    TEST_RESTRAINED_ELASTICSEARCH: booleanString.default('false'),
    TEST_RABBITMQ: booleanString.default('false'),
    ENABLE_UTILITY_SVC: booleanString.default('false'),

    // General config
    ATTACH_JEST_DEBUGGER: booleanString.default('false'),
    BASE_DOCKER_IMAGE: z.string().default('ghcr.io/terascope/node-base'),
    CERT_PATH: z.string().optional(),
    CI_COMMIT_REF_SLUG: z.string().optional(),
    DEV_DOCKER_IMAGE: z.string().optional(),
    DEV_TAG: z.string().optional(),
    DOCKER_CACHE_PATH: z.string().default('/tmp/docker_cache'),
    DOCKER_IMAGES_PATH: z.string().default('./images'),
    DOCKER_IMAGE_LIST_PATH: z.string().optional(),
    DOCKER_NETWORK_NAME: z.string().optional(),
    FORCE_COLOR: z.string().optional(),
    HOST_IP: z.string().optional(),
    JEST_MAX_WORKERS: z.string().optional(),
    K8S_VERSION: z.string().optional(),
    MAX_PROJECTS_PER_BATCH: z.string().default('5'),
    NODE_VERSION: z.string().optional(),
    REPORT_COVERAGE: booleanString.default('false'),
    SERVICE_HEAP_OPTS: z.string().default('-Xms512m -Xmx512m'),
    SERVICE_UP_TIMEOUT: z.string().default('2m'),
    SERVICES_USE_TMPFS: booleanString.default('true'),
    SKIP_DOCKER_BUILD_IN_E2E: booleanString.default('false'),
    SKIP_DOCKER_BUILD_IN_K8S: booleanString.default('false'),
    SKIP_E2E_OUTPUT_LOGS: booleanString.optional(),
    SKIP_GIT_COMMANDS: booleanString.default('false'),
    SKIP_IMAGE_DELETION: booleanString.default('false'),
    TERASLICE_IMAGE: z.string().optional(),
    TEST_NAMESPACE: z.string().default('ts_test'),
    USE_EXISTING_SERVICES: booleanString.default('false'),
    USE_HELMFILE: booleanString.default('false'),

    // Elasticsearch config
    ELASTICSEARCH_DOCKER_IMAGE: z.string().default('elasticsearch'),
    ELASTICSEARCH_HOSTNAME: z.string().optional(),
    ELASTICSEARCH_NAME: z.string().default('elasticsearch'),
    ELASTICSEARCH_PORT: z.string().default('49200'),
    ELASTICSEARCH_VERSION: z.string().optional(),
    RESTRAINED_ELASTICSEARCH_PORT: z.string().default('49202'),

    // Kafka config
    ENCRYPT_KAFKA: booleanString.default('false'),
    KAFKA_ADVERTISED_LISTENERS: z.string().optional(),
    KAFKA_CONTROLLER_LISTENER_NAMES: z.string().default('CONTROLLER'),
    KAFKA_CONTROLLER_QUORUM_VOTERS: z.string().default('1@0.0.0.0:9093'),
    KAFKA_DOCKER_IMAGE: z.string().default('apache/kafka'),
    KAFKA_GROUP_INITIAL_REBALANCE_DELAY_MS: z.string().default('0'),
    KAFKA_HOSTNAME: z.string().optional(),
    KAFKA_INTER_BROKER_LISTENER_NAME: z.string().default('INTERNAL'),
    KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: z.string().optional(),
    KAFKA_LISTENERS: z.string().optional(),
    KAFKA_NAME: z.string().default('kafka'),
    KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: z.string().default('1'),
    KAFKA_NODE_ID: z.string().default('1'),
    KAFKA_PORT: z.string().default('49094'),
    KAFKA_PROCESS_ROLES: z.string().default('broker,controller'),
    KAFKA_SECRETS_DIR: z.string().default('/etc/kafka/secrets'),
    KAFKA_SECURITY_PROTOCOL: z.string().optional(),
    KAFKA_TRANSACTION_STATE_LOG_MIN_ISR: z.string().default('1'),
    KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR: z.string().default('1'),
    KAFKA_VERSION: z.string().default('3.7.2'),

    // Kind config
    KIND_DOCKER_IMAGE: z.string().default('kindest/node'),
    KIND_VERSION: z.string().default('v1.30.0'),

    // Minio config
    ENCRYPT_MINIO: booleanString.default('false'),
    MINIO_ACCESS_KEY: z.string().default('minioadmin'),
    MINIO_DOCKER_IMAGE: z.string().default('minio/minio'),
    MINIO_HOSTNAME: z.string().optional(),
    MINIO_NAME: z.string().default('minio'),
    MINIO_PORT: z.string().default('49000'),
    MINIO_SECRET_KEY: z.string().default('minioadmin'),
    MINIO_UI_PORT: z.string().default('49001'),
    MINIO_VERSION: z.string().default('RELEASE.2024-08-29T01-40-52Z'),

    // OpenSearch config
    ENCRYPT_OPENSEARCH: booleanString.default('false'),
    OPENSEARCH_DOCKER_IMAGE: z.string().default('opensearchproject/opensearch'),
    OPENSEARCH_HOSTNAME: z.string().optional(),
    OPENSEARCH_NAME: z.string().default('opensearch'),
    OPENSEARCH_PASSWORD: z.string().default('admin'),
    OPENSEARCH_PORT: z.string().default('49210'),
    OPENSEARCH_USER: z.string().default('admin'),
    OPENSEARCH_VERSION: z.string().optional(),
    RESTRAINED_OPENSEARCH_PORT: z.string().default('49206'),

    // RabbitMQ config
    RABBITMQ_DOCKER_IMAGE: z.string().default('rabbitmq'),
    RABBITMQ_HOSTNAME: z.string().optional(),
    RABBITMQ_MANAGEMENT_PORT: z.string().default('55672'),
    RABBITMQ_NAME: z.string().default('rabbitmq'),
    RABBITMQ_PASSWORD: z.string().default('guest'),
    RABBITMQ_PORT: z.string().default('45672'),
    RABBITMQ_USER: z.string().default('guest'),
    RABBITMQ_VERSION: z.string().default('3.13.7-management'),

    // Teraslice Config
    ASSET_STORAGE_CONNECTION: z.string().default('default'),
    ASSET_STORAGE_CONNECTION_TYPE: z.string().default('elasticsearch-next'),
    CLUSTERING_TYPE: z.enum(['kubernetesV2']).default('kubernetesV2'),
    SEARCH_TEST_HOST: z.string().optional(),
    TERASLICE_PORT: z.string().default('45678'),
    TEST_PLATFORM: z.enum(['native', 'kubernetesV2']).default('native'),

    // Utility service config
    UTILITY_SVC_DOCKER_IMAGE: z.string().default('teraslice-utility'),
    UTILITY_SVC_DOCKER_PROJECT_PATH: z.string().default('e2e/helm/utility'),
    UTILITY_SVC_NAME: z.string().default('utility-svc'),
    UTILITY_SVC_VERSION: z.string().default('0.0.1'),
});

// Validate and parse environment variables
const env = ProcessEnvSchema.parse(process.env);

const ConfigSchema = ProcessEnvSchema.extend({
    // Override boolean strings to actual booleans in final config
    ATTACH_JEST_DEBUGGER: z.boolean(),
    ENABLE_UTILITY_SVC: z.boolean(),
    ENCRYPT_KAFKA: z.boolean(),
    ENCRYPT_MINIO: z.boolean(),
    ENCRYPT_OPENSEARCH: z.boolean(),
    REPORT_COVERAGE: z.boolean(),
    SERVICES_USE_TMPFS: z.boolean(),
    SKIP_DOCKER_BUILD_IN_E2E: z.boolean(),
    SKIP_DOCKER_BUILD_IN_K8S: z.boolean(),
    SKIP_E2E_OUTPUT_LOGS: z.boolean(),
    SKIP_GIT_COMMANDS: z.boolean(),
    SKIP_IMAGE_DELETION: z.boolean(),
    TEST_ELASTICSEARCH: z.boolean(),
    TEST_KAFKA: z.boolean(),
    TEST_MINIO: z.boolean(),
    TEST_OPENSEARCH: z.boolean(),
    TEST_RABBITMQ: z.boolean(),
    TEST_RESTRAINED_ELASTICSEARCH: z.boolean(),
    TEST_RESTRAINED_OPENSEARCH: z.boolean(),
    TEST_TERASLICE: z.boolean(),
    USE_EXISTING_SERVICES: z.boolean(),
    USE_HELMFILE: z.boolean(),

    // Override optional fields to be required or change type in final config
    CERT_PATH: z.string(),
    DEV_TAG: z.string(),
    DOCKER_CACHE_PATH: z.string(),
    DOCKER_IMAGES_PATH: z.string(),
    DOCKER_IMAGE_LIST_PATH: z.string(),
    ELASTICSEARCH_HOSTNAME: z.string(),
    ELASTICSEARCH_VERSION: z.string(),
    FORCE_COLOR: z.enum(['0', '1']),
    HOST_IP: z.string(),
    JEST_MAX_WORKERS: z.number().optional(),
    KAFKA_HOSTNAME: z.string(),
    MAX_PROJECTS_PER_BATCH: z.number(),
    MINIO_HOSTNAME: z.string(),
    NODE_VERSION: z.string(),
    OPENSEARCH_HOSTNAME: z.string(),
    OPENSEARCH_VERSION: z.string(),
    RABBITMQ_HOSTNAME: z.string(),
    SEARCH_TEST_HOST: z.string(),
    TERASLICE_PORT: z.string(),

    // Additional computed properties
    __DEFAULT_ELASTICSEARCH7_VERSION: z.string(),
    __DEFAULT_OPENSEARCH1_VERSION: z.string(),
    __DEFAULT_OPENSEARCH2_VERSION: z.string(),
    __DEFAULT_OPENSEARCH3_VERSION: z.string(),
    DEFAULT_NODE_VERSION: z.string(),
    ELASTICSEARCH_HOST: z.string(),
    ENCRYPTION_ENABLED: z.boolean(),
    ENV_SERVICES: z.array(z.enum(Service)),
    KAFKA_BROKER: z.string(),
    MINIO_HOST: z.string(),
    MINIO_PROTOCOL: z.enum(['http', 'https']),
    NPM_DEFAULT_REGISTRY: z.string(),
    OPENSEARCH_HOST: z.string(),
    OPENSEARCH_PROTOCOL: z.enum(['http', 'https']),
    RABBITMQ_HOST: z.string(),
    RABBITMQ_MANAGEMENT: z.string(),
    RESTRAINED_ELASTICSEARCH_HOST: z.string(),
    RESTRAINED_OPENSEARCH_HOST: z.string(),
    TEST_NODE_VERSIONS: z.array(z.string()),
});

const config = {
} as any;

const { address } = ipPkg;

const forceColor = env.FORCE_COLOR || '1';
config.FORCE_COLOR = toBoolean(forceColor)
    ? '1'
    : '0';
/** The timeout for how long a service has to stand up */
config.SERVICE_UP_TIMEOUT = env.SERVICE_UP_TIMEOUT;

/** Default elasticsearch7 version used to populate the CI cache */
config.__DEFAULT_ELASTICSEARCH7_VERSION = '7.9.3';
/** Default opensearch1 version used to populate the CI cache */
config.__DEFAULT_OPENSEARCH1_VERSION = '1.3.11';
/** Default opensearch2 version used to populate the CI cache */
config.__DEFAULT_OPENSEARCH2_VERSION = '2.15.0';
/** Default opensearch3 version used to populate the CI cache */
config.__DEFAULT_OPENSEARCH3_VERSION = '3.1.0';

config.TERASLICE_PORT = env.TERASLICE_PORT;
config.HOST_IP = env.HOST_IP || address();
config.USE_EXISTING_SERVICES = toBoolean(env.USE_EXISTING_SERVICES);
config.SERVICES_USE_TMPFS = toBoolean(env.SERVICES_USE_TMPFS);
config.SERVICE_HEAP_OPTS = env.SERVICE_HEAP_OPTS;
config.DOCKER_NETWORK_NAME = env.DOCKER_NETWORK_NAME;
config.TEST_NAMESPACE = env.TEST_NAMESPACE;
config.ASSET_STORAGE_CONNECTION_TYPE = env.ASSET_STORAGE_CONNECTION_TYPE;
config.ASSET_STORAGE_CONNECTION = env.ASSET_STORAGE_CONNECTION;

config.ELASTICSEARCH_NAME = env.ELASTICSEARCH_NAME;
config.ELASTICSEARCH_HOSTNAME = env.ELASTICSEARCH_HOSTNAME || config.HOST_IP;
config.ELASTICSEARCH_PORT = env.ELASTICSEARCH_PORT;
config.ELASTICSEARCH_HOST = `http://${config.ELASTICSEARCH_HOSTNAME}:${config.ELASTICSEARCH_PORT}`;
config.ELASTICSEARCH_VERSION = env.ELASTICSEARCH_VERSION
    || config.__DEFAULT_ELASTICSEARCH7_VERSION;
config.ELASTICSEARCH_DOCKER_IMAGE = env.ELASTICSEARCH_DOCKER_IMAGE;

config.RESTRAINED_ELASTICSEARCH_PORT = env.RESTRAINED_ELASTICSEARCH_PORT;
config.RESTRAINED_ELASTICSEARCH_HOST = `http://${config.ELASTICSEARCH_HOSTNAME}:${config.RESTRAINED_ELASTICSEARCH_PORT}`;

config.KAFKA_NAME = env.KAFKA_NAME;
config.KAFKA_HOSTNAME = env.KAFKA_HOSTNAME || config.HOST_IP;
config.KAFKA_PORT = env.KAFKA_PORT;
config.KAFKA_BROKER = `${config.KAFKA_HOSTNAME}:${config.KAFKA_PORT}`;
config.KAFKA_VERSION = env.KAFKA_VERSION;
config.KAFKA_DOCKER_IMAGE = env.KAFKA_DOCKER_IMAGE;
config.KAFKA_NODE_ID = env.KAFKA_NODE_ID;
config.KAFKA_LISTENERS = env.KAFKA_LISTENERS || `INTERNAL://0.0.0.0:${config.KAFKA_PORT}, CONTROLLER://:9093`;
config.KAFKA_ADVERTISED_LISTENERS = env.KAFKA_ADVERTISED_LISTENERS || `INTERNAL://${config.KAFKA_HOSTNAME}:${config.KAFKA_PORT}`;
config.ENCRYPT_KAFKA = toBoolean(env.ENCRYPT_KAFKA);
config.KAFKA_SECURITY_PROTOCOL = env.KAFKA_SECURITY_PROTOCOL || (config.ENCRYPT_KAFKA ? 'SSL' : 'PLAINTEXT');
config.KAFKA_LISTENER_SECURITY_PROTOCOL_MAP = env.KAFKA_LISTENER_SECURITY_PROTOCOL_MAP || `INTERNAL:${config.KAFKA_SECURITY_PROTOCOL}, CONTROLLER:PLAINTEXT`;
config.KAFKA_SECRETS_DIR = env.KAFKA_SECRETS_DIR;
config.KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR = env.KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR;
config.KAFKA_PROCESS_ROLES = env.KAFKA_PROCESS_ROLES;
config.KAFKA_CONTROLLER_LISTENER_NAMES = env.KAFKA_CONTROLLER_LISTENER_NAMES;
config.KAFKA_CONTROLLER_QUORUM_VOTERS = env.KAFKA_CONTROLLER_QUORUM_VOTERS;
config.KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR
    = env.KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR;
config.KAFKA_TRANSACTION_STATE_LOG_MIN_ISR = env.KAFKA_TRANSACTION_STATE_LOG_MIN_ISR;
config.KAFKA_GROUP_INITIAL_REBALANCE_DELAY_MS = env.KAFKA_GROUP_INITIAL_REBALANCE_DELAY_MS;
config.KAFKA_INTER_BROKER_LISTENER_NAME = env.KAFKA_INTER_BROKER_LISTENER_NAME;

config.MINIO_NAME = env.MINIO_NAME;
config.MINIO_HOSTNAME = env.MINIO_HOSTNAME || config.HOST_IP;
config.MINIO_PORT = env.MINIO_PORT;
config.MINIO_UI_PORT = env.MINIO_UI_PORT;
config.ENCRYPT_MINIO = toBoolean(env.ENCRYPT_MINIO);
config.MINIO_PROTOCOL = config.ENCRYPT_MINIO ? 'https' : 'http';
config.MINIO_HOST = `${config.MINIO_PROTOCOL}://${config.MINIO_HOSTNAME}:${config.MINIO_PORT}`;
config.MINIO_VERSION = env.MINIO_VERSION;
config.MINIO_DOCKER_IMAGE = env.MINIO_DOCKER_IMAGE;
config.MINIO_ACCESS_KEY = env.MINIO_ACCESS_KEY;
config.MINIO_SECRET_KEY = env.MINIO_SECRET_KEY;

config.RABBITMQ_VERSION = env.RABBITMQ_VERSION;
config.RABBITMQ_DOCKER_IMAGE = env.RABBITMQ_DOCKER_IMAGE;
config.RABBITMQ_NAME = env.RABBITMQ_NAME;
config.RABBITMQ_PORT = env.RABBITMQ_PORT;
config.RABBITMQ_MANAGEMENT_PORT = env.RABBITMQ_MANAGEMENT_PORT;
config.RABBITMQ_HOSTNAME = env.RABBITMQ_HOSTNAME || config.HOST_IP;
config.RABBITMQ_HOST = `http://${config.RABBITMQ_HOSTNAME}:${config.RABBITMQ_PORT}`;
config.RABBITMQ_MANAGEMENT = `http://${config.RABBITMQ_HOSTNAME}:${config.RABBITMQ_MANAGEMENT_PORT}`;

config.RABBITMQ_USER = env.RABBITMQ_USER;
config.RABBITMQ_PASSWORD = env.RABBITMQ_PASSWORD;

config.OPENSEARCH_NAME = env.OPENSEARCH_NAME;
config.ENCRYPT_OPENSEARCH = toBoolean(env.ENCRYPT_OPENSEARCH);
config.OPENSEARCH_PROTOCOL = config.ENCRYPT_OPENSEARCH ? 'https' : 'http';
config.OPENSEARCH_HOSTNAME = env.OPENSEARCH_HOSTNAME || config.HOST_IP;
config.OPENSEARCH_PORT = env.OPENSEARCH_PORT;
config.OPENSEARCH_USER = env.OPENSEARCH_USER;
config.OPENSEARCH_PASSWORD = env.OPENSEARCH_PASSWORD;
config.OPENSEARCH_VERSION = env.OPENSEARCH_VERSION || config.__DEFAULT_OPENSEARCH2_VERSION;
config.OPENSEARCH_HOST = `${config.OPENSEARCH_PROTOCOL}://${config.OPENSEARCH_USER}:${config.OPENSEARCH_PASSWORD}@${config.OPENSEARCH_HOSTNAME}:${config.OPENSEARCH_PORT}`;
config.OPENSEARCH_DOCKER_IMAGE = env.OPENSEARCH_DOCKER_IMAGE;

config.RESTRAINED_OPENSEARCH_PORT = env.RESTRAINED_OPENSEARCH_PORT;
config.RESTRAINED_OPENSEARCH_HOST = `http://${config.OPENSEARCH_USER}:${config.OPENSEARCH_PASSWORD}@${config.OPENSEARCH_HOSTNAME}:${config.RESTRAINED_OPENSEARCH_PORT}`;

config.UTILITY_SVC_NAME = env.UTILITY_SVC_NAME;
config.UTILITY_SVC_VERSION = env.UTILITY_SVC_VERSION;
config.UTILITY_SVC_DOCKER_IMAGE = env.UTILITY_SVC_DOCKER_IMAGE;
config.UTILITY_SVC_DOCKER_PROJECT_PATH = env.UTILITY_SVC_DOCKER_PROJECT_PATH;

config.KIND_DOCKER_IMAGE = env.KIND_DOCKER_IMAGE;
config.KIND_VERSION = env.KIND_VERSION;

config.BASE_DOCKER_IMAGE = env.BASE_DOCKER_IMAGE;
/**
 * When set this will skip git commands. This is useful for Dockerfile when git is not
 * available or does not work
*/
config.SKIP_GIT_COMMANDS = toBoolean(env.SKIP_GIT_COMMANDS);

// make sure the string doesn't contain unwanted characters
config.DEV_TAG = toSafeString((
    env.DEV_TAG
    || env.CI_COMMIT_REF_SLUG
    || 'local'
    // convert dependabot/npm_and_yarn/dep-x.x.x to dependabot
).split('/', 1)[0]);

/**
 * Use this to override the default dev docker image tag, if this
 * is set, using DEV_TAG is no longer needed
*/
config.DEV_DOCKER_IMAGE = env.DEV_DOCKER_IMAGE || undefined;

/**
 * Use this to skip the docker build command in e2e tests, this might be
 * useful if you pull down a cache image outside of this and you know it
 * is up-to-date
*/
config.SKIP_DOCKER_BUILD_IN_E2E = toBoolean(env.SKIP_DOCKER_BUILD_IN_E2E);

config.SKIP_DOCKER_BUILD_IN_K8S = toBoolean(env.SKIP_DOCKER_BUILD_IN_K8S);

config.SKIP_E2E_OUTPUT_LOGS = toBoolean(env.SKIP_E2E_OUTPUT_LOGS ?? (!isCI ? 'true' : 'false'));

/**
 * jest or our tests have a memory leak, limiting this seems to help
 */
config.MAX_PROJECTS_PER_BATCH = toIntegerOrThrow(env.MAX_PROJECTS_PER_BATCH);

config.REPORT_COVERAGE = toBoolean(env.REPORT_COVERAGE);

config.JEST_MAX_WORKERS = env.JEST_MAX_WORKERS
    ? toIntegerOrThrow(env.JEST_MAX_WORKERS)
    : undefined;

config.NPM_DEFAULT_REGISTRY = 'https://registry.npmjs.org/';

config.ENCRYPTION_ENABLED = config.ENCRYPT_KAFKA
    || config.ENCRYPT_MINIO
    || config.ENCRYPT_OPENSEARCH;
config.CERT_PATH = env.CERT_PATH
    || (config.ENCRYPTION_ENABLED
        ? fs.mkdtempSync(path.join(os.tmpdir(), 'ts-CAs'))
        : 'tmp/ts-certs'
    );

const testOpensearch = toBoolean(env.TEST_OPENSEARCH);
const testElasticsearch = toBoolean(env.TEST_ELASTICSEARCH);
const testRestrainedOpensearch = toBoolean(env.TEST_RESTRAINED_OPENSEARCH);
const testRestrainedElasticsearch = toBoolean(env.TEST_RESTRAINED_ELASTICSEARCH);

config.ENV_SERVICES = [
    testOpensearch ? Service.Opensearch : undefined,
    testElasticsearch ? Service.Elasticsearch : undefined,
    toBoolean(env.TEST_KAFKA) ? Service.Kafka : undefined,
    toBoolean(env.TEST_MINIO) ? Service.Minio : undefined,
    testRestrainedOpensearch ? Service.RestrainedOpensearch : undefined,
    testRestrainedElasticsearch ? Service.RestrainedElasticsearch : undefined,
    toBoolean(env.TEST_RABBITMQ) ? Service.RabbitMQ : undefined,
    toBoolean(env.ENABLE_UTILITY_SVC) ? Service.Utility : undefined,
]
    .filter(Boolean) as Service[];

const __DEFAULT_TEST_HOST = config.OPENSEARCH_HOST;
config.TEST_TERASLICE = toBoolean(env.TEST_TERASLICE);
config.TEST_OPENSEARCH = testOpensearch;
config.TEST_ELASTICSEARCH = testElasticsearch;
config.TEST_KAFKA = toBoolean(env.TEST_KAFKA);
config.TEST_MINIO = toBoolean(env.TEST_MINIO);
config.TEST_RESTRAINED_OPENSEARCH = testRestrainedOpensearch;
config.TEST_RESTRAINED_ELASTICSEARCH = testRestrainedElasticsearch;
config.TEST_RABBITMQ = toBoolean(env.TEST_RABBITMQ);
config.ENABLE_UTILITY_SVC = toBoolean(env.ENABLE_UTILITY_SVC);
let testHost;

if (testElasticsearch) {
    testHost = config.ELASTICSEARCH_HOST;
} else if (testOpensearch) {
    testHost = config.OPENSEARCH_HOST;
} else if (testRestrainedOpensearch) {
    testHost = config.RESTRAINED_OPENSEARCH_HOST;
} else if (testRestrainedElasticsearch) {
    testHost = config.RESTRAINED_ELASTICSEARCH_HOST;
} else {
    testHost = __DEFAULT_TEST_HOST;
}

config.SEARCH_TEST_HOST = env.SEARCH_TEST_HOST || testHost;

config.TEST_NODE_VERSIONS = ['22', '24'];
config.DEFAULT_NODE_VERSION = '22';
// This overrides the value in the Dockerfile
config.NODE_VERSION = env.NODE_VERSION || config.DEFAULT_NODE_VERSION;

config.CLUSTERING_TYPE = env.CLUSTERING_TYPE;
config.TEST_PLATFORM = env.TEST_PLATFORM;
config.K8S_VERSION = env.K8S_VERSION;
config.TERASLICE_IMAGE = env.TERASLICE_IMAGE;

config.DOCKER_IMAGES_PATH = env.DOCKER_IMAGES_PATH;
config.DOCKER_IMAGE_LIST_PATH = env.DOCKER_IMAGE_LIST_PATH || `${config.DOCKER_IMAGES_PATH}/image-list.txt`;
config.DOCKER_CACHE_PATH = env.DOCKER_CACHE_PATH;
config.SKIP_IMAGE_DELETION = toBoolean(env.SKIP_IMAGE_DELETION);
config.USE_HELMFILE = toBoolean(env.USE_HELMFILE);
config.ATTACH_JEST_DEBUGGER = toBoolean(env.ATTACH_JEST_DEBUGGER);

const validatedConfig = ConfigSchema.safeParse(config);
if (!validatedConfig.success) {
    throw new Error(`ts-scripts config validation failed: ${validatedConfig.error.message}`);
}

export default validatedConfig.data;
