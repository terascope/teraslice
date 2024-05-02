import {
    ExecutionConfig, JobValidator, TestContext,
    JobConfig, ExecutionContextConfig, Assignment,
    makeExecutionContext, TestClientConfig,
    ClusterManagerType,
} from '@terascope/job-components';
import { EventEmitter } from 'events';
import {
    JobHarnessOptions,
    ExecutionContext,
} from './interfaces';
import { resolveAssetDir } from './utils';

/**
 * A base class for the Slicer and Worker TestHarnesses
 *
 * @todo Add support for validating the asset.json?
*/
export default class BaseTestHarness<U extends ExecutionContext> {
    readonly events: EventEmitter;
    readonly executionContext: U;
    readonly context: TestContext;

    constructor(job: JobConfig, options: JobHarnessOptions, assignment: Assignment) {
        const testName = [assignment, job.name].filter((s) => s).join(':');
        this.context = new TestContext(testName, {
            assignment,
            clients: options.clients,
            cluster_manager_type: options.cluster_manager_type,
        });

        this.events = this.context.apis.foundation.getSystemEvents();
        const config = this.makeContextConfig(
            job,
            this._getAssetDirs(options.assetDir),
            options.cluster_manager_type);
        this.executionContext = makeExecutionContext(config) as U;
    }

    /**
     * Initialize any test cod
    */
    async initialize(): Promise<void> {
    }

    setClients(clients: TestClientConfig[]): void {
        this.context.apis.setTestClients(clients);
    }

    protected makeContextConfig(
        job: JobConfig,
        assets: string[] = [process.cwd()],
        cluster_manager_type: ClusterManagerType = 'native'
    ): ExecutionContextConfig {
        const assetIds = job.assets ? [...job.assets, '.'] : ['.'];
        this.context.sysconfig.teraslice.assets_directory = assets;
        this.context.sysconfig.teraslice.cluster_manager_type = cluster_manager_type;
        job.assets = assetIds;

        const jobValidator = new JobValidator(this.context);
        const executionConfig = jobValidator.validateConfig(job) as ExecutionConfig;
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
    }
}
