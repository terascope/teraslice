import '../../formats'; // require to add the schema formats
import Core from './core';
import {
    ExecutionConfig,
    WorkerOperationLifeCycle,
    OpAPI,
    OpConfig,
    WorkerContext,
    DeadLetterAction,
} from '../../interfaces';

/**
 * A base class for supporting operations that run on a "Worker",
 * that supports the job execution lifecycle events.
 * This class will likely not be used externally
 * since Teraslice only supports a few types varients based on this class.
 * @see Core
 */

export default class OperationCore<T = OpConfig> extends Core<WorkerContext> implements WorkerOperationLifeCycle {
    protected readonly opConfig: Readonly<OpConfig & T>;
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
     * Try catch a transformation on a record and place any failed records in a dead letter queue
     *
     * See {@link #rejectRecord} for handling
     *
     * @param fn a function to transform the data with
     * @returns a curried a function that will be called with the data and handle the dead letter action
    */
    tryRecord<I, R>(fn: (input: I) => R): (input: I) => R|null {
        return (input) => {
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
     *   - "custom": send the error to a specified dead letter queue
     *   - "none": skip the error entirely
     *
     * @param data the data to transform
     * @param fn a function to transform the data with
     * @returns the transformed record
    */
    rejectRecord(input: any, err: Error): never|null {
        switch (this.deadLetterAction) {
            case 'throw': {
                throw err;
            }
            case 'log': {
                this.logger.error('Bad record', input, err);
                return null;
            }
            case 'custom': {
                // TODO add support custom dead letter queues
                throw new Error('Custom dead letter queues are not suppported yet');
            }
            default: {
                return null;
            }
        }
    }

    /**
     * Get a reference to an existing API
    */
    getAPI(name: string): OpAPI {
        return this.context.apis.executionContext.getAPI(name);
    }
}
