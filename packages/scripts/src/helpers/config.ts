import ipPkg from 'ip';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
    toSafeString, isCI, toIntegerOrThrow,
    SchemaValidator, toBoolean
} from '@terascope/core-utils';
import { TestEnv, Terafoundation, ScriptsTestEnv } from '@terascope/types';
import { Service } from './interfaces.js';

/** Default elasticsearch7 version used to populate the CI cache */
const __DEFAULT_ELASTICSEARCH7_VERSION = '7.9.3';
/** Default opensearch1 version used to populate the CI cache */
const __DEFAULT_OPENSEARCH1_VERSION = '1.3.11';
/** Default opensearch2 version used to populate the CI cache */
const __DEFAULT_OPENSEARCH2_VERSION = '2.15.0';
/** Default opensearch3 version used to populate the CI cache */
const __DEFAULT_OPENSEARCH3_VERSION = '3.1.0';

const __DEFAULT_NODE_VERSION = '24';

const { address } = ipPkg;

const config: TestEnv = {};
let validatedConfig: ScriptsTestEnv;

// Any var computed by config or used by config to compute another var should not set
// an env value within 'configSchema' and should set the default to undefined
const configSchema: Terafoundation.Schema<any> = {
    // Services
    DEFAULT_ELASTICSEARCH7_VERSION: {
        default: __DEFAULT_ELASTICSEARCH7_VERSION,
        format: String,
    },
    DEFAULT_OPENSEARCH1_VERSION: {
        default: __DEFAULT_OPENSEARCH1_VERSION,
        format: String,
    },
    DEFAULT_OPENSEARCH2_VERSION: {
        default: __DEFAULT_OPENSEARCH2_VERSION,
        format: String,
    },
    DEFAULT_OPENSEARCH3_VERSION: {
        default: __DEFAULT_OPENSEARCH3_VERSION,
        format: String,
    },
    ENABLE_UTILITY_SVC: {
        default: false,
        format: Boolean,
        env: 'ENABLE_UTILITY_SVC'
    },
    ENV_SERVICES: {
        default: undefined,
        format(val: unknown) {
            if (Array.isArray(val)) {
                for (const name of val) {
                    const servicesArr = Object.values(Service);
                    if (!servicesArr.includes(name)) {
                        throw new Error(`Invalid ENV_SERVICES value. Must be one of ${servicesArr}`);
                    }
                }
            } else {
                throw new Error('ENV_SERVICES must be an array');
            }
        }
    },
    TEST_TERASLICE: {
        default: false,
        format: Boolean,
        env: 'TEST_TERASLICE'
    },
    TEST_OPENSEARCH: {
        default: false,
        format: Boolean,
        env: 'TEST_OPENSEARCH'
    },
    TEST_ELASTICSEARCH: {
        default: false,
        format: Boolean,
        env: 'TEST_ELASTICSEARCH'
    },
    TEST_KAFKA: {
        default: false,
        format: Boolean,
        env: 'TEST_KAFKA'
    },
    TEST_MINIO: {
        default: false,
        format: Boolean,
        env: 'TEST_MINIO'
    },
    TEST_RESTRAINED_OPENSEARCH: {
        default: false,
        format: Boolean,
        env: 'TEST_RESTRAINED_OPENSEARCH'
    },
    TEST_RESTRAINED_ELASTICSEARCH: {
        default: false,
        format: Boolean,
        env: 'TEST_RESTRAINED_ELASTICSEARCH'
    },
    TEST_RABBITMQ: {
        default: false,
        format: Boolean,
        env: 'TEST_RABBITMQ'
    },

    // General config
    ATTACH_JEST_DEBUGGER: {
        default: false,
        format: Boolean,
        env: 'ATTACH_JEST_DEBUGGER'
    },
    CERT_PATH: {
        default: undefined,
        format: String,
    },
    CI_COMMIT_REF_SLUG: {
        default: null,
        format: 'optional_string',
        env: 'CI_COMMIT_REF_SLUG'
    },
    DEV_DOCKER_IMAGE: {
        doc: 'Use this to override the default dev docker image tag, if this is set, using DEV_TAG is no longer needed',
        default: null,
        format: 'optional_string',
        env: 'DEV_DOCKER_IMAGE'
    },
    DEV_TAG: {
        default: null,
        format: 'optional_string',
    },
    DOCKER_CACHE_PATH: {
        default: '/tmp/docker_cache',
        format: String,
        env: 'DOCKER_CACHE_PATH'
    },
    DOCKER_IMAGES_PATH: {
        default: undefined,
        format: String,
    },
    DOCKER_IMAGE_LIST_PATH: {
        default: undefined,
        format: String,
    },
    DOCKER_NETWORK_NAME: {
        default: null,
        format: 'optional_string',
        env: 'DOCKER_NETWORK_NAME'
    },
    ENCRYPTION_ENABLED: {
        default: undefined,
        format: Boolean,
    },
    FORCE_COLOR: {
        default: undefined,
        format: ['0', '1'],
    },
    HOST_IP: {
        default: undefined,
        format: String,
    },
    JEST_MAX_WORKERS: {
        default: null,
        format: 'optional_int',
        env: 'JEST_MAX_WORKERS'
    },
    K8S_VERSION: {
        default: null,
        format: 'optional_string',
        env: 'K8S_VERSION'
    },
    MAX_PROJECTS_PER_BATCH: {
        default: undefined,
        format: 'int',
    },
    NODE_VERSION: {
        doc: 'Node version to use. This overrides the value in the Dockerfile',
        default: __DEFAULT_NODE_VERSION,
        format: String,
        env: 'NODE_VERSION'
    },
    NPM_DEFAULT_REGISTRY: {
        default: 'https://registry.npmjs.org/',
        format: String,
    },
    REPORT_COVERAGE: {
        default: false,
        format: Boolean,
        env: 'REPORT_COVERAGE'
    },
    SERVICE_HEAP_OPTS: {
        default: '-Xms512m -Xmx512m',
        format: String,
        env: 'SERVICE_HEAP_OPTS'
    },
    SERVICE_UP_TIMEOUT: {
        doc: 'The timeout for how long a service has to stand up',
        default: '2m',
        format: String,
        env: 'SERVICE_UP_TIMEOUT'
    },
    SERVICES_USE_TMPFS: {
        default: true,
        format: Boolean,
        env: 'SERVICES_USE_TMPFS'
    },
    SKIP_DOCKER_BUILD_IN_E2E: {
        doc: 'Use this to skip the docker build command in e2e tests, this might be '
            + 'useful if you pull down a cache image outside of this and you know it '
            + 'is up-to-date',
        default: false,
        format: Boolean,
        env: 'SKIP_DOCKER_BUILD_IN_E2E'
    },
    SKIP_DOCKER_BUILD_IN_K8S: {
        default: false,
        format: Boolean,
        env: 'SKIP_DOCKER_BUILD_IN_K8S'
    },
    SKIP_E2E_OUTPUT_LOGS: {
        default: undefined,
        format: Boolean,
    },
    SKIP_GIT_COMMANDS: {
        doc: 'When set this will skip git commands. This is useful for Dockerfile when git is not available or does not work',
        default: false,
        format: Boolean,
        env: 'SKIP_GIT_COMMANDS'
    },
    SKIP_IMAGE_DELETION: {
        default: false,
        format: Boolean,
        env: 'SKIP_IMAGE_DELETION'
    },
    TERASLICE_IMAGE: {
        default: null,
        format: 'optional_string',
        env: 'TERASLICE_IMAGE'
    },
    TEST_NAMESPACE: {
        default: 'ts_test',
        format: String,
        env: 'TEST_NAMESPACE'
    },
    USE_EXISTING_SERVICES: {
        default: false,
        format: Boolean,
        env: 'USE_EXISTING_SERVICES'
    },
    USE_HELMFILE: {
        default: false,
        format: Boolean,
        env: 'USE_HELMFILE'
    },

    // Elasticsearch config
    ELASTICSEARCH_DOCKER_IMAGE: {
        default: 'elasticsearch',
        format: String,
        env: 'ELASTICSEARCH_DOCKER_IMAGE'
    },
    ELASTICSEARCH_HOST: {
        default: undefined,
        format: String,
    },
    ELASTICSEARCH_HOSTNAME: {
        default: undefined,
        format: String,
    },
    ELASTICSEARCH_NAME: {
        default: 'elasticsearch',
        format: String,
        env: 'ELASTICSEARCH_NAME'
    },
    ELASTICSEARCH_PORT: {
        default: undefined,
        format: Number,
    },
    ELASTICSEARCH_VERSION: {
        default: __DEFAULT_ELASTICSEARCH7_VERSION,
        format: String,
        env: 'ELASTICSEARCH_VERSION'
    },
    RESTRAINED_ELASTICSEARCH_HOST: {
        default: undefined,
        format: String,
    },
    RESTRAINED_ELASTICSEARCH_PORT: {
        default: undefined,
        format: Number,
    },

    // Kafka config
    ENCRYPT_KAFKA: {
        default: undefined,
        format: Boolean,
    },
    KAFKA_ADVERTISED_LISTENERS: {
        default: undefined,
        format: String,
    },
    KAFKA_BROKER: {
        default: undefined,
        format: String,
    },
    KAFKA_CONTROLLER_LISTENER_NAMES: {
        default: 'CONTROLLER',
        format: String,
        env: 'KAFKA_CONTROLLER_LISTENER_NAMES'
    },
    KAFKA_CONTROLLER_QUORUM_VOTERS: {
        default: '1@0.0.0.0:9093',
        format: String,
        env: 'KAFKA_CONTROLLER_QUORUM_VOTERS'
    },
    KAFKA_DOCKER_IMAGE: {
        default: 'apache/kafka',
        format: String,
        env: 'KAFKA_DOCKER_IMAGE'
    },
    KAFKA_GROUP_INITIAL_REBALANCE_DELAY_MS: {
        default: '0',
        format: String,
        env: 'KAFKA_GROUP_INITIAL_REBALANCE_DELAY_MS'
    },
    KAFKA_HOSTNAME: {
        default: undefined,
        format: String,
    },
    KAFKA_INTER_BROKER_LISTENER_NAME: {
        default: 'INTERNAL',
        format: String,
        env: 'KAFKA_INTER_BROKER_LISTENER_NAME'
    },
    KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: {
        default: undefined,
        format: String,
    },
    KAFKA_LISTENERS: {
        default: undefined,
        format: String,
    },
    KAFKA_NAME: {
        default: 'kafka',
        format: String,
        env: 'KAFKA_NAME'
    },
    KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: {
        default: '1',
        format: String,
        env: 'KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR'
    },
    KAFKA_NODE_ID: {
        default: '1',
        format: String,
        env: 'KAFKA_NODE_ID'
    },
    KAFKA_PORT: {
        default: undefined,
        format: Number,
    },
    KAFKA_PROCESS_ROLES: {
        default: 'broker,controller',
        format: String,
        env: 'KAFKA_PROCESS_ROLES'
    },
    KAFKA_SECRETS_DIR: {
        default: '/etc/kafka/secrets',
        format: String,
        env: 'KAFKA_SECRETS_DIR'
    },
    KAFKA_SECURITY_PROTOCOL: {
        default: undefined,
        format: String,
    },
    KAFKA_TRANSACTION_STATE_LOG_MIN_ISR: {
        default: '1',
        format: String,
        env: 'KAFKA_TRANSACTION_STATE_LOG_MIN_ISR'
    },
    KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR: {
        default: '1',
        format: String,
        env: 'KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR'
    },
    KAFKA_VERSION: {
        default: '3.7.2',
        format: String,
        env: 'KAFKA_VERSION'
    },

    // Kind config
    KIND_DOCKER_IMAGE: {
        default: 'kindest/node',
        format: String,
        env: 'KIND_DOCKER_IMAGE'
    },
    KIND_VERSION: {
        default: 'v1.30.0',
        format: String,
        env: 'KIND_VERSION'
    },

    // Minio config
    ENCRYPT_MINIO: {
        default: undefined,
        format: Boolean,
    },
    MINIO_ACCESS_KEY: {
        default: 'minioadmin',
        format: String,
        env: 'MINIO_ACCESS_KEY'
    },
    MINIO_DOCKER_IMAGE: {
        default: 'minio/minio',
        format: String,
        env: 'MINIO_DOCKER_IMAGE'
    },
    MINIO_HOST: {
        default: undefined,
        format: String,
    },
    MINIO_HOSTNAME: {
        default: undefined,
        format: String,
    },
    MINIO_NAME: {
        default: 'minio',
        format: String,
        env: 'MINIO_NAME'
    },
    MINIO_PORT: {
        default: undefined,
        format: Number,
    },
    MINIO_PROTOCOL: {
        default: undefined,
        format: ['http', 'https'],
    },
    MINIO_SECRET_KEY: {
        default: 'minioadmin',
        format: String,
        env: 'MINIO_SECRET_KEY'
    },
    MINIO_UI_PORT: {
        default: 49001,
        format: Number,
        env: 'MINIO_UI_PORT'
    },
    MINIO_VERSION: {
        default: 'RELEASE.2024-08-29T01-40-52Z',
        format: String,
        env: 'MINIO_VERSION'
    },

    // OpenSearch config
    ENCRYPT_OPENSEARCH: {
        default: undefined,
        format: Boolean,
    },
    OPENSEARCH_DOCKER_IMAGE: {
        default: 'opensearchproject/opensearch',
        format: String,
        env: 'OPENSEARCH_DOCKER_IMAGE'
    },
    OPENSEARCH_HOST: {
        default: undefined,
        format: String,
    },
    OPENSEARCH_HOSTNAME: {
        default: undefined,
        format: String,
    },
    OPENSEARCH_NAME: {
        default: 'opensearch',
        format: String,
        env: 'OPENSEARCH_NAME'
    },
    OPENSEARCH_PASSWORD: {
        default: undefined,
        format: String,
    },
    OPENSEARCH_PORT: {
        default: undefined,
        format: Number,
    },
    OPENSEARCH_PROTOCOL: {
        default: undefined,
        format: ['http', 'https'],
    },
    OPENSEARCH_SSL_HOST: {
        default: undefined,
        format: String,
    },
    OPENSEARCH_USER: {
        default: undefined,
        format: String,
    },
    OPENSEARCH_VERSION: {
        default: __DEFAULT_OPENSEARCH2_VERSION,
        format: String,
        env: 'OPENSEARCH_VERSION'
    },
    RESTRAINED_OPENSEARCH_HOST: {
        default: undefined,
        format: String,
    },
    RESTRAINED_OPENSEARCH_PORT: {
        default: undefined,
        format: Number,
    },

    // RabbitMQ config
    RABBITMQ_DOCKER_IMAGE: {
        default: 'rabbitmq',
        format: String,
        env: 'RABBITMQ_DOCKER_IMAGE'
    },
    RABBITMQ_HOST: {
        default: undefined,
        format: String,
    },
    RABBITMQ_HOSTNAME: {
        default: undefined,
        format: String,
    },
    RABBITMQ_MANAGEMENT: {
        default: undefined,
        format: String,
    },
    RABBITMQ_MANAGEMENT_PORT: {
        default: undefined,
        format: Number,
    },
    RABBITMQ_NAME: {
        default: 'rabbitmq',
        format: String,
        env: 'RABBITMQ_NAME'
    },
    RABBITMQ_PASSWORD: {
        default: 'guest',
        format: String,
        env: 'RABBITMQ_PASSWORD'
    },
    RABBITMQ_PORT: {
        default: undefined,
        format: Number,
    },
    RABBITMQ_USER: {
        default: 'guest',
        format: String,
        env: 'RABBITMQ_USER'
    },
    RABBITMQ_VERSION: {
        default: '3.13.7-management',
        format: String,
        env: 'RABBITMQ_VERSION'
    },

    // Teraslice Config
    ASSET_STORAGE_CONNECTION: {
        default: 'default',
        format: String,
        env: 'ASSET_STORAGE_CONNECTION'
    },
    ASSET_STORAGE_CONNECTION_TYPE: {
        default: 'elasticsearch-next',
        format: String,
        env: 'ASSET_STORAGE_CONNECTION_TYPE'
    },
    CLUSTERING_TYPE: {
        default: 'kubernetesV2',
        format: ['kubernetesV2'],
        env: 'CLUSTERING_TYPE'
    },
    SEARCH_TEST_HOST: {
        default: undefined,
        format: String,
    },
    TERASLICE_PORT: {
        default: 45678,
        format: Number,
        env: 'TERASLICE_PORT'
    },
    TEST_PLATFORM: {
        default: 'native',
        format: ['native', 'kubernetesV2'],
        env: 'TEST_PLATFORM'
    },

    // Utility service config
    UTILITY_SVC_DOCKER_IMAGE: {
        default: 'teraslice-utility',
        format: String,
        env: 'UTILITY_SVC_DOCKER_IMAGE'
    },
    UTILITY_SVC_DOCKER_PROJECT_PATH: {
        default: 'e2e/helm/utility',
        format: String,
        env: 'UTILITY_SVC_DOCKER_PROJECT_PATH'
    },
    UTILITY_SVC_NAME: {
        default: 'utility-svc',
        format: String,
        env: 'UTILITY_SVC_NAME'
    },
    UTILITY_SVC_VERSION: {
        default: '0.0.1',
        format: String,
        env: 'UTILITY_SVC_VERSION'
    },
};

