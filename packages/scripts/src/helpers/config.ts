import ipPkg from 'ip';
import {
    toBoolean, toSafeString, isCI,
    toIntegerOrThrow
} from '@terascope/utils';
import { Service } from './interfaces.js';
import { kafkaVersionMapper } from './mapper.js';

const { address } = ipPkg;

const forceColor = process.env.FORCE_COLOR || '1';
export const FORCE_COLOR = toBoolean(forceColor)
    ? '1'
    : '0';
/** The timeout for how long a service has to stand up */
export const SERVICE_UP_TIMEOUT = process.env.SERVICE_UP_TIMEOUT ?? '2m';

/** Default elasticsearch6 version used to populate the CI cache */
export const __DEFAULT_ELASTICSEARCH6_VERSION = '6.8.6';
/** Default elasticsearch7 version used to populate the CI cache */
export const __DEFAULT_ELASTICSEARCH7_VERSION = '7.9.3';
/** Default opensearch1 version used to populate the CI cache */
export const __DEFAULT_OPENSEARCH1_VERSION = '1.3.11';
/** Default opensearch2 version used to populate the CI cache */
export const __DEFAULT_OPENSEARCH2_VERSION = '2.15.0';

export const TERASLICE_PORT = '45678';
export const HOST_IP = process.env.HOST_IP || address();
export const USE_EXISTING_SERVICES = toBoolean(process.env.USE_EXISTING_SERVICES);
export const SERVICES_USE_TMPFS = toBoolean(process.env.SERVICES_USE_TMPFS || 'true');
export const SERVICE_HEAP_OPTS = process.env.SERVICE_HEAP_OPTS || '-Xms512m -Xmx512m';
export const DOCKER_NETWORK_NAME = process.env.DOCKER_NETWORK_NAME || undefined;
export const TEST_NAMESPACE = process.env.TEST_NAMESPACE || 'ts_test';
export const ASSET_STORAGE_CONNECTION_TYPE = process.env.ASSET_STORAGE_CONNECTION_TYPE || 'elasticsearch-next';
export const ASSET_STORAGE_CONNECTION = process.env.ASSET_STORAGE_CONNECTION || 'default';

export const ELASTICSEARCH_NAME = process.env.ELASTICSEARCH_NAME || 'elasticsearch';
export const ELASTICSEARCH_HOSTNAME = process.env.ELASTICSEARCH_HOSTNAME || HOST_IP;
export const ELASTICSEARCH_PORT = process.env.ELASTICSEARCH_PORT || '49200';
export const ELASTICSEARCH_HOST = `http://${ELASTICSEARCH_HOSTNAME}:${ELASTICSEARCH_PORT}`;
export const ELASTICSEARCH_VERSION = process.env.ELASTICSEARCH_VERSION
    || __DEFAULT_ELASTICSEARCH7_VERSION;
export const ELASTICSEARCH_DOCKER_IMAGE = process.env.ELASTICSEARCH_DOCKER_IMAGE || 'elasticsearch';

export const RESTRAINED_ELASTICSEARCH_PORT = process.env.RESTRAINED_ELASTICSEARCH_PORT || '49202';
export const RESTRAINED_ELASTICSEARCH_HOST = `http://${ELASTICSEARCH_HOSTNAME}:${RESTRAINED_ELASTICSEARCH_PORT}`;

