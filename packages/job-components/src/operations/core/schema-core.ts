import { Context, OpConfig, ValidatedJobConfig } from '../../interfaces/index.js';

/**
 * A base class for supporting "Schema" definition
 */

export default abstract class SchemaCore<T> {
    protected context: Context;
    readonly opType: OpType;

    constructor(context: Context, opType: OpType) {
        this.context = context;
        this.opType = opType;
    }

    abstract build(context?: Context): any;
    abstract validate(inputConfig: Record<string, any>): OpConfig & T;
    abstract validateJob?(job: ValidatedJobConfig): void;
}

export type OpType = 'operation' | 'api';
