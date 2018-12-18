import Core from './core';
import {
    ExecutionConfig,
    WorkerOperationLifeCycle,
    WorkerContext,
    APIConfig
} from '../../interfaces';

/**
 * A base class for supporting APIs that run within an Execution Context.
 */
export default abstract class APICore<T = APIConfig> extends Core<WorkerContext> implements WorkerOperationLifeCycle {
    readonly apiConfig: Readonly<APIConfig & T>;

    constructor(context: WorkerContext, apiConfig: APIConfig & T, executionConfig: ExecutionConfig) {
        const logger = context.apis.foundation.makeLogger({
            module: 'operation-api',
            apiName: apiConfig._name,
            jobName: executionConfig.name,
            jobId: executionConfig.job_id,
            exId: executionConfig.ex_id,
        });

        super(context, executionConfig, logger);
        this.apiConfig = apiConfig;
    }

    async initialize(): Promise<void> {
        this.context.logger.trace(`${this.apiConfig._name}->api is initializing...`);
    }

    async shutdown(): Promise<void> {
        this.context.logger.trace(`${this.apiConfig._name}->api is shutting down...`);
    }
}
