import fs from 'fs-extra';
import path from 'path';
import {
    ExecutionConfig, JobValidator, TestContext,
    JobConfig, ExecutionContextConfig, Assignment,
    makeExecutionContext, TestClientConfig,
} from '@terascope/job-components';
import { EventEmitter } from 'events';
import { JobHarnessOptions, ExecutionContext } from './interfaces.js';
import { resolveAssetDir } from './utils.js';

/**
 * A base class for the Slicer and Worker TestHarnesses
 *
 * @todo Add support for validating the asset.json?
*/
export default class BaseTestHarness<U extends ExecutionContext> {
    readonly events: EventEmitter;
    readonly executionContext!: U;
    readonly context: TestContext;
    readonly baseJobConfig: JobConfig;
    readonly options: JobHarnessOptions;

    constructor(job: JobConfig, options: JobHarnessOptions, assignment: Assignment) {
        const testName = [assignment, job.name].filter((s) => s).join(':');
        this.context = new TestContext(testName, {
            assignment,
            clients: options.clients,
        });
        this.baseJobConfig = job;
        this.events = this.context.apis.foundation.getSystemEvents();
        this.options = options;
    }

    /**
     * Initialize any test cod
    */
    async initialize(): Promise<void> {
        const config = await this.makeContextConfig(this.baseJobConfig, this._getAssetDirs(this.options.assetDir));
        // @ts-expect-error
        this.executionContext = makeExecutionContext(config) as U;
    }

    setClients(clients: TestClientConfig[]): void {
        this.context.apis.setTestClients(clients);
    }

    protected async makeContextConfig(
        job: JobConfig,
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
        const assets: string[] = [];

        if (Array.isArray(assetDir)) {
            return resolveAssetDir(assets.concat(assetDir));
        }

        return resolveAssetDir([...assets, assetDir]);
    }

    /**
     * Cleanup test code
    */
    async shutdown(): Promise<void> {
        this.events.removeAllListeners();
    }
}
