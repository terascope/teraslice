import { cloneDeep } from '@terascope/core-utils';
import path from 'node:path';
import fse from 'fs-extra';
import { config } from './config.js';

const {
    NATIVE_WORKERS_PER_NODE, KAFKA_BROKER,
    TEST_HOST, TERASLICE_PORT, CLUSTER_NAME,
    HOST_IP, CONFIG_PATH, ASSET_STORAGE_CONNECTION,
    ASSET_STORAGE_CONNECTION_TYPE, CEPH_HOST,
    CEPH_ACCESS_KEY, CEPH_SECRET_KEY,
    ENCRYPT_CEPH, ROOT_CERT_PATH, FILE_LOGGING,
    ENCRYPT_KAFKA, DEBUG_LOG_LEVEL, ENCRYPT_OPENSEARCH,
    OS_CONNECTION, KAFKA_CONNECTION, S3_CONNECTION
} = config;

// Point the asset connection at the named connector for its storage type rather than
// the removed "default": elasticsearch-next assets live on the state cluster, s3 assets
// on the s3 backend (ceph in the e2e harness).
function resolveAssetConnection() {
    if (ASSET_STORAGE_CONNECTION !== 'default') return ASSET_STORAGE_CONNECTION;
    if (ASSET_STORAGE_CONNECTION_TYPE === 'elasticsearch-next') return OS_CONNECTION;
    if (ASSET_STORAGE_CONNECTION_TYPE === 's3') return S3_CONNECTION;
    return ASSET_STORAGE_CONNECTION;
}
const ASSET_CONNECTION = resolveAssetConnection();

export const baseConfig = {
    terafoundation: {
        log_level: [
            { console: 'warn' },
            { file: DEBUG_LOG_LEVEL || 'info' }
        ],
        logging: [
            'console',
            ...(FILE_LOGGING ? ['file'] : [])
        ],
        log_path: '/app/logs',
        connectors: {
            'elasticsearch-next': {
                [OS_CONNECTION]: {
                    node: [TEST_HOST],
                    requestTimeout: '1 minute',
                    sniffOnStart: false,
                    sniffOnConnectionFault: false,
                    username: '',
                    password: '',
                    caCertificate: ''
                }
            },
            kafka: {
                [KAFKA_CONNECTION]: {
                    brokers: [KAFKA_BROKER],
                    security_protocol: 'plaintext',
                    caCertificate: ''
                }
            },
            s3: {
                [S3_CONNECTION]: {
                    endpoint: CEPH_HOST,
                    accessKeyId: CEPH_ACCESS_KEY,
                    secretAccessKey: CEPH_SECRET_KEY,
                    forcePathStyle: true,
                    sslEnabled: false,
                    region: 'us-east-1',
                    caCertificate: ''
                }
            }
        }
    },
    teraslice: {
        worker_disconnect_timeout: '2 minutes',
        node_disconnect_timeout: '2 minutes',
        slicer_timeout: '2 minutes',
        shutdown_timeout: '30 seconds',
        action_timeout: '15 seconds',
        network_latency_buffer: '5 seconds',
        analytics_rate: '15 seconds',
        slicer_allocation_attempts: 0,
        assets_directory: '/app/assets',
        autoload_directory: '/app/autoload',
        workers: NATIVE_WORKERS_PER_NODE,
        port: TERASLICE_PORT,
        name: CLUSTER_NAME,
        master: true,
        master_hostname: HOST_IP,
        state: {
            connection: OS_CONNECTION
        },
        asset_storage_connection_type: ASSET_STORAGE_CONNECTION_TYPE,
        asset_storage_connection: ASSET_CONNECTION,
        index_settings: {
            analytics: {
                number_of_shards: 1,
                number_of_replicas: 0
            },
            assets: {
                number_of_shards: 1,
                number_of_replicas: 0
            },
            jobs: {
                number_of_shards: 1,
                number_of_replicas: 0
            },
            execution: {
                number_of_shards: 1,
                number_of_replicas: 0
            },
            state: {
                number_of_shards: 1,
                number_of_replicas: 0
            }
        }
    }
};

export default async function setupTerasliceConfig() {
    await Promise.all([
        writeMasterConfig(),
        writeWorkerConfig()
    ]);
}

async function writeMasterConfig() {
    const masterConfig = cloneDeep(baseConfig);
    masterConfig.teraslice.master = true;
    if (ENCRYPT_CEPH === true) {
        const rootCA = fse.readFileSync(ROOT_CERT_PATH, 'utf8');
        masterConfig.terafoundation.connectors.s3[S3_CONNECTION].sslEnabled = true;
        masterConfig.terafoundation.connectors.s3[S3_CONNECTION].caCertificate = rootCA;
    }

    if (ENCRYPT_KAFKA === true) {
        const rootCA = fse.readFileSync(ROOT_CERT_PATH, 'utf8');
        masterConfig.terafoundation.connectors.kafka[KAFKA_CONNECTION].security_protocol = 'ssl';
        masterConfig.terafoundation.connectors.kafka[KAFKA_CONNECTION].caCertificate = rootCA;
    }

    if (ENCRYPT_OPENSEARCH === true) {
        const rootCA = fse.readFileSync(ROOT_CERT_PATH, 'utf8');
        masterConfig.terafoundation.connectors['elasticsearch-next'][OS_CONNECTION].username = 'admin';
        masterConfig.terafoundation.connectors['elasticsearch-next'][OS_CONNECTION].password = 'passwordsufhbivbU123%$';
        masterConfig.terafoundation.connectors['elasticsearch-next'][OS_CONNECTION].caCertificate = rootCA;
    }

    const masterConfigPath = path.join(CONFIG_PATH, 'teraslice-master.json');
    await fse.writeJSON(masterConfigPath, masterConfig, {
        spaces: 4
    });
}

async function writeWorkerConfig() {
    const workerConfig = cloneDeep(baseConfig);
    workerConfig.teraslice.master = false;
    if (ENCRYPT_CEPH === true) {
        const rootCA = fse.readFileSync(ROOT_CERT_PATH, 'utf8');
        workerConfig.terafoundation.connectors.s3[S3_CONNECTION].sslEnabled = true;
        workerConfig.terafoundation.connectors.s3[S3_CONNECTION].caCertificate = rootCA;
    }

    if (ENCRYPT_KAFKA === true) {
        const rootCA = fse.readFileSync(ROOT_CERT_PATH, 'utf8');
        workerConfig.terafoundation.connectors.kafka[KAFKA_CONNECTION].security_protocol = 'ssl';
        workerConfig.terafoundation.connectors.kafka[KAFKA_CONNECTION].caCertificate = rootCA;
    }

    if (ENCRYPT_OPENSEARCH === true) {
        const rootCA = fse.readFileSync(ROOT_CERT_PATH, 'utf8');
        workerConfig.terafoundation.connectors['elasticsearch-next'][OS_CONNECTION].username = 'admin';
        workerConfig.terafoundation.connectors['elasticsearch-next'][OS_CONNECTION].password = 'passwordsufhbivbU123%$';
        workerConfig.terafoundation.connectors['elasticsearch-next'][OS_CONNECTION].caCertificate = rootCA;
    }

    const workerConfigPath = path.join(CONFIG_PATH, 'teraslice-worker.json');
    await fse.writeJSON(workerConfigPath, workerConfig, {
        spaces: 4
    });
}
