import { set, get } from 'lodash';
import {
    ExecutionConfig,
    JobValidator,
    TestContext,
    ConnectionConfig,
    JobConfig,
    ExecutionContextConfig,
    Assignment,
    makeExecutionContext,
    WorkerExecutionContext,
    SlicerExecutionContext,
} from '@terascope/job-components';
import {
    Context,
    Client,
    ClientFactoryFns,
    CachedClients,
    TestMode,
    JobHarnessOptions,
} from './interfaces';
import { resolveAssetDir } from './utils';

/**
 * A base class for the Slicer and Worker TestHarnesses
*/
export default abstract class BaseTestHarness<T extends Context, U extends SlicerExecutionContext|WorkerExecutionContext> {
    protected executionContext: U;
    protected context: T;

    private testMode: TestMode;
    private clients: ClientFactoryFns = {};
    private cachedClients: CachedClients = {};

    constructor(job: JobConfig, options: JobHarnessOptions, testMode: TestMode) {
        this.testMode = testMode;

        this.context = new TestContext(`${this.testMode}-test:${job.name}`) as T;
        const isSlicer = this.testMode === TestMode.Slicer;
        this.context.assignment = isSlicer ? Assignment.ExecutionController : Assignment.Worker;

        this.context.apis.foundation.getConnection = this._getConnection.bind(this);
        this.context.foundation.getConnection = this._getConnection.bind(this);
        this.setClients(options.clients);

        const config = this.makeContextConfig(job, options.assetDir);
        this.executionContext = makeExecutionContext(config) as U;
    }

    /**
     * Set Terafoundation Connector clients
     * so they can be accessed from with in the pipeline
    */
    async setClients(clients: Client[] = []) {
        clients.forEach((clientConfig) => {
            const { create, type, endpoint = 'default', config = {} } = clientConfig;

            if (!type || (typeof type !== 'string')) throw new Error('you must specify a type when setting a client');

            this.clients[`${type}:${endpoint}`] = create;
            set(this.context, ['sysconfig', 'terafoundation', 'connectors', type, endpoint], config);
        });
    }

    /**
     * Initialize any test code
    */
    async initialize() {
        this.cachedClients = {};
    }

    /**
     * Cleanup test code
    */
    async shutdown() {
        this.clients = {};
        this.cachedClients = {};
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

    private _getConnection(options: ConnectionConfig): { client: any } {
        const { type, endpoint, cached } = options;

        const key = `${type}:${endpoint}`;
        if (cached && this.cachedClients[key] != null) {
            return {
                client: this.cachedClients[key]
            };
        }

        const create = this.clients[key];
        if (!create) throw new Error(`No client was found at type ${type}, endpoint: ${endpoint}`);
        if (typeof create !== 'function') throw new Error(`Client for type ${type}:${endpoint} is not a function`);

        const config = get(this.context, ['sysconfig', 'terafoundation', 'connectors', type, endpoint], {});

        const client = create(config, this.context.logger, options);
        this.cachedClients[key] = client;
        return { client };
    }
}
