import { cloneDeep } from '@terascope/core-utils';
import path from 'node:path';
import fse from 'fs-extra';
import {
    WORKERS_PER_NODE, KAFKA_BROKER,
    TEST_HOST, TERASLICE_PORT, CLUSTER_NAME,
    HOST_IP, CONFIG_PATH, ASSET_STORAGE_CONNECTION,
    ASSET_STORAGE_CONNECTION_TYPE, MINIO_HOST,
    ENCRYPT_MINIO, ROOT_CERT_PATH, FILE_LOGGING,
    ENCRYPT_KAFKA
} from './config.js';

const baseConfig = {
    terafoundation: {
        log_level: [
            { console: 'warn' },
            { file: process.env.DEBUG_LOG_LEVEL || 'info' }
        ],
        logging: [
            'console',
            ...(FILE_LOGGING ? ['file'] : [])
        ],
        log_path: '/app/logs',
        connectors: {
            'elasticsearch-next': {
                default: {
                    node: [TEST_HOST],
                    requestTimeout: '1 minute',
                    sniffOnStart: false,
                    sniffOnConnectionFault: false,
                }
            },
            kafka: {
                default: {
                    brokers: [KAFKA_BROKER],
                    security_protocol: '',
                    caCertificate: ''
                }
            },
            s3: {
                default: {
                    endpoint: MINIO_HOST,
                    accessKeyId: 'minioadmin',
                    secretAccessKey: 'minioadmin',
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
        workers: WORKERS_PER_NODE,
        port: TERASLICE_PORT,
        name: CLUSTER_NAME,
        master: true,
        master_hostname: HOST_IP,
        asset_storage_connection_type: ASSET_STORAGE_CONNECTION_TYPE,
        asset_storage_connection: ASSET_STORAGE_CONNECTION,
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
    if (ENCRYPT_MINIO === 'true') {
        const rootCA = fse.readFileSync(ROOT_CERT_PATH, 'utf8');
        masterConfig.terafoundation.connectors.s3.default.sslEnabled = true;
        masterConfig.terafoundation.connectors.s3.default.caCertificate = rootCA;
    }

    if (ENCRYPT_KAFKA === 'true') {
        const rootCA = fse.readFileSync(ROOT_CERT_PATH, 'utf8');
        masterConfig.terafoundation.connectors.kafka.default.security_protocol = 'ssl';
        masterConfig.terafoundation.connectors.kafka.default.caCertificate = rootCA;
    }

    const masterConfigPath = path.join(CONFIG_PATH, 'teraslice-master.json');
    await fse.writeJSON(masterConfigPath, masterConfig, {
        spaces: 4
    });
}

async function writeWorkerConfig() {
    const workerConfig = cloneDeep(baseConfig);
    workerConfig.teraslice.master = false;
    if (ENCRYPT_MINIO === 'true') {
        const rootCA = fse.readFileSync(ROOT_CERT_PATH, 'utf8');
        workerConfig.terafoundation.connectors.s3.default.sslEnabled = true;
        workerConfig.terafoundation.connectors.s3.default.caCertificate = rootCA;
    }

    if (ENCRYPT_KAFKA === 'true') {
        const rootCA = fse.readFileSync(ROOT_CERT_PATH, 'utf8');
        workerConfig.terafoundation.connectors.kafka.default.security_protocol = 'ssl';
        workerConfig.terafoundation.connectors.kafka.default.caCertificate = rootCA;
    }

    const workerConfigPath = path.join(CONFIG_PATH, 'teraslice-worker.json');
    await fse.writeJSON(workerConfigPath, workerConfig, {
        spaces: 4
    });
}
