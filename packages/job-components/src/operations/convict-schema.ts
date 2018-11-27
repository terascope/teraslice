import convict from 'convict';
import { Context, OpConfig } from '../interfaces';
import SchemaCore from './core/schema-core';
import { validateOpConfig } from '../config-validators';

/**
 * A base class for supporting convict "Schema" definitions
 */

export default abstract class ConvictSchema<T extends Object, S = any> extends SchemaCore<T> {
    schema: convict.Schema<S>;

    constructor(context: Context) {
        super(context);
        this.schema = this.build(context);
    }

    validate(inputConfig: any): OpConfig & T {
        return validateOpConfig(this.schema, inputConfig);
    }

    // @ts-ignore
    validateJob(job) {

    }

    static type() {
        return 'convict';
    }

    abstract build<U = any>(context?: Context): convict.Schema<S & U>;
}
