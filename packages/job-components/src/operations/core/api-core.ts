import Core from './core.js';
import {
    ExecutionConfig,
    WorkerOperationLifeCycle,
    SlicerOperationLifeCycle,
    WorkerContext,
    APIConfig,
    DeadLetterAction,
    DeadLetterAPIFn
} from '../../interfaces/index.js';
import { makeExContextLogger } from '../../utils.js';

/**
 * A base class for supporting APIs that run within an Execution Context.
 */
export default abstract class APICore<T = APIConfig>
    extends Core<WorkerContext>
    implements WorkerOperationLifeCycle, SlicerOperationLifeCycle {
    // ...
    readonly apiConfig: Readonly<APIConfig & T>;
    deadLetterAction: DeadLetterAction;

    constructor(
        context: WorkerContext,
        apiConfig: APIConfig & T,
        executionConfig: ExecutionConfig
    ) {
        const logger = makeExContextLogger(context, executionConfig, 'operation-api', {
            apiName: apiConfig._name,
        });

        super(context, executionConfig, logger);
        this.apiConfig = apiConfig;
        this.deadLetterAction = apiConfig._dead_letter_action || 'throw';
    }

    async initialize(): Promise<void> {
        this.context.logger.trace(`${this.apiConfig._name}->api is initializing...`);
    }

    async shutdown(): Promise<void> {
        this.context.logger.trace(`${this.apiConfig._name}->api is shutting down...`);
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

        const api = this.context.apis
            .executionContext.getAPI(this.deadLetterAction) as DeadLetterAPIFn;
        api(input, err);
        return null;
    }
}
