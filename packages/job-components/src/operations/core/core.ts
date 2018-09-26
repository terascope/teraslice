import _ from 'lodash';
import { EventEmitter } from 'events';
import { Context, ExecutionConfig, Logger } from '@terascope/teraslice-types';

/**
 * The core class for creating for all varients or base classes for an operation.
 */

export default abstract class Core {
    protected readonly context: Readonly<Context>;
    protected readonly executionConfig: Readonly<ExecutionConfig>;
    protected readonly logger: Logger;
    protected readonly events: EventEmitter;

    constructor(context: Context, executionConfig: ExecutionConfig, logger: Logger) {
        this.context = context;
        this.executionConfig = executionConfig;
        this.logger = logger;
        this.events = context.apis.foundation.getSystemEvents();
    }

    /**
     * A method called by the Teraslice framework to give an operation
     * time to run asynchronous setup.
    */
    abstract async initialize(initConfig?: any): Promise<void>;

    /**
     * A method called by the Teraslice framework to give an operation
     * time to run asynchronous cleanup.
    */
    abstract async shutdown(): Promise<void>;
}
