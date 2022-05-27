'use strict';

const { cloneDeep } = require('@terascope/utils');
const path = require('path');
const fse = require('fs-extra');
const {
    WORKERS_PER_NODE,
    KAFKA_BROKER,
    ELASTICSEARCH_HOST,
    ELASTICSEARCH_API_VERSION,
    CLUSTER_NAME,
    HOST_IP,
    CONFIG_PATH,
} = require('./misc');

module.exports = async function setupTerasliceConfig() {
    const baseConfig = {
        terafoundation: {
            environment: 'development',
            log_level: [
                { console: 'warn' },
                { file: process.env.DEBUG_LOG_LEVEL || 'info', }
            ],
            logging: [
                'console',
                'file'
            ],
            log_path: '/app/logs',
            connectors: {
                elasticsearch: {
                    default: {
                        host: [ELASTICSEARCH_HOST],
                        apiVersion: ELASTICSEARCH_API_VERSION,
                        requestTimeout: '1 minute',
                        deadTimeout: '45 seconds',
                        sniffOnStart: false,
                        sniffOnConnectionFault: false,
                        suggestCompression: false
                    }
                },
                'elasticsearch-next': {
                    default: {
                        node: [ELASTICSEARCH_HOST],
                        requestTimeout: '1 minute',
                        sniffOnStart: false,
                        sniffOnConnectionFault: false,
                    }
                },
                kafka: {
                    default: {
                        brokers: [KAFKA_BROKER]
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
            port: 45678,
            name: CLUSTER_NAME,
            master_hostname: HOST_IP,
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

    await writeMasterConfig(baseConfig);
    await writeWorkerConfig(baseConfig);
};

async function writeMasterConfig(baseConfig) {
    const masterConfig = cloneDeep(baseConfig);
    masterConfig.teraslice.master = true;

    const masterConfigPath = path.join(CONFIG_PATH, 'teraslice-master.json');
    await fse.writeJSON(masterConfigPath, masterConfig, {
        spaces: 4
    });
}

async function writeWorkerConfig(baseConfig) {
    const workerConfig = cloneDeep(baseConfig);
    workerConfig.teraslice.master = false;

    const workerConfigPath = path.join(CONFIG_PATH, 'teraslice-worker.json');
    await fse.writeJSON(workerConfigPath, workerConfig, {
        spaces: 4
    });
}
