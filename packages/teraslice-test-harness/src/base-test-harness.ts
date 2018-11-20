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
} from './interfaces';
import { resolveAssetDir } from './utils';

/**
 * A base class for the Slicer and Worker TestHarnesses
 *
 * @todo Add support for validating the asset.json?
*/
export default class BaseTestHarness<U extends ExecutionContext> {
    events: EventEmitter;
    protected executionContext: U;
    protected context: TestContext;

    constructor(job: JobConfig, options: JobHarnessOptions, assignment: Assignment) {
        const testName = [assignment, job.name].filter((s) => s).join(':');
        this.context = new TestContext(testName, {
            assignment,
            clients: options.clients,
        });

        this.events = this.context.apis.foundation.getSystemEvents();

        const config = this.makeContextConfig(job, options.assetDir);
        this.executionContext = makeExecutionContext(config) as U;
    }

    /**
     * Initialize any test cod
    */
    async initialize() {
    }

    setClients(clients: TestClientConfig[]) {
        this.context.apis.setTestClients(clients);
    }

    /**
     * Cleanup test code
    */
    async shutdown() {
        this.events.removeAllListeners();
    }

    protected makeContextConfig(job: JobConfig, assetDir: string = process.cwd()): ExecutionContextConfig {
        const assetIds = job.assets ? [...job.assets, '.'] : ['.'];
        const resolvedAssetDir = resolveAssetDir(assetDir);
        this.context.sysconfig.teraslice.assets_directory = resolvedAssetDir;
        job.assets = assetIds;

        const jobValidator = new JobValidator(this.context);
        const executionConfig = jobValidator.validateConfig(job) as ExecutionConfig;
        return {
            context: this.context,
            executionConfig,
            assetIds
        };
    }
}
