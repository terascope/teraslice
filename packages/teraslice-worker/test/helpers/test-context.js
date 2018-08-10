'use strict';

/* eslint-disable no-console */

const _ = require('lodash');
const { createTempDirSync, cleanupTempDirs } = require('jest-fixtures');
const ElasticsearchClient = require('elasticsearch').Client;
const path = require('path');
const fs = require('fs-extra');

const {
    makeAssetStore,
    makeStateStore,
    makeAnalyticsStore,
    makeExStore,
    makeJobStore,
    initializeJob,
} = require('../../lib/teraslice');

const makeExecutionContext = require('../../lib/execution-context');
const newId = require('../../lib/utils/new-id');
const { generateContext } = require('../../lib/utils/context');
const { newConfig, newSysConfig, newSliceConfig } = require('./configs');
const zipDirectory = require('./zip-directory');
const findPort = require('./find-port');
const ClusterMasterServer = require('./cluster-master-server');

const { TERASLICE_CLUSTER_NAME, ELASTICSEARCH_HOST } = process.env;

const cleanups = {};
const clusterName = `${TERASLICE_CLUSTER_NAME}${newId('', true, 5)}`;
const es = new ElasticsearchClient({
    host: ELASTICSEARCH_HOST,
    log: '' // This suppresses error logging from the ES library.
});

class TestContext {
    constructor(options = {}) {
        const {
            clusterMasterPort,
            useExecutionRunner,
        } = options;

        this.setupId = newId('setup', true);
        this.assetDir = createTempDirSync();

        this.sysconfig = newSysConfig({
            clusterName,
            assetDir: this.assetDir,
            clusterMasterPort,
        });

        this.useExecutionRunner = useExecutionRunner;
        this.config = newConfig(options);

        this.context = generateContext(this.sysconfig, true);

        this.events = this.context.apis.foundation.getSystemEvents();

        this.stores = {};
        this.clean = false;
        this._cleanupFns = [];

        cleanups[this.setupId] = () => this.cleanup();
    }

    async initialize(makeItReal = false) {
        if (makeItReal) {
            await this.addJobStore();
            await this.addExStore();

            const { job, ex } = await initializeJob(this.context, this.config.job, this.stores);

            this.config.job = job;
            this.config.job_id = ex.job_id;
            this.config.ex_id = ex.ex_id;
        }

        this.executionContext = await makeExecutionContext(
            this.context,
            this.config,
            this.useExecutionRunner
        );

        this.nodeId = this.executionContext.node_id;
        this.exId = this.executionContext.ex_id;
        this.jobId = this.executionContext.job_id;
    }

    async addClusterMaster() {
        if (this.clusterMaster) return this.clusterMaster;

        const port = await findPort();
        const networkLatencyBuffer = _.get(this.context, 'sysconfig.teraslice.network_latency_buffer');
        const actionTimeout = _.get(this.context, 'sysconfig.teraslice.action_timeout');

        this.clusterMaster = new ClusterMasterServer({
            port,
            networkLatencyBuffer,
            actionTimeout,
        });

        await this.clusterMaster.start();

        this.context.sysconfig.teraslice.port = port;
        this.attachCleanup(() => this.clusterMaster.shutdown());
        return this.clusterMaster;
    }

    attachCleanup(fn) {
        this._cleanupFns.push(fn);
    }

    async saveAsset(assetDir, cleanup) {
        await this.addAssetStore();
        const exists = await fs.pathExists(assetDir);
        if (!exists) {
            const err = new Error(`Asset Directory ${assetDir} does not exist`);
            console.error(err.stack); // eslint-disable-line no-console
            throw err;
        }
        const assetZip = await zipDirectory(assetDir);
        const assetId = await this.stores.assetStore.save(assetZip);
        if (cleanup) await fs.remove(path.join(this.assetDir, assetId));
        return assetId;
    }

    async newSlice() {
        const sliceConfig = newSliceConfig();
        await this.addStateStore();
        await this.stores.stateStore.createState(this.exId, sliceConfig, 'start');
        return sliceConfig;
    }

    async addAssetStore() {
        if (this.stores.assetStore) return this.stores.assetStore;

        this.stores.assetStore = await makeAssetStore(this.context);
        delete this.context.apis.assets;
        return this.stores.assetStore;
    }

    async addStateStore() {
        if (this.stores.stateStore) return this.stores.stateStore;

        this.stores.stateStore = await makeStateStore(this.context);
        return this.stores.stateStore;
    }

    async addAnalyticsStore() {
        if (this.stores.analyticsStore) return this.stores.analyticsStore;

        this.stores.analyticsStore = await makeAnalyticsStore(this.context);
        return this.stores.analyticsStore;
    }

    async addJobStore() {
        if (this.stores.jobStore) return this.stores.jobStore;

        this.stores.jobStore = await makeJobStore(this.context);
        return this.stores.jobStore;
    }

    async addExStore() {
        if (this.stores.exStore) return this.stores.exStore;

        this.stores.exStore = await makeExStore(this.context);
        return this.stores.exStore;
    }

    async cleanup() {
        if (this.clean) return;

        await Promise.map(this._cleanupFns, fn => fn());
        this._cleanupFns.length = 0;

        const stores = Object.values(this.stores);
        try {
            await Promise.map(stores, store => store.shutdown(true));
        } catch (err) {
            console.error(err);
        }

        try {
            cleanupTempDirs();
        } catch (err) {
            console.error(err);
        }

        this.events.removeAllListeners();

        delete cleanups[this.setupId];

        this.clean = true;
    }
}

// make sure we cleanup if any test fails to cleanup properly
async function cleanupAll(withEs) {
    const count = Object.keys(cleanups).length;
    if (!count) return;

    const fns = Object.keys(cleanups).map(async (name) => {
        const fn = cleanups[name];
        try {
            await fn();
        } catch (err) {
            console.error(`Failed to cleanup ${name}`, err);
        }
        delete cleanups[name];
    });
    await Promise.all(fns);
    if (withEs) {
        await es.indices.delete({ index: `${clusterName}*` });
    }
}

beforeAll(async () => {
    await cleanupAll(true);
}, Object.keys(cleanups).length * 5000);

beforeEach((done) => {
    function readyStart() {
        const count = Object.keys(cleanups).length;
        if (count > 1) {
            setTimeout(readyStart, 10);
            return;
        }
        done();
    }
    readyStart();
});

afterEach(() => cleanupAll(), Object.keys(cleanups).length * 5000);

module.exports = TestContext;

module.exports.cleanupAll = cleanupAll;
