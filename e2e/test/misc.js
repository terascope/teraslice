'use strict';

const {
    memoize,
    cloneDeep,
    toBoolean
} = require('@terascope/utils');
const path = require('path');
const fse = require('fs-extra');
const nanoid = require('nanoid/generate');
const { TerasliceClient } = require('teraslice-client-js');
const ElasticsearchClient = require('elasticsearch').Client;

const {
    TEST_INDEX_PREFIX = 'teratest_',
    ELASTICSEARCH_HOST = 'http://locahost:9200',
    KAFKA_BROKER = 'locahost:9092',
    HOST_IP = '127.0.0.1',
    ELASTICSEARCH_VERSION = '6.8',
    ELASTICSEARCH_API_VERSION = '6.5'
} = process.env;

const KEEP_OPEN = toBoolean(process.env.KEEP_OPEN);

const BASE_PATH = path.join(__dirname, '..');
const CONFIG_PATH = path.join(BASE_PATH, '.config');
const ASSETS_PATH = path.join(BASE_PATH, '.assets');
const SPEC_INDEX_PREFIX = `${TEST_INDEX_PREFIX}spec`;
const EXAMPLE_INDEX_PREFIX = `${TEST_INDEX_PREFIX}example`;
const EXAMLPE_INDEX_SIZES = [100, 1000];

// the uniq cluster name
const CLUSTER_NAME = newId(`${TEST_INDEX_PREFIX}teracluster`, true, 2);

// The number of teraslice-worker instances (see the docker-compose.yml)
const DEFAULT_WORKERS = 2;
// The teraslice-master + the number of teraslice-worker instances (see the docker-compose.yml)
const DEFAULT_NODES = DEFAULT_WORKERS + 1;
// The number of workers per number (see the process-master.yaml and process-worker.yaml)
const WORKERS_PER_NODE = 12;

const compose = require('@terascope/docker-compose-js')('docker-compose.yml');
const signale = require('./signale');

const es = memoize(
    () => new ElasticsearchClient({
        host: ELASTICSEARCH_HOST,
        log: 'error',
        apiVersion: ELASTICSEARCH_API_VERSION
    })
);

const teraslice = memoize(() => new TerasliceClient({
    host: `http://${HOST_IP}:45678`,
    timeout: 2 * 60 * 1000
}));

function newJob(name) {
    return cloneDeep(require(`./fixtures/jobs/${name}.json`));
}

function injectDelay(jobSpec, ms = 1000) {
    jobSpec.operations = [
        jobSpec.operations[0],
        {
            _op: 'delay',
            ms
        },
        ...jobSpec.operations.slice(1, jobSpec.operations.length)
    ];
}

function newSpecIndex(name) {
    return newId(`${SPEC_INDEX_PREFIX}-${name}`, true, 4);
}

function getExampleIndex(size) {
    if (!EXAMLPE_INDEX_SIZES.includes(size)) {
        throw new Error(`No example index with ${size}`);
    }

    return `${EXAMPLE_INDEX_PREFIX}-${size}`;
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

async function cleanupIndex(indexName) {
    await es()
        .indices.delete({ index: indexName })
        .catch(() => {});
}

// Adds teraslice-workers to the environment
function scaleWorkers(workerToAdd = 0) {
    const count = DEFAULT_WORKERS + workerToAdd;
    return scaleService('teraslice-worker', count);
}

function scaleService(service, count) {
    return compose.up({
        scale: `${service}=${count}`,
        timeout: 30,
        'no-recreate': '',
        'no-build': ''
    });
}

function newId(prefix, lowerCase = false, length = 15) {
    let characters = '0123456789abcdefghijklmnopqrstuvwxyz';
    if (!lowerCase) {
        characters += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    }
    const id = nanoid(characters, length);
    if (prefix) {
        return `${prefix}-${id}`;
    }
    return id;
}

async function resetLogs() {
    const logPath = path.join(__dirname, '..', 'logs', 'teraslice.log');
    await fse.writeFile(logPath, '');
}

async function globalTeardown() {
    if (KEEP_OPEN) {
        return;
    }

    const errors = [];

    await compose
        .down({
            'remove-orphans': '',
            volumes: ''
        })
        .catch((err) => errors.push(err));

    await cleanupIndex(`${TEST_INDEX_PREFIX}*`);
    if (fse.existsSync(CONFIG_PATH)) {
        await fse.remove(CONFIG_PATH).catch((err) => errors.push(err));
    }
    if (fse.existsSync(ASSETS_PATH)) {
        await fse.remove(ASSETS_PATH).catch((err) => errors.push(err));
    }

    if (errors.length) {
        errors.forEach((err) => signale.error(err));
    }
}

module.exports = {
    newJob,
    cleanupIndex,
    teraslice,
    es,
    indexStats,
    compose,
    injectDelay,
    scaleWorkers,
    scaleService,
    getExampleIndex,
    globalTeardown,
    newSpecIndex,
    resetLogs,
    EXAMLPE_INDEX_SIZES,
    EXAMPLE_INDEX_PREFIX,
    SPEC_INDEX_PREFIX,
    ELASTICSEARCH_HOST,
    ELASTICSEARCH_VERSION,
    ELASTICSEARCH_API_VERSION,
    HOST_IP,
    KAFKA_BROKER,
    CLUSTER_NAME,
    TEST_INDEX_PREFIX,
    DEFAULT_NODES,
    DEFAULT_WORKERS,
    WORKERS_PER_NODE,
    BASE_PATH,
    CONFIG_PATH,
    ASSETS_PATH,
};
