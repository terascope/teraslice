import 'jest-extended';
import { jest } from '@jest/globals';
import { TSError } from '@terascope/utils';
import { TestOptions } from '../src/helpers/test-runner/interfaces.js';

jest.unstable_mockModule('../src/helpers/config.js', () => ({
    __esModule: true,
    ELASTICSEARCH_VERSION: 'bad-version',
    KAFKA_VERSION: 'very-bad-version',
    MINIO_VERSION: 'very-bad-version',
    RABBITMQ_VERSION: 'very-bad-version',
    OPENSEARCH_VERSION: 'very-bad-version',
    DEV_DOCKER_IMAGE: 'hello',
    DEV_TAG: 'goodbye',
    ENV_SERVICES: [],
    NPM_DEFAULT_REGISTRY: '',
    DOCKER_CACHE_PATH: '',
    FORCE_COLOR: '',
    SERVICE_UP_TIMEOUT: '1000',
    __DEFAULT_ELASTICSEARCH6_VERSION: '',
    __DEFAULT_ELASTICSEARCH7_VERSION: '',
    __DEFAULT_OPENSEARCH1_VERSION: '',
    __DEFAULT_OPENSEARCH2_VERSION: '',
    __DEFAULT_OPENSEARCH3_VERSION: '',
    TERASLICE_PORT: '',
    HOST_IP: '',
    USE_EXISTING_SERVICES: '',
    SERVICES_USE_TMPFS: '',
    SERVICE_HEAP_OPTS: '',
    DOCKER_NETWORK_NAME: '',
    TEST_NAMESPACE: '',
    ELASTICSEARCH_NAME: '',
    ELASTICSEARCH_HOSTNAME: '',
    ELASTICSEARCH_PORT: '',
    ELASTICSEARCH_HOST: '',
    ELASTICSEARCH_DOCKER_IMAGE: '',
    RESTRAINED_ELASTICSEARCH_PORT: '',
    RESTRAINED_ELASTICSEARCH_HOST: '',
    KAFKA_NAME: '',
    KAFKA_HOSTNAME: '',
    KAFKA_PORT: '',
    KAFKA_BROKER: '',
    KAFKA_DOCKER_IMAGE: '',
    ENCRYPT_KAFKA: '',
    KAFKA_BROKER_ID: '',
    KAFKA_LISTENERS: '',
    KAFKA_ADVERTISED_LISTENERS: '',
    KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: '',
    KAFKA_INTER_BROKER_LISTENER_NAME: '',
    KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: '',
    MINIO_NAME: '',
    MINIO_HOSTNAME: '',
    MINIO_PORT: '',
    MINIO_UI_PORT: '',
    ENCRYPT_MINIO: '',
    MINIO_HOST: '',
    MINIO_DOCKER_IMAGE: '',
    MINIO_ACCESS_KEY: '',
    MINIO_SECRET_KEY: '',
    MINIO_VOLUME: '',
    RABBITMQ_DOCKER_IMAGE: '',
    RABBITMQ_NAME: '',
    RABBITMQ_PORT: '',
    RABBITMQ_MANAGEMENT_PORT: '',
    RABBITMQ_HOSTNAME: '',
    RABBITMQ_HOST: '',
    RABBITMQ_MANAGEMENT: '',
    RABBITMQ_USER: '',
    RABBITMQ_PASSWORD: '',
    OPENSEARCH_NAME: '',
    OPENSEARCH_HOSTNAME: '',
    OPENSEARCH_PORT: '',
    OPENSEARCH_USER: '',
    OPENSEARCH_PASSWORD: '',
    OPENSEARCH_HOST: '',
    ENCRYPT_OPENSEARCH: '',
    OPENSEARCH_DOCKER_IMAGE: '',
    RESTRAINED_OPENSEARCH_PORT: '',
    RESTRAINED_OPENSEARCH_HOST: '',
    KIND_DOCKER_IMAGE: '',
    KIND_VERSION: '',
    BASE_DOCKER_IMAGE: '',
    SKIP_GIT_COMMANDS: '',
    SKIP_DOCKER_BUILD_IN_E2E: '',
    SKIP_DOCKER_BUILD_IN_K8S: '',
    SKIP_E2E_OUTPUT_LOGS: '',
    MAX_PROJECTS_PER_BATCH: '',
    REPORT_COVERAGE: '',
    JEST_MAX_WORKERS: '',
    SEARCH_TEST_HOST: '',
    TEST_NODE_VERSIONS: '',
    DEFAULT_NODE_VERSION: '',
    NODE_VERSION: '',
    DOCKER_IMAGES_PATH: '',
    DOCKER_IMAGE_LIST_PATH: '',
}));

describe('services', () => {
    const options: TestOptions = {
        bail: false,
        debug: false,
        watch: false,
        trace: false,
        all: false,
        keepOpen: false,
        reportCoverage: false,
        useExistingServices: false,
        ignoreMount: false,
        clusteringType: 'native',
        kindClusterName: 'default',
        skipImageDeletion: false,
        useHelmfile: false
    };
    let services: any;

    beforeAll(async () => {
        services = await import('../src/helpers/test-runner/services.js');
    });

    describe('loadOrPullServiceImages', () => {
        it('should throw error if service image is invalid', async () => {
            await expect(services.loadOrPullServiceImages('_for_testing_'))
                .rejects.toThrowWithMessage(TSError, /w*Failed to pull services for test suite*\w/);
        });
    });

    describe('ensureServices can surface any error', () => {
        it('should throw if service has an incorrect setting', async () => {
            await expect(services.ensureServices('_for_testing_', options))
                .rejects.toThrow();
        });

        it('should log error from ensureKafka if bad options', async () => {
            await expect(services.ensureKafka(options))
                .rejects.toThrow();
        });

        it('should log error from ensureElasticsearch if bad options', async () => {
            await expect(services.ensureElasticsearch(options))
                .rejects.toThrow();
        });

        it('should log error from ensureMinio if bad options', async () => {
            await expect(services.ensureMinio(options))
                .rejects.toThrow();
        });

        it('should throw error from ensureOpensearch if bad options', async () => {
            await expect(services.ensureOpensearch(options))
                .rejects.toThrow();
        });
    });
});
