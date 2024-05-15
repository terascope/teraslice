import {
    ExecutionConfig, JobValidator, TestContext,
    JobConfigParams, ExecutionContextConfig, Assignment,
    makeExecutionContext, TestClientConfig,
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
    executionContext!: U;
    readonly context: TestContext;
    readonly job: JobConfigParams;
    readonly assetPaths: string [];

    constructor(job: JobConfigParams, options: JobHarnessOptions, assignment: Assignment) {
        const testName = [assignment, job.name].filter((s) => s).join(':');
        this.context = new TestContext(testName, {
            assignment,
            clients: options.clients,
        });

        this.events = this.context.apis.foundation.getSystemEvents();
        this.job = job;
        this.assetPaths = this._getAssetDirs(options.assetDir);
    }
    /**
     * Initialize any test code
    */
    async initialize(): Promise<void> {
        const config = await this.makeContextConfig(this.job, this.assetPaths);
        this.executionContext = await makeExecutionContext(config) as U;
    }

    setClients(clients: TestClientConfig[]): void {
        this.context.apis.setTestClients(clients);
    }

    protected async makeContextConfig(
        job: JobConfigParams,
        assets: string[] = [process.cwd()]
    ): Promise<ExecutionContextConfig> {
        const assetIds = job.assets ? [...job.assets, '.'] : ['.'];
        this.context.sysconfig.teraslice.assets_directory = assets;
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
    }
}
