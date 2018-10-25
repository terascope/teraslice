import { Context, OpConfig, ValidatedJobConfig } from '../../interfaces';

/**
 * A base class for supporting "Schema" definition
 */

export default abstract class SchemaCore<T> {
    protected context: Context;

    constructor(context: Context) {
        this.context = context;
    }

    abstract build(context?: Context): any;
    abstract validate(inputConfig: any): OpConfig & T;
    abstract validateJob?(job: ValidatedJobConfig): void;
}
