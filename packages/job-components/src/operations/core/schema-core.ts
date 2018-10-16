import { Context, OpConfig } from '@terascope/teraslice-types';

/**
 * A base class for supporting "Schema" definition
 */

export default abstract class SchemaCore {
    protected context: Context;

    constructor(context: Context) {
        this.context = context;
    }

    abstract build(context?: Context): any;
    abstract validate(inputConfig: any): OpConfig;
}

export type SchemaConstructor = {
    type(): string;
    new(context: Context): SchemaCore;
};
