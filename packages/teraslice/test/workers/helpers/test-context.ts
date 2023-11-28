/* eslint-disable no-console */

import fs from 'fs-extra';
import path from 'node:path';
import type { EventEmitter } from 'node:events';
import { createTempDirSync, cleanupTempDirs } from 'jest-fixtures';
import {
    newTestSlice, get, pWhile,
    ExecutionContext
} from '@terascope/job-components';
import { ClusterMaster } from '@terascope/teraslice-messaging';
import {
    AssetsStorage, StateStorage, AnalyticsStorage,
    ExecutionStorage, JobsStorage
} from '../../../src/lib/storage';
import { initializeTestExecution } from '../../../src/lib/workers/helpers/job';
import { makeTerafoundationContext } from '../../../src/lib/workers/context/terafoundation-context';
import { makeExecutionContext } from '../../../src/lib/workers/context/execution-context';
import { newId } from '../../../src/lib/utils/id_utils';
import { findPort } from '../../../src/lib/utils/port_utils';
import { newConfig, newSysConfig, TestJobConfig } from './configs';
import { zipDirectory } from './zip-directory';

import { TERASLICE_CLUSTER_NAME } from '../../test.config';

const cleanups = {};
const tmpAssetDir = createTempDirSync();
const clusterName = `${TERASLICE_CLUSTER_NAME}`;

interface TestStoreContainer {
    assetsStorage?: AssetsStorage;
    stateStorage?: StateStorage;
    analyticsStorage?: AnalyticsStorage;
    executionStorage?: ExecutionStorage
    jobsStorage?: JobsStorage
}

const stores: TestStoreContainer = {};

export interface TestContextArgs extends TestJobConfig {
    timeout?: number;
    actionTimeout?: number;
    shutdownTimeout?: number;
    clusterMasterPort?: number;
    assignment?: string
}

export class TestContext {
    setupId: string;
    assetDir: string;
    sysconfig: Record<string, any>;
    config: Record<string, any>;
    context: any;
    clean = false;
    nodeId!: string;
    exId!: string;
    jobId!: string;
    events: EventEmitter;
    _cleanupFns: Array<() => void> = [];
    executionContext!: ExecutionContext;

    clusterMaster!: ClusterMaster.Server;

    constructor(options: TestContextArgs = {}) {
        const {
            clusterMasterPort, shutdownTimeout, actionTimeout, timeout
        } = options;

        this.setupId = newId('setup', true);
        this.assetDir = tmpAssetDir;

        this.sysconfig = newSysConfig({
            clusterName,
            assetDir: this.assetDir,
            clusterMasterPort,
            actionTimeout,
            timeout,
            shutdownTimeout
        });

        this.config = newConfig(options);

        this.context = makeTerafoundationContext({ sysconfig: this.sysconfig });
        this.context.assignment = options.assignment || 'worker';

        this.events = this.context.apis.foundation.getSystemEvents();

        cleanups[this.setupId] = () => this.cleanup();
    }

    // make sure we cleanup if any test fails to cleanup properly
    static async cleanupAll(withEs = false) {
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
                await Promise.all(Object.values(stores).map((store) => store.shutdown(true)));
            } catch (err) {
                console.error(err);
            }
        }
    }

    static async waitForCleanup() {
        return pWhile(async () => !Object.keys(cleanups).length, {
            name: 'Test Context',
            timeoutMs: 3000
        });
    }

    async initialize(makeItReal = false, initOptions = {}) {
        if (makeItReal) {
            await Promise.all([
                this.addJobStore(),
                this.addExStore(),
                this.addStateStore()
            ]);

            const { ex } = await initializeTestExecution(Object.assign({
                context: this.context,
                config: this.config,
                stores,
            }, initOptions) as any);
            this.config = ex;
        }

        this.executionContext = await makeExecutionContext(this.context, this.config as any);
        // @ts-expect-error
        this.nodeId = this.executionContext.config.node_id;
        this.exId = this.executionContext.config.ex_id;
        this.jobId = this.executionContext.config.job_id;
    }

    get stores() {
        return stores;
    }

    async addClusterMaster() {
        if (this.clusterMaster) return this.clusterMaster;

        const port = await findPort();
        const networkLatencyBuffer = get(
            this.context,
            'sysconfig.teraslice.network_latency_buffer'
        );
        const actionTimeout = get(this.context, 'sysconfig.teraslice.action_timeout');
        const nodeDisconnectTimeout = get(
            this.context,
            'sysconfig.teraslice.node_disconnect_timeout'
        );

        this.clusterMaster = new ClusterMaster.Server({
            port,
            networkLatencyBuffer,
            actionTimeout,
            nodeDisconnectTimeout
        });

        await this.clusterMaster.start();

        this.context.sysconfig.teraslice.port = port;
        this.attachCleanup(() => this.clusterMaster.shutdown());
        return this.clusterMaster;
    }

    attachCleanup(fn: () => void) {
        this._cleanupFns.push(fn);
    }

    async saveAsset(assetDir: string, cleanup?: boolean) {
        await this.addAssetStore();
        const exists = await fs.pathExists(assetDir);

        if (!exists) {
            const err = new Error(`Asset Directory ${assetDir} does not exist`);
            console.error(err.stack); // eslint-disable-line no-console
            throw err;
        }

        const assetZip = await zipDirectory(assetDir);

        if (!stores.assetsStorage) {
            throw new Error('Assets storage is not setup');
        }

        const { assetId } = await stores.assetsStorage.save(assetZip);

        if (cleanup) {
            await fs.remove(path.join(this.assetDir, assetId));
        }

        return assetId;
    }

    async newSlice() {
        const sliceConfig = newTestSlice({ request: { example: 'slice-data' } });
        await this.addStateStore();
        await stores.stateStorage!.createState(this.exId, sliceConfig, 'start');

        return sliceConfig;
    }

    async addAssetStore() {
        if (stores.assetsStorage) {
            return stores.assetsStorage;
        }

        stores.assetsStorage = new AssetsStorage(this.context);
        await stores.assetsStorage.initialize();

        delete this.context.apis.assets;
        return stores.assetsStorage;
    }

    async addStateStore() {
        if (stores.stateStorage) {
            return stores.stateStorage;
        }

        stores.stateStorage = new StateStorage(this.context);
        await stores.stateStorage.initialize();

        return stores.stateStorage;
    }

    async addAnalyticsStore() {
        if (stores.analyticsStorage) {
            return stores.analyticsStorage;
        }

        stores.analyticsStorage = new AnalyticsStorage(this.context);
        await stores.analyticsStorage.initialize();

        return stores.analyticsStorage;
    }

    async addJobStore() {
        if (stores.jobsStorage) {
            return stores.jobsStorage;
        }

        stores.jobsStorage = new JobsStorage(this.context);
        await stores.jobsStorage.initialize();

        return stores.jobsStorage;
    }

    async addExStore() {
        if (stores.executionStorage) {
            return stores.executionStorage;
        }

        stores.executionStorage = new ExecutionStorage(this.context);
        await stores.executionStorage.initialize();

        return stores.executionStorage;
    }

    async cleanup() {
        if (this.clean) return;

        await Promise.all(this._cleanupFns.map((fn) => fn()));
        this._cleanupFns.length = 0;

        this.events.removeAllListeners();

        delete cleanups[this.setupId];

        this.clean = true;
    }
}
