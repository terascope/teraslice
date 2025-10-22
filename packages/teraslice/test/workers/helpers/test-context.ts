import fs from 'fs-extra';
import path from 'node:path';
import type { EventEmitter } from 'node:events';
import { createTempDirSync, cleanupTempDirs } from 'jest-fixtures';
import { newTestSlice, ExecutionContext } from '@terascope/job-components';
import { get, pWhile } from '@terascope/core-utils';
import { ClusterMaster } from '@terascope/teraslice-messaging';
import {
    AssetsStorage, StateStorage, AnalyticsStorage,
    ExecutionStorage, JobsStorage
} from '../../../src/lib/storage/index.js';
import { initializeTestExecution } from '../../../src/lib/workers/helpers/job.js';
import { makeTerafoundationContext } from '../../../src/lib/workers/context/terafoundation-context.js';
import { makeExecutionContext } from '../../../src/lib/workers/context/execution-context.js';
import { newId } from '../../../src/lib/utils/id_utils.js';
import { findPort } from '../../../src/lib/utils/port_utils.js';
import { newConfig, newSysConfig, TestJobConfig } from './configs.js';
import { zipDirectory } from './zip-directory.js';

import { TERASLICE_CLUSTER_NAME } from '../../test.config.js';

const tmpAssetDir = createTempDirSync();
const clusterName = `${TERASLICE_CLUSTER_NAME}`;

interface TestStoreContainer {
    assetsStorage?: AssetsStorage;
    stateStorage?: StateStorage;
    analyticsStorage?: AnalyticsStorage;
    executionStorage?: ExecutionStorage;
    jobsStorage?: JobsStorage;
}

export interface TestContextArgs extends TestJobConfig {
    timeout?: number;
    actionTimeout?: number;
    shutdownTimeout?: number;
    clusterMasterPort?: number;
    assignment?: string;
    log_level_terafoundation?: string;
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
    events!: EventEmitter;
    _cleanupFns: Array<() => void> = [];
    executionContext!: ExecutionContext;
    assignment: string;
    clusterMaster!: ClusterMaster.Server;
    _stores: TestStoreContainer = {};
    cleanups: Record<string, () => Promise<void>> = {};

    constructor(options: TestContextArgs = {}) {
        const {
            clusterMasterPort, shutdownTimeout, actionTimeout, timeout, log_level_terafoundation
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
            log_level_terafoundation
        });

        this.config = newConfig(options);
        this.cleanups[this.setupId] = () => this.cleanup();
        this.assignment = options.assignment || 'worker';
    }

    // make sure we cleanup if any test fails to cleanup properly
    async cleanupAll(withEs = false) {
        const count = Object.keys(this.cleanups).length;
        if (!count) return;

        const fns = Object.keys(this.cleanups).map(async (name) => {
            const fn = this.cleanups[name];
            try {
                await fn();
            } catch (err) {
                console.error(`Failed to cleanup ${name}`, err);
            }
            delete this.cleanups[name];
        });
        await Promise.all(fns);

        try {
            cleanupTempDirs();
        } catch (err) {
            console.error(err);
        }

        if (withEs && Object.keys(this._stores).length) {
            try {
                await Promise.all(Object.values(this._stores).map((store) => store.shutdown(true)));
            } catch (err) {
                console.error(err);
            }
        }
    }

    async waitForCleanup() {
        return pWhile(async () => !Object.keys(this.cleanups).length, {
            name: 'Test Context',
            timeoutMs: 3000
        });
    }

    async initialize(makeItReal = false, initOptions = {}) {
        this.context = await makeTerafoundationContext({ sysconfig: this.sysconfig });
        this.context.assignment = this.assignment;
        this.events = this.context.apis.foundation.getSystemEvents();

        if (makeItReal) {
            await Promise.all([
                this.addJobStore(),
                this.addExStore(),
                this.addStateStore()
            ]);

            const { ex } = await initializeTestExecution(Object.assign({
                context: this.context,
                config: this.config,
                stores: this._stores,
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
        return this._stores;
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
            throw err;
        }

        const assetZip = await zipDirectory(assetDir);

        if (!this._stores.assetsStorage) {
            throw new Error('Assets storage is not setup');
        }

        const { assetId } = await this._stores.assetsStorage.save(assetZip);

        if (cleanup) {
            await fs.remove(path.join(this.assetDir, assetId));
        }

        return assetId;
    }

    async newSlice() {
        const sliceConfig = newTestSlice({ request: { example: 'slice-data' } });
        await this.addStateStore();
        await this._stores.stateStorage!.createState(this.exId, sliceConfig, 'start');

        return sliceConfig;
    }

    async addAssetStore() {
        if (this._stores.assetsStorage) {
            return this._stores.assetsStorage;
        }

        this._stores.assetsStorage = new AssetsStorage(this.context);
        await this._stores.assetsStorage.initialize();

        delete this.context.apis.assets;
        return this._stores.assetsStorage;
    }

    async addStateStore() {
        if (this._stores.stateStorage) {
            return this._stores.stateStorage;
        }

        this._stores.stateStorage = new StateStorage(this.context);
        await this._stores.stateStorage.initialize();

        return this._stores.stateStorage;
    }

    async addAnalyticsStore() {
        if (this._stores.analyticsStorage) {
            return this._stores.analyticsStorage;
        }

        this._stores.analyticsStorage = new AnalyticsStorage(this.context);
        await this._stores.analyticsStorage.initialize();

        return this._stores.analyticsStorage;
    }

    async addJobStore() {
        if (this._stores.jobsStorage) {
            return this._stores.jobsStorage;
        }

        this._stores.jobsStorage = new JobsStorage(this.context);
        await this._stores.jobsStorage.initialize();

        return this._stores.jobsStorage;
    }

    async addExStore() {
        if (this._stores.executionStorage) {
            return this._stores.executionStorage;
        }

        this._stores.executionStorage = new ExecutionStorage(this.context);
        await this._stores.executionStorage.initialize();

        return this._stores.executionStorage;
    }

    async cleanup() {
        if (this.clean) return;

        await Promise.all(this._cleanupFns.map((fn) => fn()));
        this._cleanupFns.length = 0;

        this.events.removeAllListeners();

        delete this.cleanups[this.setupId];

        this.clean = true;
    }
}
