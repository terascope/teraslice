import Core from './core';
import { ExecutionConfig, WorkerOperationLifeCycle, WorkerContext } from '../../interfaces';

/**
 * A base class for supporting APIs that run within an Execution Context.
 */
export default abstract class APICore extends Core<WorkerContext> implements WorkerOperationLifeCycle {
    constructor(context: WorkerContext, executionConfig: ExecutionConfig) {
        const logger = context.apis.foundation.makeLogger({
            module: 'operation-api',
            jobName: executionConfig.name,
            jobId: executionConfig.job_id,
            exId: executionConfig.ex_id,
        });
        super(context, executionConfig, logger);
    }

    async initialize(): Promise<void> {
        this.context.logger.trace(`${this.executionConfig.name}->api is initializing...`);
    }

    async shutdown(): Promise<void> {
        this.context.logger.trace(`${this.executionConfig.name}->api is shutting down...`);
    }
}