export const KAFKA_NAME = process.env.KAFKA_NAME || 'kafka';
export const KAFKA_HOSTNAME = process.env.KAFKA_HOSTNAME || HOST_IP;
export const KAFKA_PORT = process.env.KAFKA_PORT || '49094';
export const KAFKA_BROKER = `${KAFKA_HOSTNAME}:${KAFKA_PORT}`;
export const KAFKA_VERSION = process.env.KAFKA_VERSION || '3.7.2';
export const KAFKA_DOCKER_IMAGE = process.env.KAFKA_DOCKER_IMAGE || 'confluentinc/cp-kafka';
// If using confluentinc/cp-kafka image, use kafkaVersionMapper
// to determine image version, else use KAFKA_VERSION
export const KAFKA_IMAGE_VERSION = KAFKA_DOCKER_IMAGE === 'confluentinc/cp-kafka' ? kafkaVersionMapper(KAFKA_VERSION) : KAFKA_VERSION;
// If using confluentinc/cp-kafka image, use zookeeper, else use kraft
export const KAFKA_METADATA_MANAGER = KAFKA_DOCKER_IMAGE === 'confluentinc/cp-kafka' ? 'zookeeper' : 'kraft';
// Zookeeper version needs to match KAFKA_IMAGE_VERSION which is determined by kafkaVersionMapper
export const ZOOKEEPER_VERSION = KAFKA_IMAGE_VERSION;
export const ZOOKEEPER_CLIENT_PORT = process.env.ZOOKEEPER_CLIENT_PORT || '42181';
export const ZOOKEEPER_TICK_TIME = process.env.ZOOKEEPER_TICK_TIME || '2000';
export const ZOOKEEPER_DOCKER_IMAGE = process.env.ZOOKEEPER_DOCKER_IMAGE || 'confluentinc/cp-zookeeper';
export const KAFKA_BROKER_ID = process.env.KAFKA_BROKER_ID || '1';
export const KAFKA_ZOOKEEPER_CONNECT = `${KAFKA_HOSTNAME}:${ZOOKEEPER_CLIENT_PORT}`;
export const KAFKA_LISTENERS = `INTERNAL://:${KAFKA_PORT}`;
export const KAFKA_ADVERTISED_LISTENERS = `INTERNAL://${KAFKA_HOSTNAME}:${KAFKA_PORT}`;
export const ENCRYPT_KAFKA = toBoolean(process.env.ENCRYPT_KAFKA ?? false);
export const KAFKA_SECURITY_PROTOCOL = ENCRYPT_KAFKA ? 'SSL' : 'PLAINTEXT';
export const KAFKA_LISTENER_SECURITY_PROTOCOL_MAP = `INTERNAL:${KAFKA_SECURITY_PROTOCOL}`;
export const KAFKA_SECRETS_DIR = process.env.KAFKA_SECRETS_DIR || '/etc/kafka/secrets';
export const KAFKA_INTER_BROKER_LISTENER_NAME = process.env.KAFKA_INTER_BROKER_LISTENER_NAME || 'INTERNAL';
export const KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR = process.env.KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR || '1';

export const MINIO_NAME = process.env.MINIO_NAME || 'minio';
export const MINIO_HOSTNAME = process.env.MINIO_HOSTNAME || HOST_IP;
export const MINIO_PORT = process.env.MINIO_PORT || '49000';
export const MINIO_UI_PORT = process.env.MINIO_UI_PORT || '49001';
export const ENCRYPT_MINIO = toBoolean(process.env.ENCRYPT_MINIO ?? false);
export const MINIO_HOST = `http${ENCRYPT_MINIO ? 's' : ''}://${MINIO_HOSTNAME}:${MINIO_PORT}`;
export const MINIO_VERSION = process.env.MINIO_VERSION || 'RELEASE.2024-08-29T01-40-52Z';
export const MINIO_DOCKER_IMAGE = process.env.MINIO_DOCKER_IMAGE || 'minio/minio';
export const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY || 'minioadmin';
export const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY || 'minioadmin';

export const RABBITMQ_VERSION = process.env.RABBITMQ_VERSION || '3.13.7-management';
export const RABBITMQ_DOCKER_IMAGE = process.env.RABBITMQ_DOCKER_IMAGE || 'rabbitmq';
export const RABBITMQ_NAME = process.env.RABBITMQ_NAME || 'rabbitmq';
export const RABBITMQ_PORT = process.env.RABBITMQ_PORT || 45672;
export const RABBITMQ_MANAGEMENT_PORT = process.env.RABBITMQ_MANAGEMENT_PORT || 55672;
export const RABBITMQ_HOSTNAME = process.env.RABBITMQ_HOSTNAME || HOST_IP;
export const RABBITMQ_HOST = `http://${RABBITMQ_HOSTNAME}:${RABBITMQ_PORT}`;
export const RABBITMQ_MANAGEMENT = `http://${RABBITMQ_HOSTNAME}:${RABBITMQ_MANAGEMENT_PORT}`;

