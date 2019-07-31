'use strict';

const _ = require('lodash');
const path = require('path');
const isCI = require('is-ci');
const fse = require('fs-extra');
const {
    WORKERS_PER_NODE, KAFKA_BROKER, ELASTICSEARCH_HOST, CLUSTER_NAME
} = require('./misc');

module.exports = async function setupTerasliceConfig() {
    const elasticsearchHost = injectDockerIP(ELASTICSEARCH_HOST, 'elasticsearch');
    const kafkaBroker = injectDockerIP(KAFKA_BROKER, 'kafka');

    const baseConfig = {
        terafoundation: {
            environment: 'development',
            log_level: isCI ? 'info' : 'debug',
            connectors: {
                elasticsearch: {
                    default: {
                        host: [elasticsearchHost],
                        requestTimeout: 60000,
                        deadTimeout: 45000,
                        sniffOnStart: false,
                        sniffOnConnectionFault: false,
                        suggestCompression: false
                    }
                },
                kafka: {
                    default: {
                        brokers: [kafkaBroker]
                    }
                }
            }
        },
        teraslice: {
            worker_disconnect_timeout: 120000,
            node_disconnect_timeout: 120000,
            slicer_timeout: 180000,
            shutdown_timeout: 30000,
            action_timeout: 30000,
            assets_directory: '/app/assets',
            autoload_directory: '/app/autoload',
            workers: WORKERS_PER_NODE,
            port: 45678,
            name: CLUSTER_NAME,
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

    const configPath = path.join(__dirname, '..', '.config');

    if (!fse.existsSync(configPath)) {
        await fse.emptyDir(configPath);
    }

    await fse.ensureDir(configPath);

    await writeMasterConfig(configPath, baseConfig);
    await writeWorkerConfig(configPath, baseConfig);
};

async function writeMasterConfig(configPath, baseConfig) {
    const masterConfig = _.cloneDeep(baseConfig);
    masterConfig.teraslice.master = true;
    masterConfig.teraslice.master_hostname = '127.0.0.1';

    const masterConfigPath = path.join(configPath, 'teraslice-master.json');
    await fse.writeJSON(masterConfigPath, masterConfig, {
        spaces: 4
    });
}

async function writeWorkerConfig(configPath, baseConfig) {
    const workerConfig = _.cloneDeep(baseConfig);
    workerConfig.teraslice.master = false;
    workerConfig.teraslice.master_hostname = 'teraslice-master';

    const workerConfigPath = path.join(configPath, 'teraslice-worker.json');
    await fse.writeJSON(workerConfigPath, workerConfig, {
        spaces: 4
    });
}

function injectDockerIP(uri, ip) {
    if (!uri || typeof uri !== 'string' || !uri.trim()) {
        throw new Error('Invalid URI for e2e test');
    }
    return uri.replace(/localhost|127\.0\.0\.1/g, ip);
}
