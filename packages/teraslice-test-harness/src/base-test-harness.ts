import { set, get } from 'lodash';
import {
    ExecutionConfig,
    JobValidator,
    TestContext,
    ConnectionConfig,
    JobConfig,
    ExecutionContextConfig,
    Assignment,
} from '@terascope/job-components';
import {
    ExecutionContext,
    Context,
    Client,
    ClientFactoryFns,
    CachedClients,
    TestMode,
} from './interfaces';
import { resolveAssetDir } from './utils';

/**
 * A base class for the Slicer and Worker TestHarnesses
*/
export default abstract class BaseTestHarness {
    protected abstract executionContext: ExecutionContext;
    protected abstract context: Context;

    private testMode: TestMode;
    private clients: ClientFactoryFns = {};
    private cachedClients: CachedClients = {};

    constructor(testMode: TestMode) {
        this.testMode = testMode;
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

        this.context.apis.foundation.getConnection = this._getConnection.bind(this);
        this.context.foundation.getConnection = this._getConnection.bind(this);
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
        const context = new TestContext(`${this.testMode}-test:${job.name}`);

        const resolvedAssetDir = resolveAssetDir(assetDir);
        context.sysconfig.teraslice.assets_directory = resolvedAssetDir;

        const isSlicer = this.testMode === TestMode.Slicer;
        context.assignment = isSlicer ? Assignment.ExecutionController : Assignment.Worker;

        job.assets = job.assets ? [...job.assets, '.'] : ['.'];

        const jobValidator = new JobValidator(context);
        const executionConfig = jobValidator.validateConfig(job) as ExecutionConfig;
        return {
            context,
            executionConfig,
            assetIds: ['.']
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
