'use strict';

const path = require('path');
const Chance = require('chance');
const random = require('lodash/random');
const pickBy = require('lodash/pickBy');
const newId = require('../../lib/utils/new-id');

const opsPath = path.join(__dirname, '..', 'fixtures', 'ops');

const { ELASTICSEARCH_HOST } = process.env;

const chance = new Chance();

const newSliceConfig = (request = { example: 'slice-data' }) => ({
    slice_id: newId('slice-id', true),
    slicer_id: newId('slicer-id', true),
    slicer_order: random(0, 1000),
    request,
    _created: new Date().toISOString()
});

const newConfig = (options = {}) => {
    const {
        analytics = false,
        assignment = 'worker',
        maxRetries = 0,
        slicerPort = 0,
        lifecycle = 'once',
        assets = [],
        workers = 1,
        slicers = 1,
        recoveredExecution,
        recoveredSliceType,
        operations = [
            pickBy({
                _op: path.join(opsPath, 'example-reader'),
                exampleProp: 321,
                errorAt: options.readerErrorAt,
                results: options.readerResults,
                slicerResults: options.slicerResults,
                slicerErrorAt: options.slicerErrorAt,
                slicerQueueLength: options.slicerQueueLength,
            }),
            pickBy({
                _op: path.join(opsPath, 'example-op'),
                exampleProp: 123,
                errorAt: options.opErrorAt,
                results: options.opResults,
            })
        ],
    } = options;
    return {
        assignment,
        job: {
            name: chance.name({ middle: true }),
            slicers,
            workers,
            assets,
            analytics,
            lifecycle,
            max_retries: maxRetries,
            operations,
            recovered_execution: recoveredExecution,
            recovered_slice_type: recoveredSliceType
        },
        ex_id: newId('ex-id', true),
        job_id: newId('job-id', true),
        node_id: newId('node-id', true),
        slicer_port: slicerPort,
        slicer_hostname: 'localhost'
    };
};


const newSysConfig = (options = {}) => {
    const {
        clusterName = 'test-teraslice-cluster',
        timeout = 3000,
        actionTimeout = 2000,
        assetDir,
        clusterMasterPort,
    } = options;

    return {
        terafoundation: {
            environment: 'development',
            connectors: {
                elasticsearch: {
                    default: {
                        host: [ELASTICSEARCH_HOST],
                        requestTimeout: timeout,
                        deadTimeout: timeout,
                    }
                }
            }
        },
        teraslice: {
            assets_directory: assetDir,
            shutdown_timeout: timeout,
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
        }
    };
};

module.exports = {
    opsPath,
    newConfig,
    newSliceConfig,
    newSysConfig
};
