import { Logger } from './logger';

export interface TestEnv {
    ASSET_STORAGE_CONNECTION?: string;
    ASSET_STORAGE_CONNECTION_TYPE?: string;
    ATTACH_JEST_DEBUGGER?: boolean;
    CERT_PATH?: string;
    CI?: boolean;
    CI_COMMIT_REF_SLUG?: string;
    CLUSTERING_TYPE?: 'kubernetesV2';
    DEBUG?: string;
    DEBUG_LOG_LEVEL?: Logger.LogLevelString;
    DEV_DOCKER_IMAGE?: string;
    DEV_TAG?: string;
    DISABLE_INSTALL_DEMO_CONFIG?: boolean;
    DISABLE_SECURITY_PLUGIN?: boolean;
    DOCKER_CACHE_PATH?: string;
    DOCKER_IMAGE_LIST_PATH?: string;
    DOCKER_IMAGES_PATH?: string;
    DOCKER_NETWORK_NAME?: string;
    ELASTICSEARCH_DOCKER_IMAGE?: string;
    ELASTICSEARCH_HOST?: string;
    ELASTICSEARCH_HOSTNAME?: string;
    ELASTICSEARCH_NAME?: string;
    ELASTICSEARCH_PORT?: number;
    ELASTICSEARCH_VERSION?: string;
    ENCRYPT_KAFKA?: boolean;
    ENCRYPT_MINIO?: boolean;
    ENCRYPT_OPENSEARCH?: boolean;
    ENCRYPTION_ENABLED?: boolean;
    ENV_SERVICES?: Service[];
    FILE_LOGGING?: boolean;
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
    KAFKA_PORT?: number;
    KAFKA_PROCESS_ROLES?: string;
    KAFKA_SECRETS_DIR?: string;
    KAFKA_SECURITY_PROTOCOL?: string;
    KAFKA_TRANSACTION_STATE_LOG_MIN_ISR?: string;
    KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR?: string;
    KAFKA_VERSION?: string;
    KEEP_OPEN?: boolean;
    KIND_DOCKER_IMAGE?: string;
    KIND_CLUSTER?: string;
    KIND_VERSION?: string;
    LOG_LEVEL?: Logger.LogLevelString;
    MAX_PROJECTS_PER_BATCH?: number;
    MINIO_ACCESS_KEY?: string;
    MINIO_DOCKER_IMAGE?: string;
    MINIO_HOST?: string;
    MINIO_HOSTNAME?: string;
    MINIO_NAME?: string;
    MINIO_PORT?: number;
    MINIO_PROTOCOL?: string;
    MINIO_SECRET_KEY?: string;
    MINIO_UI_PORT?: number;
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
    OPENSEARCH_PORT?: number;
    OPENSEARCH_PROTOCOL?: string;
    OPENSEARCH_USER?: string;
    OPENSEARCH_VERSION?: string;
    RABBITMQ_DOCKER_IMAGE?: string;
    RABBITMQ_HOST?: string;
    RABBITMQ_HOSTNAME?: string;
    RABBITMQ_MANAGEMENT?: string;
    RABBITMQ_MANAGEMENT_PORT?: number;
    RABBITMQ_NAME?: string;
    RABBITMQ_PASSWORD?: string;
    RABBITMQ_PORT?: number;
    RABBITMQ_USER?: string;
    RABBITMQ_VERSION?: string;
    RAW_LOGS?: boolean;
    REPORT_COVERAGE?: boolean;
    RESTRAINED_ELASTICSEARCH_HOST?: string;
    RESTRAINED_ELASTICSEARCH_PORT?: number;
    RESTRAINED_OPENSEARCH_HOST?: string;
    RESTRAINED_OPENSEARCH_PORT?: number;
    SEARCH_TEST_HOST?: string;
    SERVICE_HEAP_OPTS?: string;
    SERVICE_UP_TIMEOUT?: string;
    SERVICES_USE_TMPFS?: boolean;
    SKIP_DOCKER_BUILD_IN_E2E?: boolean;
    SKIP_DOCKER_BUILD_IN_K8S?: boolean;
    SKIP_E2E_OUTPUT_LOGS?: boolean;
    SKIP_GIT_COMMANDS?: boolean;
    SKIP_IMAGE_DELETION?: boolean;
    STERN_LOGS?: boolean;
    TJM_TEST_MODE?: boolean;
    TERASLICE_IMAGE?: string;
    TERASLICE_PORT?: number;
    TEST_ELASTICSEARCH?: boolean;
    TEST_INDEX_PREFIX?: string;
    TEST_KAFKA?: boolean;
    TEST_MINIO?: boolean;
    TEST_NAMESPACE?: string;
    TEST_OPENSEARCH?: boolean;
    TEST_PLATFORM?: 'native' | 'kubernetesV2';
    TEST_RABBITMQ?: boolean;
    TEST_RESTRAINED_ELASTICSEARCH?: boolean;
    TEST_RESTRAINED_OPENSEARCH?: boolean;
    TESTING_LOG_LEVEL?: Logger.LogLevelString;
    TZ?: string;
    USE_DEV_ASSETS?: boolean;
    USE_HELMFILE?: boolean;
    USE_EXISTING_SERVICES?: boolean;
    UTILITY_SVC_NAME?: string;
    UTILITY_SVC_VERSION?: string;
    UTILITY_SVC_DOCKER_IMAGE?: string;
    UTILITY_SVC_DOCKER_PROJECT_PATH?: string;
    [key: string]: any;
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

export type E2ETestEnv = RequireKeys<
    TestEnv,
    'CERT_PATH' | 'DEBUG_LOG_LEVEL' | 'FILE_LOGGING' | 'HOST_IP' | 'KAFKA_BROKER'
    | 'KIND_CLUSTER' | 'NODE_VERSION' | 'SEARCH_TEST_HOST' | 'STERN_LOGS'
    | 'TERASLICE_PORT' | 'TEST_INDEX_PREFIX' | 'TEST_PLATFORM' | 'USE_HELMFILE'
>;

export interface ScriptsConfigDefaults {
    DEFAULT_ELASTICSEARCH7_VERSION: string;
    DEFAULT_OPENSEARCH1_VERSION: string;
    DEFAULT_OPENSEARCH2_VERSION: string;
    DEFAULT_OPENSEARCH3_VERSION: string;
    ENABLE_UTILITY_SVC?: boolean;
    OPENSEARCH_SSL_HOST: string;
}

type ScriptsConfig = TestEnv & ScriptsConfigDefaults;

export type ScriptsTestEnv = RequireKeys<
    ScriptsConfig,
    'ASSET_STORAGE_CONNECTION' | 'ASSET_STORAGE_CONNECTION_TYPE' | 'ATTACH_JEST_DEBUGGER'
    | 'CERT_PATH' | 'CLUSTERING_TYPE' | 'DEFAULT_ELASTICSEARCH7_VERSION'
    | 'DEFAULT_OPENSEARCH1_VERSION' | 'DEFAULT_OPENSEARCH2_VERSION'
    | 'DEFAULT_OPENSEARCH3_VERSION' | 'DEV_DOCKER_IMAGE' | 'DEV_TAG' | 'DOCKER_CACHE_PATH'
    | 'DOCKER_IMAGE_LIST_PATH' | 'DOCKER_IMAGES_PATH' | 'DOCKER_NETWORK_NAME'
    | 'ELASTICSEARCH_DOCKER_IMAGE' | 'ELASTICSEARCH_HOST' | 'ELASTICSEARCH_HOSTNAME'
    | 'ELASTICSEARCH_NAME' | 'ELASTICSEARCH_PORT' | 'ELASTICSEARCH_VERSION'
    | 'ENCRYPT_KAFKA' | 'ENCRYPT_MINIO' | 'ENCRYPT_OPENSEARCH' | 'ENCRYPTION_ENABLED'
    | 'ENV_SERVICES' | 'FORCE_COLOR' | 'HOST_IP' | 'JEST_MAX_WORKERS' | 'K8S_VERSION'
    | 'KAFKA_ADVERTISED_LISTENERS' | 'KAFKA_BROKER' | 'KAFKA_CONTROLLER_LISTENER_NAMES'
    | 'KAFKA_CONTROLLER_QUORUM_VOTERS' | 'KAFKA_DOCKER_IMAGE'
    | 'KAFKA_GROUP_INITIAL_REBALANCE_DELAY_MS' | 'KAFKA_HOSTNAME'
    | 'KAFKA_INTER_BROKER_LISTENER_NAME' | 'KAFKA_LISTENERS'
    | 'KAFKA_LISTENER_SECURITY_PROTOCOL_MAP' | 'KAFKA_NAME' | 'KAFKA_NODE_ID'
    | 'KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR' | 'KAFKA_PORT' | 'KAFKA_PROCESS_ROLES'
    | 'KAFKA_SECRETS_DIR' | 'KAFKA_TRANSACTION_STATE_LOG_MIN_ISR'
    | 'KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR' | 'KAFKA_VERSION'
    | 'KIND_DOCKER_IMAGE' | 'KIND_VERSION' | 'MAX_PROJECTS_PER_BATCH' | 'MINIO_ACCESS_KEY'
    | 'MINIO_DOCKER_IMAGE' | 'MINIO_HOST' | 'MINIO_HOSTNAME' | 'MINIO_NAME' | 'MINIO_PORT'
    | 'MINIO_SECRET_KEY' | 'MINIO_UI_PORT' | 'MINIO_VERSION' | 'NODE_VERSION'
    | 'NPM_DEFAULT_REGISTRY' | 'OPENSEARCH_DOCKER_IMAGE' | 'OPENSEARCH_HOST'
    | 'OPENSEARCH_HOSTNAME' | 'OPENSEARCH_NAME' | 'OPENSEARCH_PASSWORD' | 'OPENSEARCH_PORT'
    | 'OPENSEARCH_SSL_HOST' | 'OPENSEARCH_USER' | 'OPENSEARCH_VERSION'
    | 'RABBITMQ_DOCKER_IMAGE' | 'RABBITMQ_HOSTNAME' | 'RABBITMQ_MANAGEMENT'
    | 'RABBITMQ_MANAGEMENT_PORT' | 'RABBITMQ_NAME' | 'RABBITMQ_PASSWORD' | 'RABBITMQ_PORT'
    | 'RABBITMQ_USER' | 'RABBITMQ_VERSION' | 'REPORT_COVERAGE'
    | 'RESTRAINED_ELASTICSEARCH_HOST' | 'RESTRAINED_ELASTICSEARCH_PORT'
    | 'RESTRAINED_OPENSEARCH_HOST' | 'RESTRAINED_OPENSEARCH_PORT' | 'SEARCH_TEST_HOST'
    | 'SERVICE_HEAP_OPTS' | 'SERVICE_UP_TIMEOUT' | 'SERVICES_USE_TMPFS'
    | 'SKIP_DOCKER_BUILD_IN_E2E' | 'SKIP_DOCKER_BUILD_IN_K8S' | 'SKIP_E2E_OUTPUT_LOGS'
    | 'SKIP_GIT_COMMANDS' | 'SKIP_IMAGE_DELETION' | 'TERASLICE_IMAGE' | 'TERASLICE_PORT'
    | 'TEST_NAMESPACE' | 'TEST_PLATFORM' | 'USE_EXISTING_SERVICES' | 'USE_HELMFILE'
    | 'UTILITY_SVC_DOCKER_IMAGE' | 'UTILITY_SVC_DOCKER_PROJECT_PATH' | 'UTILITY_SVC_NAME'
    | 'UTILITY_SVC_VERSION'
>;
export interface TerasliceEnv {
    ASSETS?: string;
    assets_port?: number;
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
    port?: number;
    process_restart?: boolean;
    slicer_port?: string;
    TERASLICE_CLUSTER_NAME?: string;
    USE_DEBUG_LOGGER?: boolean;
    [key: string]: any;
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
    __process_restart?: boolean;
    ASSIGNMENT?: 'assets_service' | 'cluster_master' | 'execution_controller' | 'node_master' | 'worker';
    assignment: 'assets_service' | 'cluster_master' | 'execution_controller' | 'node_master' | 'worker';
    NODE_TYPE?: 'assets_service' | 'cluster_master' | 'execution_controller' | 'node_master' | 'worker';
    POD_IP?: string;
    service_context: string;
    TERAFOUNDATION_CONFIG?: string;
    USE_DEBUG_LOGGER?: boolean;
    [key: string]: any;
}

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
