import {
    ExecutionConfig, JobValidator, TestContext,
    JobConfigParams, ExecutionContextConfig, Assignment,
    makeExecutionContext, TestClientConfig,
    ClusterManagerType,
} from '@terascope/job-components';
import { EventEmitter } from 'node:events';
import {
    JobHarnessOptions,
    ExecutionContext,
} from './interfaces.js';
import { resolveAssetDir } from './utils.js';

/**
 * A base class for the Slicer and Worker TestHarnesses
 *
 * @todo Add support for validating the asset.json?
*/
export default class BaseTestHarness<U extends ExecutionContext> {
    readonly events: EventEmitter;
    executionContext!: U;
    readonly context: TestContext;
    readonly job: JobConfigParams;
    readonly assetPaths: string [];
    readonly clusterType?: ClusterManagerType;

    constructor(job: JobConfigParams, options: JobHarnessOptions, assignment: Assignment) {
        const testName = [assignment, job.name].filter((s) => s).join(':');
        this.context = new TestContext(testName, {
            assignment,
            clients: options.clients,
            cluster_manager_type: options.cluster_manager_type,
        });

        this.events = this.context.apis.foundation.getSystemEvents();
        this.job = job;
        this.assetPaths = this._getAssetDirs(options.assetDir);
        this.clusterType = options.cluster_manager_type;
    }

    /**
     * Initialize any test code
    */
    async initialize(): Promise<void> {
        const config = await this.makeContextConfig(this.job, this.assetPaths, this.clusterType);
        this.executionContext = await makeExecutionContext(config) as U;
    }

    setClients(clients: TestClientConfig[]): void {
        this.context.apis.setTestClients(clients);
    }

    protected async makeContextConfig(
        job: JobConfigParams,
        assets: string[] = [process.cwd()],
        cluster_manager_type: ClusterManagerType = 'native'
    ): Promise<ExecutionContextConfig> {
        const assetIds = job.assets ?? [];

        if (!assetIds.includes('.')) {
            assetIds.push('.');
        }

        this.context.sysconfig.teraslice.assets_directory = assets;
        this.context.sysconfig.teraslice.cluster_manager_type = cluster_manager_type;

        job.assets = assetIds;

        const jobValidator = new JobValidator(this.context);
        const executionConfig = await jobValidator.validateConfig(job) as ExecutionConfig;

        return {
            context: this.context,
            executionConfig,
            assetIds
        };
    }

    private _getAssetDirs(assetDir: string | string[] = [process.cwd()]) {
        if (Array.isArray(assetDir)) {
            return resolveAssetDir(assetDir);
        }

        return resolveAssetDir([assetDir]);
    }

    /**
     * Cleanup test code
    */
    async shutdown(): Promise<void> {
        this.events.removeAllListeners();
        if (this.executionContext) {
            await this.executionContext.shutdown();
        }
    }
}