const forceColor = process.env.FORCE_COLOR || '1';
config.FORCE_COLOR = toBoolean(forceColor)
    ? '1'
    : '0';

config.HOST_IP = process.env.HOST_IP || address();

config.ELASTICSEARCH_HOSTNAME = process.env.ELASTICSEARCH_HOSTNAME || config.HOST_IP;
config.ELASTICSEARCH_PORT = Number(process.env.ELASTICSEARCH_PORT) || 49200;

config.ELASTICSEARCH_HOST = `http://${config.ELASTICSEARCH_HOSTNAME}:${config.ELASTICSEARCH_PORT}`;

config.RESTRAINED_ELASTICSEARCH_PORT = Number(process.env.RESTRAINED_ELASTICSEARCH_PORT) || 49202;
config.RESTRAINED_ELASTICSEARCH_HOST = `http://${config.ELASTICSEARCH_HOSTNAME}:${config.RESTRAINED_ELASTICSEARCH_PORT}`;

config.ENCRYPT_KAFKA = toBoolean(process.env.ENCRYPT_KAFKA) || false;
config.KAFKA_HOSTNAME = process.env.KAFKA_HOSTNAME || config.HOST_IP;
config.KAFKA_PORT = Number(process.env.KAFKA_PORT) || 49094;
config.KAFKA_BROKER = `${config.KAFKA_HOSTNAME}:${config.KAFKA_PORT}`;
config.KAFKA_ADVERTISED_LISTENERS = process.env.KAFKA_ADVERTISED_LISTENERS || `INTERNAL://${config.KAFKA_HOSTNAME}:${config.KAFKA_PORT}`;
config.KAFKA_SECURITY_PROTOCOL = process.env.KAFKA_SECURITY_PROTOCOL || (config.ENCRYPT_KAFKA ? 'SSL' : 'PLAINTEXT');
config.KAFKA_LISTENER_SECURITY_PROTOCOL_MAP = process.env.KAFKA_LISTENER_SECURITY_PROTOCOL_MAP || `INTERNAL:${config.KAFKA_SECURITY_PROTOCOL}, CONTROLLER:PLAINTEXT`;
config.KAFKA_LISTENERS = process.env.KAFKA_LISTENERS || `INTERNAL://0.0.0.0:${config.KAFKA_PORT}, CONTROLLER://:9093`;

