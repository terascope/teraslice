import path from 'path';
import Chance from 'chance';
import { pickBy } from '@terascope/utils';
import { newId } from '../../../lib/utils/id_utils.js';

const { ELASTICSEARCH_HOST, ELASTICSEARCH_API_VERSION } = process.env;

export const opsPath = path.join(__dirname, '..', 'fixtures', 'ops');

const chance = new Chance();

export const newConfig = (options = {}) => {
    const { newOps } = options;
    let { operations } = options;
    if (operations == null) {
        if (newOps) {
            operations = [
                pickBy({
                    _op: path.join(opsPath, 'new-reader'),
                    countPerSlicer: options.countPerSlicer
                }),
                pickBy({
                    _op: path.join(opsPath, 'new-op'),
                    failOnSliceRetry: options.failOnSliceRetry || false
                }),
                {
                    _op: 'noop'
                }
            ];
        } else {
            operations = [
                pickBy({
                    _op: path.join(opsPath, 'example-reader'),
                    exampleProp: 321,
                    updateMetadata: options.updateMetadata,
                    errorAt: options.readerErrorAt,
                    results: options.readerResults,
                    slicerResults: options.slicerResults,
                    slicerErrorAt: options.slicerErrorAt,
                    slicerQueueLength: options.slicerQueueLength
                }),
                pickBy({
                    _op: path.join(opsPath, 'example-op'),
                    exampleProp: 123,
                    errorAt: options.opErrorAt,
                    results: options.opResults
                })
            ];
        }
    }

    const {
        analytics = false,
        maxRetries = 0,
        slicerPort = 0,
        lifecycle = 'once',
        assets = [],
        workers = 1,
        slicers = 1,
        autorecover = false,
        recoveredExecution,
        recoveredSliceType,
        probationWindow = 5000
    } = options;

    return {
        name: chance.name({ middle: true }),
        slicers,
        workers,
        assets,
        analytics,
        lifecycle,
        max_retries: maxRetries,
        operations,
        autorecover,
        performance_metrics: false,
        recovered_execution: recoveredExecution,
        recovered_slice_type: recoveredSliceType,
        ex_id: newId('ex-id', true),
        job_id: newId('job-id', true),
        node_id: newId('node-id', true),
        slicer_port: slicerPort,
        slicer_hostname: 'localhost',
        probation_window: probationWindow
    };
};

export const newSysConfig = (options = {}) => {
    const {
        clusterName = 'test-teraslice-cluster',
        timeout = 3000,
        actionTimeout = 2000,
        shutdownTimeout = 4000,
        assetDir,
        clusterMasterPort
    } = options;

    return {
        terafoundation: {
            environment: 'development',
            connectors: {
                elasticsearch: {
                    default: {
                        host: [ELASTICSEARCH_HOST],
                        apiVersion: ELASTICSEARCH_API_VERSION,
                        requestTimeout: timeout,
                        deadTimeout: timeout
                    }
                },
                'elasticsearch-next': {
                    default: {
                        node: [ELASTICSEARCH_HOST],
                        requestTimeout: timeout,
                        deadTimeout: timeout
                    }
                }
            }
        },
        teraslice: {
            assets_directory: assetDir,
            shutdown_timeout: shutdownTimeout,
            action_timeout: actionTimeout,
            network_latency_buffer: 100,
            slicer_timeout: timeout,
            slicer_allocation_attempts: 3,
            node_state_interval: timeout,
            node_disconnect_timeout: timeout,
            worker_disconnect_timeout: timeout,
            analytics_rate: 100,
            name: clusterName,
            master_hostname: 'localhost',
            port: clusterMasterPort,
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
};
