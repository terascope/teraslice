import { EventEmitter } from 'node:events';
import { Logger } from '@terascope/core-utils';
import { Context, ExecutionConfig, OperationLifeCycle } from '../../interfaces/index.js';

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

    abstract initialize(initConfig?: unknown): Promise<void>;

    abstract shutdown(): Promise<void>;
}
