import '../../formats'; // require to add the schema formats
import Core from './core';
import {
    ExecutionConfig,
    WorkerOperationLifeCycle,
    OpAPI,
    OpConfig,
    WorkerContext,
    DeadLetterAction,
    DeadLetterAPIFn,
} from '../../interfaces';

/**
 * A base class for supporting operations that run on a "Worker",
 * that supports the job execution lifecycle events.
 * This class will likely not be used externally
 * since Teraslice only supports a few types varients based on this class.
 * @see Core
 */

export default class OperationCore<T = OpConfig> extends Core<WorkerContext> implements WorkerOperationLifeCycle {
    readonly opConfig: Readonly<OpConfig & T>;
    deadLetterAction: DeadLetterAction;

    constructor(context: WorkerContext, opConfig: OpConfig & T, executionConfig: ExecutionConfig) {
        const logger = context.apis.foundation.makeLogger({
            module: 'operation',
            opName: opConfig._op,
            jobName: executionConfig.name,
            jobId: executionConfig.job_id,
            exId: executionConfig.ex_id,
        });

        super(context, executionConfig, logger);

        this.deadLetterAction = opConfig._dead_letter_action || 'none';
        this.opConfig = opConfig;
    }

    async initialize(): Promise<void> {
        this.context.logger.trace(`${this.executionConfig.name}->${this.opConfig._op} is initializing...`);
    }

    async shutdown(): Promise<void> {
        this.context.logger.trace(`${this.executionConfig.name}->${this.opConfig._op} is shutting down...`);
    }

    /**
     * Create an API and add it to the operation lifecycle
     */
    async createAPI(name: string, ...params: any[]): Promise<OpAPI> {
        return this.context.apis.executionContext.initAPI(name, ...params);
    }

    /**
     * Get a reference to an existing API
     */
    getAPI(name: string): OpAPI {
        return this.context.apis.executionContext.getAPI(name);
    }

    /**
     * Try catch a transformation on a record and place any failed records in a dead letter queue
     *
     * See {@link #rejectRecord} for handling
     *
     * @param fn a function to transform the data with
     * @returns a curried a function that will be called with the data and handle the dead letter action
     */
    tryRecord<I, R>(fn: (input: I) => R): (input: I) => R | null {
        return input => {
            try {
                return fn(input);
            } catch (err) {
                this.rejectRecord(input, err);
                return null;
            }
        };
    }

    /**
     * Reject a record using the dead letter action
     *
     * Based on {@link OpConfig._dead_letter_action} the transformation can
     * be handled any of the following ways:
     *   - "throw": throw the original error
     *   - "log": log the error and the data
     *   - "none": skip the error entirely
     *   OR a string to specify the api to use as the dead letter queue
     *
     * @param data the data to transform
     * @param fn a function to transform the data with
     * @returns the transformed record
     */
    rejectRecord(input: any, err: Error): never | null {
        if (!this.deadLetterAction) return null;
        if (this.deadLetterAction === 'none') return null;

        if (this.deadLetterAction === 'throw') {
            throw err;
        }
        if (this.deadLetterAction === 'log') {
            this.logger.error(err, 'Bad record', input);
            return null;
        }

        const api = this.getAPI(this.deadLetterAction) as DeadLetterAPIFn;
        api(input, err);
        return null;
    }
}
