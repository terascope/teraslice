import fs from 'fs-extra';
import path from 'path';
import {
    ExecutionConfig,
    JobValidator,
    TestContext,
    JobConfig,
    ExecutionContextConfig,
    Assignment,
    makeExecutionContext,
    TestClientConfig,
} from '@terascope/job-components';
import { EventEmitter } from 'events';
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
    readonly executionContext: U;
    readonly context: TestContext;

    constructor(job: JobConfig, options: JobHarnessOptions, assignment: Assignment) {
        const testName = [assignment, job.name].filter((s) => s).join(':');
        this.context = new TestContext(testName, {
            assignment,
            clients: options.clients,
        });

        this.events = this.context.apis.foundation.getSystemEvents();
        const config = this.makeContextConfig(job, this._getAssetDirs(options.assetDir));
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
        assets: string[] = [process.cwd()]
    ): ExecutionContextConfig {
        const assetIds = job.assets ? [...job.assets, '.'] : ['.'];
        this.context.sysconfig.teraslice.assets_directory = assets;
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
        const assets = this._getExternalAssets();

        if (Array.isArray(assetDir)) {
            return resolveAssetDir(assets.concat(assetDir));
        }

        return resolveAssetDir([...assets, assetDir]);
    }

    private _getExternalAssets(): string[] {
        const externalAssetsPath = path.resolve('./test/.cache', 'assets');

        if (fs.pathExistsSync(externalAssetsPath)) {
            return fs.readdirSync(externalAssetsPath)
                .filter((item) => fs.lstatSync(path.join(externalAssetsPath, item)).isDirectory())
                .map((dir) => path.join(externalAssetsPath, dir));
        }

        return [];
    }

    /**
     * Cleanup test code
    */
    async shutdown(): Promise<void> {
        this.events.removeAllListeners();
    }
}
