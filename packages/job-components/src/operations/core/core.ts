import _ from 'lodash';
import { EventEmitter } from 'events';
import { Context, ExecutionConfig, Logger, OpConfig } from '@terascope/teraslice-types';
import { OpAPI } from './api-core';

/**
 * The core class for creating for all varients or base classes for an operation.
 */

export class Core {
    protected readonly context: Readonly<Context>;
    protected readonly executionConfig: Readonly<ExecutionConfig>;
    protected readonly opConfig: Readonly<OpConfig>;
    protected readonly logger: Logger;
    protected readonly events: EventEmitter;

    constructor(context: Context, opConfig: OpConfig, executionConfig: ExecutionConfig) {
        this.context = context;
        this.executionConfig = executionConfig;
        this.opConfig = opConfig;
        this.logger = this.context.apis.foundation.makeLogger({
            module: 'operation',
            opName: opConfig._op,
            jobName: executionConfig.name,
        });
        this.events = context.apis.foundation.getSystemEvents();
    }

    /**
     * A method called by an Operation to create an new instance of an API
     * time to run asynchronous setup.
    */
    async createAPI(name: string, ...params: any[]): Promise<OpAPI> {
        return this.context.apis.executionContext.create(name, ...params);
    }

    /**
     * A method called by the Teraslice framework to give an operation
     * time to run asynchronous setup.
    */
    async initialize(initConfig?: any): Promise<void> {
        this.context.logger.debug(`${this.executionConfig.name}->${this.opConfig._op} is initializing...`, initConfig);
        return;
    }

    /**
     * A method called by the Teraslice framework to give an operation
     * time to run asynchronous cleanup.
    */
    async shutdown(): Promise<void> {
        this.context.logger.debug(`${this.executionConfig.name}->${this.opConfig._op} is shutting down...`);
        return;
    }
}
