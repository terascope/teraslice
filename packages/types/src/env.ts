import { Logger } from './logger';

export interface TestEnv {
    __DEFAULT_ELASTICSEARCH7_VERSION?: string;
    __DEFAULT_OPENSEARCH1_VERSION?: string;
    __DEFAULT_OPENSEARCH2_VERSION?: string;
    __DEFAULT_OPENSEARCH3_VERSION?: string;
    ASSET_STORAGE_CONNECTION?: string;
    ASSET_STORAGE_CONNECTION_TYPE?: string;
    ATTACH_JEST_DEBUGGER?: 'true' | 'false';
    BASE_DOCKER_IMAGE?: string;
    CERT_PATH?: string;
    CI?: 'true' | 'false';
    CI_COMMIT_REF_SLUG?: string;
    CLUSTERING_TYPE?: 'kubernetesV2';
    DEBUG?: string;
    DEBUG_LOG_LEVEL?: Logger.LogLevelString;
    DEV_DOCKER_IMAGE?: string;
    DEV_TAG?: string;
    DISABLE_INSTALL_DEMO_CONFIG?: 'true' | 'false';
    DISABLE_SECURITY_PLUGIN?: 'true' | 'false';
    DOCKER_CACHE_PATH?: string;
    DOCKER_IMAGE_LIST_PATH?: string;
    DOCKER_IMAGES_PATH?: string;
    DOCKER_NETWORK_NAME?: string;
    ELASTICSEARCH_DOCKER_IMAGE?: string;
    ELASTICSEARCH_HOST?: string;
    ELASTICSEARCH_HOSTNAME?: string;
    ELASTICSEARCH_NAME?: string;
    ELASTICSEARCH_PORT?: string;
    ELASTICSEARCH_VERSION?: string;
    ENABLE_UTILITY_SVC?: 'true' | 'false';
    ENCRYPT_KAFKA?: 'true' | 'false';
    ENCRYPT_MINIO?: 'true' | 'false';
    ENCRYPT_OPENSEARCH?: 'true' | 'false';
    ENCRYPTION_ENABLED?: 'true' | 'false';
    FILE_LOGGING?: 'true' | 'false';
    FORCE_COLOR?: string;
    GENERATE_ONLY?: string;
    GIT_COMMIT_HASH?: string;
    GITHUB_SHA?: string;
    HOME?: string;
    JEST_MAX_WORKERS?: string;
    JEST_VERSION?: string;
    HOST_IP?: string;
    K8S_VERSION?: string;
    KAFKA_ADVERTISED_LISTENERS?: string;
    KAFKA_BROKER?: string;
    KAFKA_CONTROLLER_LISTENER_NAMES?: string;
    KAFKA_CONTROLLER_QUORUM_VOTERS?: string;
    KAFKA_DOCKER_IMAGE?: string;
    KAFKA_GROUP_INITIAL_REBALANCE_DELAY_MS?: string;
    KAFKA_HOSTNAME?: string;
    KAFKA_INTER_BROKER_LISTENER_NAME?: string;
    KAFKA_LISTENER_SECURITY_PROTOCOL_MAP?: string;
    KAFKA_LISTENERS?: string;
    KAFKA_NAME?: string;
    KAFKA_NODE_ID?: string;
    KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR?: string;
    KAFKA_PORT?: string;
    KAFKA_PROCESS_ROLES?: string;
    KAFKA_SECRETS_DIR?: string;
    KAFKA_SECURITY_PROTOCOL?: string;
    KAFKA_TRANSACTION_STATE_LOG_MIN_ISR?: string;
    KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR?: string;
    KAFKA_VERSION?: string;
    KEEP_OPEN?: 'true' | 'false';
    KIND_DOCKER_IMAGE?: string;
    KIND_CLUSTER?: string;
    KIND_VERSION?: string;
    LOG_LEVEL?: Logger.LogLevelString;
    MAX_PROJECTS_PER_BATCH?: string;
    MINIO_ACCESS_KEY?: string;
    MINIO_DOCKER_IMAGE?: string;
    MINIO_HOST?: string;
    MINIO_HOSTNAME?: string;
    MINIO_NAME?: string;
    MINIO_PORT?: string;
    MINIO_PROTOCOL?: string;
    MINIO_SECRET_KEY?: string;
    MINIO_UI_PORT?: string;
    MINIO_VERSION?: string;
    NODE_ENV?: 'development' | 'production' | 'test';
    NODE_OPTIONS?: string;
    NODE_VERSION?: string;
    NPM_DEFAULT_REGISTRY?: string;
    OPENSEARCH_DOCKER_IMAGE?: string;
    OPENSEARCH_HOST?: string;
    OPENSEARCH_HOSTNAME?: string;
    OPENSEARCH_NAME?: string;
    OPENSEARCH_PASSWORD?: string;
    OPENSEARCH_PORT?: string;
    OPENSEARCH_PROTOCOL?: string;
    OPENSEARCH_USER?: string;
    OPENSEARCH_VERSION?: string;
    RABBITMQ_DOCKER_IMAGE?: string;
    RABBITMQ_HOST?: string;
    RABBITMQ_HOSTNAME?: string;
    RABBITMQ_MANAGEMENT?: string;
    RABBITMQ_MANAGEMENT_PORT?: string;
    RABBITMQ_NAME?: string;
    RABBITMQ_PASSWORD?: string;
    RABBITMQ_PORT?: string;
    RABBITMQ_USER?: string;
    RABBITMQ_VERSION?: string;
    RAW_LOGS?: 'true' | 'false';
    REPORT_COVERAGE?: 'true' | 'false';
    RESTRAINED_ELASTICSEARCH_HOST?: string;
    RESTRAINED_ELASTICSEARCH_PORT?: string;
    RESTRAINED_OPENSEARCH_HOST?: string;
    RESTRAINED_OPENSEARCH_PORT?: string;
    SEARCH_TEST_HOST?: string;
    SERVICE_HEAP_OPTS?: string;
    SERVICE_UP_TIMEOUT?: string;
    SERVICES_USE_TMPFS?: 'true' | 'false';
    SKIP_DOCKER_BUILD_IN_E2E?: 'true' | 'false';
    SKIP_DOCKER_BUILD_IN_K8S?: 'true' | 'false';
    SKIP_E2E_OUTPUT_LOGS?: 'true' | 'false';
    SKIP_GIT_COMMANDS?: 'true' | 'false';
    SKIP_IMAGE_DELETION?: 'true' | 'false';
    TJM_TEST_MODE?: 'true' | 'false';
    TERASLICE_IMAGE?: string;
    TERASLICE_PORT?: string;
    TEST_ELASTICSEARCH?: 'true' | 'false';
    TEST_INDEX_PREFIX?: string;
    TEST_KAFKA?: 'true' | 'false';
    TEST_MINIO?: 'true' | 'false';
    TEST_NAMESPACE?: string;
    TEST_OPENSEARCH?: 'true' | 'false';
    TEST_PLATFORM?: 'native' | 'kubernetesV2';
    TEST_RABBITMQ?: 'true' | 'false';
    TEST_RESTRAINED_ELASTICSEARCH?: 'true' | 'false';
    TEST_RESTRAINED_OPENSEARCH?: 'true' | 'false';
    TESTING_LOG_LEVEL?: Logger.LogLevelString;
    TZ?: string;
    USE_DEV_ASSETS?: 'true' | 'false';
    USE_HELMFILE?: 'true' | 'false';
    USE_EXISTING_SERVICES?: 'true' | 'false';
    UTILITY_SVC_NAME?: string;
    UTILITY_SVC_VERSION?: string;
    UTILITY_SVC_DOCKER_IMAGE?: string;
    UTILITY_SVC_DOCKER_PROJECT_PATH?: string;
    [key: string]: string | undefined;
}

