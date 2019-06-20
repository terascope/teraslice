'use strict';

const _ = require('lodash');
const Promise = require('bluebird');
const TerasliceClient = require('teraslice-client-js');
const ElasticsearchClient = require('elasticsearch').Client;

// The number of teraslice-worker instances (see the docker-compose.yml)
const DEFAULT_WORKERS = 2;
// The teraslice-master + the number of teraslice-worker instances (see the docker-compose.yml)
const DEFAULT_NODES = DEFAULT_WORKERS + 1;
// The number of workers per number (see the process-master.yaml and process-worker.yaml)
const WORKERS_PER_NODE = 12;

const DOCKER_IP = process.env.ip ? process.env.ip : 'localhost';
const compose = require('@terascope/docker-compose-js')('docker-compose.yml');

function newJob(name) {
    return _.cloneDeep(require(`./fixtures/jobs/${name}.json`));
}

function injectDelay(jobSpec, ms = 1000) {
    jobSpec.operations = [
        jobSpec.operations[0],
        {
            _op: 'delay',
            ms,
        },
        ...jobSpec.operations.slice(1, jobSpec.operations.length),
    ];
}

function teraslice() {
    return TerasliceClient({
        host: `http://${DOCKER_IP}:45678`,
        timeout: 2 * 60 * 1000,
    });
}

function es() {
    return new ElasticsearchClient({
        host: `http://${DOCKER_IP}:49200`,
        log: '', // This suppresses error logging from the ES library.
    });
}

function indexStats(indexName) {
    return new Promise((resolve, reject) => {
        // delay for 100ms because sometimes the execution
        // is marked as complete but the indices stats is one off
        // because it happened too quickly
        setTimeout(() => {
            es()
                .indices.refresh({ index: indexName })
                .then(() => {
                    es()
                        .indices.stats({ index: indexName })
                        .then((stats) => {
                            resolve(stats._all.total.docs);
                        })
                        .catch((err) => {
                            reject(err);
                        });
                })
                .catch((err) => {
                    reject(err);
                });
        }, 100);
    });
}

function cleanupIndex(indexName) {
    return Promise.resolve()
        .then(() => es().indices.delete({ index: indexName }))
        .catch(() => Promise.resolve());
}

// Adds teraslice-workers to the environment
function scaleWorkers(workerToAdd = 0) {
    const count = DEFAULT_WORKERS + workerToAdd;
    return scaleService('teraslice-worker', count);
}

function scaleService(service, count) {
    return compose.up({
        scale: `${service}=${count}`,
        'no-recreate': '',
        'no-deps': '',
        'no-build': '',
    });
}

module.exports = {
    newJob,
    cleanupIndex,
    teraslice: _.memoize(teraslice),
    es: _.memoize(es),
    indexStats,
    compose,
    injectDelay,
    scaleWorkers,
    scaleService,
    DEFAULT_NODES,
    DEFAULT_WORKERS,
    WORKERS_PER_NODE,
};