export const RABBITMQ_USER = process.env.RABBITMQ_USER || 'guest';
export const RABBITMQ_PASSWORD = process.env.RABBITMQ_PASSWORD || 'guest';

export const OPENSEARCH_NAME = process.env.OPENSEARCH_NAME || 'opensearch';
export const ENCRYPT_OPENSEARCH = toBoolean(process.env.ENCRYPT_OPENSEARCH ?? false);
export const OPENSEARCH_PROTOCOL = ENCRYPT_OPENSEARCH ? 'https' : 'http';
export const OPENSEARCH_HOSTNAME = process.env.OPENSEARCH_HOSTNAME || HOST_IP;
export const OPENSEARCH_PORT = process.env.OPENSEARCH_PORT || '49210';
export const OPENSEARCH_USER = process.env.OPENSEARCH_USER || 'admin';
export const OPENSEARCH_PASSWORD = process.env.OPENSEARCH_PASSWORD || 'admin';
export const OPENSEARCH_VERSION = process.env.OPENSEARCH_VERSION || __DEFAULT_OPENSEARCH1_VERSION;
export const OPENSEARCH_HOST = `${OPENSEARCH_PROTOCOL}://${OPENSEARCH_USER}:${OPENSEARCH_PASSWORD}@${OPENSEARCH_HOSTNAME}:${OPENSEARCH_PORT}`;
export const OPENSEARCH_DOCKER_IMAGE = process.env.OPENSEARCH_DOCKER_IMAGE || 'opensearchproject/opensearch';

export const RESTRAINED_OPENSEARCH_PORT = process.env.RESTRAINED_OPENSEARCH_PORT || '49206';
export const RESTRAINED_OPENSEARCH_HOST = `http://${OPENSEARCH_USER}:${OPENSEARCH_PASSWORD}@${OPENSEARCH_HOSTNAME}:${RESTRAINED_OPENSEARCH_PORT}`;

export const UTILITY_SVC_NAME = process.env.UTILITY_SVC_NAME || 'utility-svc';
export const UTILITY_SVC_VERSION = process.env.UTILITY_SVC_VERSION || '0.0.1';
export const UTILITY_SVC_DOCKER_IMAGE = process.env.UTILITY_SVC_DOCKER_IMAGE || 'teraslice-utility';
export const UTILITY_SVC_DOCKER_PROJECT_PATH = process.env.UTILITY_SVC_DOCKER_PROJECT_PATH || 'e2e/helm/utility';

export const KIND_DOCKER_IMAGE = 'kindest/node';
export const KIND_VERSION = 'v1.30.0';

export const BASE_DOCKER_IMAGE = 'ghcr.io/terascope/node-base';
/**
 * When set this will skip git commands. This is useful for Dockerfile when git is not
 * available or does not work
*/
export const SKIP_GIT_COMMANDS = toBoolean(process.env.SKIP_GIT_COMMANDS ?? false);

// make sure the string doesn't contain unwanted characters
export const DEV_TAG = toSafeString((
    process.env.DEV_TAG
    || process.env.TRAVIS_PULL_REQUEST_BRANCH
    || process.env.TRAVIS_BRANCH
    || process.env.CI_COMMIT_REF_SLUG
    || 'local'
    // convert dependabot/npm_and_yarn/dep-x.x.x to dependabot
).split('/', 1)[0]);

/**
 * Use this to override the default dev docker image tag, if this
 * is set, using DEV_TAG is no longer needed
*/
export const DEV_DOCKER_IMAGE = process.env.DEV_DOCKER_IMAGE || undefined;

/**
 * Use this to skip the docker build command in e2e tests, this might be
 * useful if you pull down a cache image outside of this and you know it
 * is up-to-date
*/
export const SKIP_DOCKER_BUILD_IN_E2E = toBoolean(process.env.SKIP_DOCKER_BUILD_IN_E2E ?? false);