// Make an optional key required
// Replace optional key K from type T with required key of same name
type RequireKeys<T, K extends keyof T> = Required<Pick<T, K>> & Omit<T, K>;

export type ElasticsearchTestEnv = RequireKeys<
    TestEnv,
    'TEST_INDEX_PREFIX' | 'SEARCH_TEST_HOST' | 'ELASTICSEARCH_VERSION'
>;

export type OpenSearchTestEnv = RequireKeys<
    TestEnv,
    'TEST_INDEX_PREFIX' | 'SEARCH_TEST_HOST' | 'OPENSEARCH_VERSION' | 'OPENSEARCH_USER' | 'OPENSEARCH_PASSWORD'
>;

export type MinioTestEnv = RequireKeys<
    TestEnv,
    'MINIO_HOST' | 'MINIO_VERSION' | 'MINIO_ACCESS_KEY' | 'MINIO_SECRET_KEY'
>;

export type KafkaTestEnv = RequireKeys<
    TestEnv,
    'KAFKA_BROKER' | 'KAFKA_VERSION'
>;

export type RabbitMQTestEnv = RequireKeys<
    TestEnv,
    'RABBITMQ_HOSTNAME' | 'RABBITMQ_USER' | 'RABBITMQ_VERSION' | 'RABBITMQ_PORT'
    | 'RABBITMQ_MANAGEMENT_PORT' | 'RABBITMQ_PASSWORD'
