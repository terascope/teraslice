import { Context, OpConfig } from '../../interfaces';

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
