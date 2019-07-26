'use strict';

const _ = require('lodash');
const path = require('path');
const fse = require('fs-extra');
const {
    DEFAULT_WORKERS,
    KAFKA_BROKERS,
    MY_IP,
    ELASTICSEARCH_URL,
    CLUSTER_NAME
} = require('./misc');

module.exports = async function setupTerasliceConfig() {
    const dockerIP = getInternalDockerIP();
    const elasticsearchHosts = injectDockerIP(ELASTICSEARCH_URL, dockerIP);
    const kafkaBrokers = injectDockerIP(KAFKA_BROKERS, dockerIP);

    const baseConfig = {
        terafoundation: {
            environment: 'development',
            log_level: 'debug',
            connectors: {
                elasticsearch: {
                    default: {
                        host: elasticsearchHosts,
                        requestTimeout: 60000,
                        deadTimeout: 45000,
                        sniffOnStart: false,
                        sniffOnConnectionFault: false,
                        suggestCompression: false
                    }
                },
                kafka: {
                    default: {
                        brokers: kafkaBrokers
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
            workers: DEFAULT_WORKERS,
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

    const masterConfig = _.cloneDeep(baseConfig);
    masterConfig.teraslice.master = true;
    masterConfig.teraslice.master_hostname = '127.0.0.1';

    const masterConfigPath = path.join(configPath, 'teraslice-master.json');
    await fse.writeJSON(masterConfigPath, masterConfig, {
        spaces: 4
    });

    const workerConfig = _.cloneDeep(baseConfig);
    workerConfig.teraslice.master = false;
    masterConfig.teraslice.master_hostname = 'teraslice-master';

    const workerConfigPath = path.join(configPath, 'teraslice-worker.json');
    await fse.writeJSON(workerConfigPath, workerConfig, {
        spaces: 4
    });
};

function getInternalDockerIP() {
    if (process.platform === 'darwin') return 'docker.for.mac.localhost';
    return MY_IP;
}

function injectDockerIP(uri, ip) {
    return uri
        .split(',')
        .map(str => str.trim())
        .filter(Boolean)
        .map(str => str.replace(/localhost|127\.0\.0\.1/g, ip));
}
