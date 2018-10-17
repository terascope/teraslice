import { locked } from './utils';
import cloneDeep from 'lodash.clonedeep';
import { OperationLoader } from './operation-loader';
import { Context, ExecutionConfig, WorkerOperationLifeCycle } from './interfaces';
import { APIConstructor } from './operations/core/api-core';
import { registerApis } from './register-apis';

const _config = new WeakMap<WorkerExecutionContext, PrivateConfig>();
const _loaders = new WeakMap<WorkerExecutionContext, OperationLoader>();
const _lifecycle = new WeakMap<WorkerExecutionContext, InitializedOperations>();

export class WorkerExecutionContext {
    readonly config: ExecutionConfig;
    readonly assetIds: string[];

    constructor(config: ExecutionContextConfig) {
        _config.set(this, {
            context: config.context,
            initialized: false,
        });

        _loaders.set(this, new OperationLoader({
            terasliceOpPath: config.terasliceOpPath,
            assetPath: config.context.sysconfig.teraslice.assets_directory,
        }));

        _lifecycle.set(this, new Set());

        this.assetIds = config.assetIds;
        this.config = cloneDeep(config.executionConfig);
    }

    @locked()
    async initialize() {
        const config = _config.get(this);
        if (!config || config.initialized) {
            throw new Error('Execution Context can only be initialized once');
        }

        const loader = _loaders.get(this);
        if (!loader) throw new Error('Uh oh');

        registerApis(config.context, this.config);

        let index = 0;
        for (const opConfig of this.config.operations) {
            if (!index++) {
                const mod = loader.loadReader(opConfig._op);
                this.registerAPI(name, mod.API);

                const op = new mod.Fetcher(config.context, opConfig, this.config);
                this.addToLifecycle(op);
            } else {
                const mod = loader.loadProcessor(opConfig._op);
                this.registerAPI(name, mod.API);

                const op = new mod.Processor(config.context, opConfig, this.config);
                this.addToLifecycle(op);
            }
        }
    }

    @locked()
    private addToLifecycle(op: WorkerOperationLifeCycle) {
        const operations = _lifecycle.get(this);
        if (!operations) throw new Error('Uh oh');

        operations.add(op);
    }

    @locked()
    private registerAPI(name: string, API?: APIConstructor) {
        const config = _config.get(this);
        if (!config) throw new Error('Uh oh');
        if (API == null) return;

        config.context.apis.executionContext.addToRegistry(name, API);
    }
}

interface ExecutionContextConfig {
    context: Context;
    executionConfig: ExecutionConfig;
    terasliceOpPath: string;
    assetIds: string[];
}

interface PrivateConfig {
    context: Context;
    initialized: boolean;
}

interface InitializedOperations extends Set<WorkerOperationLifeCycle> {}