export const SKIP_DOCKER_BUILD_IN_K8S = toBoolean(process.env.SKIP_DOCKER_BUILD_IN_K8S ?? false);

export const SKIP_E2E_OUTPUT_LOGS = toBoolean(process.env.SKIP_E2E_OUTPUT_LOGS ?? !isCI);

/**
 * jest or our tests have a memory leak, limiting this seems to help
 */
export const MAX_PROJECTS_PER_BATCH = toIntegerOrThrow(process.env.MAX_PROJECTS_PER_BATCH ?? 5);

const reportCov = process.env.REPORT_COVERAGE || 'false';
export const REPORT_COVERAGE = toBoolean(reportCov);

export const JEST_MAX_WORKERS = process.env.JEST_MAX_WORKERS
    ? toIntegerOrThrow(process.env.JEST_MAX_WORKERS)
    : undefined;

export const NPM_DEFAULT_REGISTRY = 'https://registry.npmjs.org/';

const {
    TEST_OPENSEARCH = undefined,
    TEST_ELASTICSEARCH = undefined,
    TEST_KAFKA = undefined,
    TEST_MINIO = undefined,
    TEST_RESTRAINED_OPENSEARCH = undefined,
    TEST_RESTRAINED_ELASTICSEARCH = undefined,
    TEST_RABBITMQ = undefined,
    ENABLE_UTILITY_SVC = undefined
} = process.env;

const testOpensearch = toBoolean(TEST_OPENSEARCH);
const testElasticsearch = toBoolean(TEST_ELASTICSEARCH);
const testRestrainedOpensearch = toBoolean(TEST_RESTRAINED_OPENSEARCH);
const testRestrainedElasticsearch = toBoolean(TEST_RESTRAINED_ELASTICSEARCH);

/// couple kafka with zookeeper if using cp-kafka image
const testZookeeper = toBoolean(TEST_KAFKA) && KAFKA_METADATA_MANAGER === 'zookeeper';

export const ENV_SERVICES = [
    testOpensearch ? Service.Opensearch : undefined,
    testElasticsearch ? Service.Elasticsearch : undefined,
    toBoolean(TEST_KAFKA) ? Service.Kafka : undefined,
    testZookeeper ? Service.Zookeeper : undefined,
    toBoolean(TEST_MINIO) ? Service.Minio : undefined,
    testRestrainedOpensearch ? Service.RestrainedOpensearch : undefined,
    testRestrainedElasticsearch ? Service.RestrainedElasticsearch : undefined,
    toBoolean(TEST_RABBITMQ) ? Service.RabbitMQ : undefined,
    toBoolean(ENABLE_UTILITY_SVC) ? Service.Utility : undefined,
]
    .filter(Boolean) as Service[];

let testHost;

if (testElasticsearch) {
    testHost = ELASTICSEARCH_HOST;
} else if (testOpensearch) {
    testHost = OPENSEARCH_HOST;
} else if (testRestrainedOpensearch) {
    testHost = RESTRAINED_OPENSEARCH_HOST;
} else if (testRestrainedElasticsearch) {
    testHost = RESTRAINED_ELASTICSEARCH_HOST;
}

export const SEARCH_TEST_HOST = testHost;

export const TEST_NODE_VERSIONS = ['22', '24'];
export const DEFAULT_NODE_VERSION = '22';
// This overrides the value in the Dockerfile
export const NODE_VERSION = process.env.NODE_VERSION || DEFAULT_NODE_VERSION;

export const {
    CLUSTERING_TYPE = 'kubernetes',
    TEST_PLATFORM = 'native',
    K8S_VERSION = undefined,
    TERASLICE_IMAGE = undefined
} = process.env;

export const DOCKER_IMAGES_PATH = './images';
export const DOCKER_IMAGE_LIST_PATH = `${DOCKER_IMAGES_PATH}/image-list.txt`;
export const DOCKER_CACHE_PATH = '/tmp/docker_cache';
export const SKIP_IMAGE_DELETION = toBoolean(process.env.SKIP_IMAGE_DELETION) || false;
export const USE_HELMFILE = toBoolean(process.env.USE_HELMFILE) || false;