>;

export interface TerasliceEnv {
    ASSETS?: string;
    assets_port?: string;
    assignment?: 'assets_service' | 'cluster_master' | 'execution_controller' | 'node_master' | 'worker';
    EX?: string;
    ex_id?: string;
    job?: string;
    job_id?: string;
    KUBERNETES_SERVICE_HOST?: string;
    KUBERNETES_SERVICE_PORT?: string;
    MOUNT_LOCAL_TERASLICE?: string;
    NODE_ENV?: 'development' | 'production' | 'test';
    NODE_TYPE?: 'assets_service' | 'cluster_master' | 'execution_controller' | 'node_master' | 'worker';
    node_id?: string;
    POD_IP?: string;
    port?: string;
    process_restart?: 'true' | 'false'; // FIXME: should this have leading '__' like terafoundation?
    slicer_port?: string;
    TERASLICE_CLUSTER_NAME?: string;
    USE_DEBUG_LOGGER?: 'true' | 'false';
    [key: string]: string | undefined;
}

export type TSExecutionControllerEnv = RequireKeys<
    TerasliceEnv,
    'assignment' | 'EX' | 'ex_id' | 'job' | 'job_id' | 'node_id' | 'NODE_TYPE' | 'slicer_port'
>;

export type TSWorkerEnv = RequireKeys<
    TerasliceEnv,
    'assignment' | 'EX' | 'ex_id' | 'job' | 'job_id' | 'node_id' | 'NODE_TYPE'
>;

export type ClusterMasterEnv = RequireKeys<
    TerasliceEnv,
    'assignment' | 'assets_port' | 'node_id'
>;

export type AssetsServiceEnv = RequireKeys<
    TerasliceEnv,
    'assignment' | 'node_id' | 'port'
>;

export interface TerafoundationEnv {
    __process_restart?: 'true' | 'false';
    ASSIGNMENT?: 'assets_service' | 'cluster_master' | 'execution_controller' | 'node_master' | 'worker';
    assignment: 'assets_service' | 'cluster_master' | 'execution_controller' | 'node_master' | 'worker';
    NODE_TYPE?: 'assets_service' | 'cluster_master' | 'execution_controller' | 'node_master' | 'worker';
    POD_IP?: string;
    service_context: string;
    TERAFOUNDATION_CONFIG?: string;
    USE_DEBUG_LOGGER?: 'true' | 'false';
    [key: string]: string | undefined;
}
