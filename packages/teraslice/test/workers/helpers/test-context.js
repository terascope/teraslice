'use strict';

/* eslint-disable no-console */

const Promise = require('bluebird');
const _ = require('lodash');
const { createTempDirSync, cleanupTempDirs } = require('jest-fixtures');
const path = require('path');
const fs = require('fs-extra');
const { ClusterMaster } = require('@terascope/teraslice-messaging');

const {
    makeAssetStore,
    makeStateStore,
    makeAnalyticsStore,
    makeExStore,
    makeJobStore,
} = require('../../../lib/cluster/storage');

const { initializeJob } = require('../../../lib/workers/helpers/job');
const makeTerafoundationContext = require('../../../lib/workers/context/terafoundation-context');
const makeExecutionContext = require('../../../lib/workers/context/execution-context');
const { newId } = require('../../../lib/utils/id_utils');
const { findPort } = require('../../../lib/utils/port_utils');
const { newConfig, newSysConfig, newSliceConfig } = require('./configs');
const zipDirectory = require('./zip-directory');

const { TERASLICE_CLUSTER_NAME } = process.env;

const cleanups = {};
const tmpAssetDir = createTempDirSync();
const clusterName = `${TERASLICE_CLUSTER_NAME}`;

const stores = {};

class TestContext {
    constructor(options = {}) {
        const {
            clusterMasterPort,
            shutdownTimeout,
            actionTimeout,
            timeout,
        } = options;

        this.setupId = newId('setup', true);
        this.assetDir = tmpAssetDir;

        this.sysconfig = newSysConfig({
            clusterName,
            assetDir: this.assetDir,
            clusterMasterPort,
            actionTimeout,
            timeout,
            shutdownTimeout,
        });

        this.config = newConfig(options);

        this.context = makeTerafoundationContext({ sysconfig: this.sysconfig });
        this.context.assignment = options.assignment || 'worker';

        this.events = this.context.apis.foundation.getSystemEvents();

        this.clean = false;
        this._cleanupFns = [];

        cleanups[this.setupId] = () => this.cleanup();
    }

    async initialize(makeItReal = false) {
        if (makeItReal) {
            await this.addJobStore();
            await this.addExStore();

            const { ex } = await initializeJob(this.context, this.config.job, stores);
            this.config = ex;
        }

        this.executionContext = await makeExecutionContext(this.context, this.config);

        this.nodeId = this.executionContext.config.node_id;
        this.exId = this.executionContext.config.ex_id;
        this.jobId = this.executionContext.config.job_id;
    }

    get stores() { // eslint-disable-line
        return stores;
    }

    async addClusterMaster() {
        if (this.clusterMaster) return this.clusterMaster;

        const port = await findPort();
        const networkLatencyBuffer = _.get(this.context, 'sysconfig.teraslice.network_latency_buffer');
        const actionTimeout = _.get(this.context, 'sysconfig.teraslice.action_timeout');
        const nodeDisconnectTimeout = _.get(this.context, 'sysconfig.teraslice.node_disconnect_timeout');

        this.clusterMaster = new ClusterMaster.Server({
            port,
            networkLatencyBuffer,
            actionTimeout,
            nodeDisconnectTimeout,
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
        const assetId = await stores.assetStore.save(assetZip);
        if (cleanup) await fs.remove(path.join(this.assetDir, assetId));
        return assetId;
    }

    async newSlice() {
        const sliceConfig = newSliceConfig();
        await this.addStateStore();
        await stores.stateStore.createState(this.exId, sliceConfig, 'start');
        return sliceConfig;
    }

    async addAssetStore() {
        if (stores.assetStore) return stores.assetStore;

        stores.assetStore = await makeAssetStore(this.context);
        delete this.context.apis.assets;
        return stores.assetStore;
    }

    async addStateStore() {
        if (stores.stateStore) return stores.stateStore;

        stores.stateStore = await makeStateStore(this.context);
        return stores.stateStore;
    }

    async addAnalyticsStore() {
        if (stores.analyticsStore) return stores.analyticsStore;

        stores.analyticsStore = await makeAnalyticsStore(this.context);
        return stores.analyticsStore;
    }

    async addJobStore() {
        if (stores.jobStore) return stores.jobStore;

        stores.jobStore = await makeJobStore(this.context);
        return stores.jobStore;
    }

    async addExStore() {
        if (stores.exStore) return stores.exStore;

        stores.exStore = await makeExStore(this.context);
        return stores.exStore;
    }

    async cleanup() {
        if (this.clean) return;

        await Promise.map(this._cleanupFns, fn => fn());
        this._cleanupFns.length = 0;

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

    try {
        cleanupTempDirs();
    } catch (err) {
        console.error(err);
    }

    if (withEs && Object.keys(stores).length) {
        try {
            await Promise.map(stores, store => store.shutdown(true));
        } catch (err) {
            console.error(err);
        }
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
