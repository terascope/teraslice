import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withoutNil } from '@terascope/core-utils';
// @ts-expect-error
import Chance from 'chance';
import { ValidatedJobConfig } from '@terascope/types';
import { newId } from '../../../src/lib/utils/id_utils.js';

const { SEARCH_TEST_HOST } = process.env;
const dirname = path.dirname(fileURLToPath(import.meta.url));

const opsPath = path.join(dirname, '..', 'fixtures', 'ops');

const chance = new Chance();

export interface TestJobConfig {
    analytics?: boolean;
    maxRetries?: number;
    slicerPort?: number;
    lifecycle?: 'once';
    assets?: string[];
    workers?: number;
    slicers?: number;
    autorecover?: boolean;
    recoveredExecution?: string;
    recoveredSliceType?: string;
    probationWindow?: number;
    newOps?: boolean;
    operations?: any[];
    countPerSlicer?: number;
    failOnSliceRetry?: boolean;
    updateMetadata?: any;
    readerErrorAt?: number[];
    readerResults?: any[];
    slicerResults?: any[];
    slicerErrorAt?: string;
    slicerQueueLength?: number;
    opErrorAt?: number[];
    opResults?: any[];
    log_level?: string;
}

const newConfig = (options: TestJobConfig = {}): ValidatedJobConfig => {
    const { newOps } = options;
    let { operations } = options;
    if (operations == null) {
        if (newOps) {
            operations = [
                withoutNil({
                    _op: path.join(opsPath, 'new-reader'),
                    countPerSlicer: options.countPerSlicer
                }),
                withoutNil({
                    _op: path.join(opsPath, 'new-op'),
                    failOnSliceRetry: options.failOnSliceRetry || false
                }),
                {
                    _op: 'noop'
                }
            ];
        } else {
            operations = [
                withoutNil({
                    _op: path.join(opsPath, 'example-reader'),
                    exampleProp: 321,
                    updateMetadata: options.updateMetadata,
                    errorAt: options.readerErrorAt,
                    results: options.readerResults,
                    slicerResults: options.slicerResults,
                    slicerErrorAt: options.slicerErrorAt,
                    slicerQueueLength: options.slicerQueueLength
                }),
                withoutNil({
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
        probationWindow = 5000,
        log_level
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
        probation_window: probationWindow,
        log_level
    } as unknown as ValidatedJobConfig;
};

export interface SystemConfig {
    clusterName?: string;
    timeout?: number;
    actionTimeout?: number;
    shutdownTimeout?: number;
    assetDir?: string;
    clusterMasterPort?: number;
    log_level_terafoundation?: string;
}

const newSysConfig = (options: SystemConfig) => {
    const {
        clusterName = 'test-teraslice-cluster',
        timeout = 3000,
        actionTimeout = 2000,
        shutdownTimeout = 4000,
        assetDir,
        clusterMasterPort,
        log_level_terafoundation = 'info',
    } = options;

    return {
        terafoundation: {
            log_level: log_level_terafoundation,
            connectors: {
                'elasticsearch-next': {
                    default: {
                        node: [SEARCH_TEST_HOST],
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

export {
    opsPath,
    newConfig,
    newSysConfig
};
