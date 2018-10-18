import { locked } from './utils';
import cloneDeep from 'lodash.clonedeep';
import { OperationLoader } from './operation-loader';
import * as i from './interfaces';
import { registerApis, JobRunnerAPI, OpRunnerAPI } from './register-apis';
import { ExecutionContextAPI } from './execution-context-apis';
import { OperationAPIConstructor } from './operations/operation-api';

const _loaders = new WeakMap<WorkerExecutionContext, OperationLoader>();
const _lifecycle = new WeakMap<WorkerExecutionContext, InitializedOperations>();

export class WorkerExecutionContext {
    readonly config: i.ExecutionConfig;
    readonly context: WorkerContext;
    readonly assetIds: string[] = [];
    private loaded: boolean = false;

    constructor(config: ExecutionContextConfig) {
        const executionConfig = cloneDeep(config.executionConfig);
        registerApis(config.context, executionConfig);

        _loaders.set(this, new OperationLoader({
            terasliceOpPath: config.terasliceOpPath,
            assetPath: config.context.sysconfig.teraslice.assets_directory,
        }));

        _lifecycle.set(this, new Set());

        this.context = config.context as WorkerContext;
        if (config.assetIds) {
            this.assetIds = config.assetIds;
        }
        this.config = executionConfig;
    }

    @locked()
    load() {
        const loader = _loaders.get(this);

        if (this.loaded || !loader) {
            throw new Error('Operations can only be loaded once');
        }
        this.loaded = true;

        let index = 0;
        for (const opConfig of this.config.operations) {
            const name = opConfig._op;
            if (!index++) {
                const mod = loader.loadReader(name, this.assetIds);
                this.registerAPI(name, mod.API);

                const op = new mod.Fetcher(this.context, opConfig, this.config);
                this.addToLifecycle(op);
            } else {
                const mod = loader.loadProcessor(name, this.assetIds);
                this.registerAPI(name, mod.API);

                const op = new mod.Processor(this.context, opConfig, this.config);
                this.addToLifecycle(op);
            }
        }
    }

    @locked()
    private addToLifecycle(op: i.WorkerOperationLifeCycle) {
        const operations = _lifecycle.get(this);
        if (!operations) throw new Error('Uh oh');

        operations.add(op);
    }

    @locked()
    private registerAPI(name: string, API?: OperationAPIConstructor) {
        if (API == null) return;

        this.context.apis.executionContext.addToRegistry(name, API);
    }
}

interface ExecutionContextConfig {
    context: i.Context;
    executionConfig: i.ExecutionConfig;
    terasliceOpPath: string;
    assetIds?: string[];
}

interface InitializedOperations extends Set<i.WorkerOperationLifeCycle> {}

interface WorkerContextApis extends i.ContextApis {
    op_runner: OpRunnerAPI;
    executionContext: ExecutionContextAPI;
    job_runner: JobRunnerAPI;
}

export interface WorkerContext extends i.Context {
    apis: WorkerContextApis;
}
