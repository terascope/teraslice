import { EventEmitter } from 'events';
import { Context, ExecutionConfig, Logger, OperationLifeCycle } from '../../interfaces';

/**
 * The core class for creating for all varients or base classes for an operation.
 */

export default abstract class Core<T extends Context> implements OperationLifeCycle {
    readonly context: Readonly<T>;
    readonly executionConfig: Readonly<ExecutionConfig>;
    readonly logger: Logger;
    readonly events: EventEmitter;

    constructor(context: T, executionConfig: ExecutionConfig, logger: Logger) {
        this.context = context;
        this.executionConfig = executionConfig;
        this.logger = logger;
        this.events = context.apis.foundation.getSystemEvents();
    }

    abstract async initialize(initConfig?: any): Promise<void>;

    abstract async shutdown(): Promise<void>;
}