config.ENCRYPT_MINIO = toBoolean(process.env.ENCRYPT_MINIO) || false;
config.MINIO_HOSTNAME = process.env.MINIO_HOSTNAME || config.HOST_IP;
config.MINIO_PORT = Number(process.env.MINIO_PORT) || 49000;
config.MINIO_PROTOCOL = config.ENCRYPT_MINIO ? 'https' : 'http';
config.MINIO_HOST = `${config.MINIO_PROTOCOL}://${config.MINIO_HOSTNAME}:${config.MINIO_PORT}`;

config.RABBITMQ_PORT = Number(process.env.RABBITMQ_PORT) || 45672;
config.RABBITMQ_MANAGEMENT_PORT = Number(process.env.RABBITMQ_MANAGEMENT_PORT) || 55672;
config.RABBITMQ_HOSTNAME = process.env.RABBITMQ_HOSTNAME || config.HOST_IP;
config.RABBITMQ_HOST = `http://${config.RABBITMQ_HOSTNAME}:${config.RABBITMQ_PORT}`;
config.RABBITMQ_MANAGEMENT = `http://${config.RABBITMQ_HOSTNAME}:${config.RABBITMQ_MANAGEMENT_PORT}`;

config.ENCRYPT_OPENSEARCH = toBoolean(process.env.ENCRYPT_OPENSEARCH) || false;
config.OPENSEARCH_PROTOCOL = config.ENCRYPT_OPENSEARCH ? 'https' : 'http';
config.OPENSEARCH_HOSTNAME = process.env.OPENSEARCH_HOSTNAME || config.HOST_IP;
config.OPENSEARCH_PORT = Number(process.env.OPENSEARCH_PORT) || 49210;
config.OPENSEARCH_USER = process.env.OPENSEARCH_USER || 'admin';
config.OPENSEARCH_PASSWORD = process.env.OPENSEARCH_PASSWORD || 'admin';
config.OPENSEARCH_HOST = `${config.OPENSEARCH_PROTOCOL}://${config.OPENSEARCH_USER}:${config.OPENSEARCH_PASSWORD}@${config.OPENSEARCH_HOSTNAME}:${config.OPENSEARCH_PORT}`;
config.OPENSEARCH_SSL_HOST = `https://${config.OPENSEARCH_HOSTNAME}:${config.OPENSEARCH_PORT}`;

