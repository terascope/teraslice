import Core from './core.js';
import {
    ExecutionConfig, WorkerOperationLifeCycle, OpAPI,
    OpConfig, Context, DeadLetterAction,
    DeadLetterAPIFn,
} from '../../interfaces/index.js';
import { makeExContextLogger } from '../../utils.js';

/**
 * A base class for supporting operations that run on a "Worker",
 * that supports the job execution lifecycle events.
 * This class will likely not be used externally
 * since Teraslice only supports a few types varients based on this class.
 *
 * See [[Core]] more information
 */

export default class OperationCore<T = OpConfig>
    extends Core<Context>
    implements WorkerOperationLifeCycle {
    // ...
    readonly opConfig: Readonly<OpConfig & T>;
    deadLetterAction: DeadLetterAction;

    constructor(context: Context, opConfig: OpConfig & T, executionConfig: ExecutionConfig) {
        const logger = makeExContextLogger(context, executionConfig, 'operation', {
            opName: opConfig._op,
        });
        super(context, executionConfig, logger);

        this.deadLetterAction = opConfig._dead_letter_action || 'throw';
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
    async createAPI<A extends OpAPI = OpAPI>(name: string, ...params: any[]): Promise<A> {
        return this.context.apis.executionContext.initAPI<A>(name, ...params);
    }

    /**
     * Get a reference to an existing API
     */
    getAPI<A extends OpAPI = OpAPI>(name: string): A {
        return this.context.apis.executionContext.getAPI<A>(name);
    }

    /**
     * Try catch a transformation on a record and place any failed records in a dead letter queue
     *
     * See {@link #rejectRecord} for handling
     *
     * @param fn a function to transform the data with
     * @returns a curried a function that will be called
     * with the data and handle the dead letter action
     */
    tryRecord<I, R>(fn: (input: I) => R): (input: I) => R | null {
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
     *   - "none": skip the error entirely
     *   OR a string to specify the api to use as the dead letter queue
     *
     * @param data the data to transform
     * @param fn a function to transform the data with
     * @returns null
     */
    rejectRecord(input: unknown, err: Error): never | null {
        if (this.deadLetterAction === 'throw' || !this.deadLetterAction) {
            throw err;
        }

        if (this.deadLetterAction === 'none') return null;

        if (this.deadLetterAction === 'log') {
            this.logger.error(err, 'Bad record', input);
            return null;
        }

        const api = this.getAPI(this.deadLetterAction) as DeadLetterAPIFn;
        api(input, err);
        return null;
    }
}