config.RESTRAINED_OPENSEARCH_PORT = Number(process.env.RESTRAINED_OPENSEARCH_PORT) || 49206;
config.RESTRAINED_OPENSEARCH_HOST = `http://${config.OPENSEARCH_USER}:${config.OPENSEARCH_PASSWORD}@${config.OPENSEARCH_HOSTNAME}:${config.RESTRAINED_OPENSEARCH_PORT}`;

// make sure the string doesn't contain unwanted characters
config.DEV_TAG = toSafeString((
    process.env.DEV_TAG
    || process.env.CI_COMMIT_REF_SLUG
    || 'local'
    // convert dependabot/npm_and_yarn/dep-x.x.x to dependabot
).split('/', 1)[0]);

config.SKIP_E2E_OUTPUT_LOGS = toBoolean(process.env.SKIP_E2E_OUTPUT_LOGS) ?? (!isCI ? true : false);

/**
 * jest or our tests have a memory leak, limiting this seems to help
*/
config.MAX_PROJECTS_PER_BATCH = toIntegerOrThrow(process.env.MAX_PROJECTS_PER_BATCH ?? 5);

config.ENCRYPTION_ENABLED = toBoolean(process.env.ENCRYPT_KAFKA)
    || toBoolean(process.env.ENCRYPT_MINIO)
    || toBoolean(process.env.ENCRYPT_OPENSEARCH);

config.CERT_PATH = process.env.CERT_PATH
    || (config.ENCRYPTION_ENABLED
        ? fs.mkdtempSync(path.join(os.tmpdir(), 'ts-CAs'))
        : 'tmp/ts-certs');

const testOpensearch = toBoolean(process.env.TEST_OPENSEARCH);
const testElasticsearch = toBoolean(process.env.TEST_ELASTICSEARCH);
const testRestrainedOpensearch = toBoolean(process.env.TEST_RESTRAINED_OPENSEARCH);
const testRestrainedElasticsearch = toBoolean(process.env.TEST_RESTRAINED_ELASTICSEARCH);

config.ENV_SERVICES = [
    testOpensearch ? Service.Opensearch : undefined,
    testElasticsearch ? Service.Elasticsearch : undefined,
    toBoolean(process.env.TEST_KAFKA) ? Service.Kafka : undefined,
    toBoolean(process.env.TEST_MINIO) ? Service.Minio : undefined,
    testRestrainedOpensearch ? Service.RestrainedOpensearch : undefined,
    testRestrainedElasticsearch ? Service.RestrainedElasticsearch : undefined,
    toBoolean(process.env.TEST_RABBITMQ) ? Service.RabbitMQ : undefined,
    toBoolean(process.env.ENABLE_UTILITY_SVC) ? Service.Utility : undefined,
]
    .filter(Boolean) as Service[];

const __DEFAULT_TEST_HOST = config.OPENSEARCH_HOST;
let testHost = __DEFAULT_TEST_HOST;

if (testElasticsearch) {
    testHost = config.ELASTICSEARCH_HOST;
} else if (testOpensearch) {
    testHost = config.OPENSEARCH_HOST;
} else if (testRestrainedOpensearch) {
    testHost = config.RESTRAINED_OPENSEARCH_HOST;
} else if (testRestrainedElasticsearch) {
    testHost = config.RESTRAINED_ELASTICSEARCH_HOST;
}

config.SEARCH_TEST_HOST = process.env.SEARCH_TEST_HOST || testHost;

config.DOCKER_IMAGES_PATH = process.env.DOCKER_IMAGES_PATH || './images';
config.DOCKER_IMAGE_LIST_PATH = process.env.DOCKER_IMAGE_LIST_PATH || `${config.DOCKER_IMAGES_PATH}/image-list.txt`;

try {
    const configValidator = new SchemaValidator<ScriptsTestEnv>(configSchema, 'scriptsConfigSchema');
    validatedConfig = configValidator.validate(config);
} catch (err) {
    throw new Error(`ts-scripts config validation failed: ${err}`);
}

export default validatedConfig;
