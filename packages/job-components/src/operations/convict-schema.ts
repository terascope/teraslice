import convict from 'convict';
import SchemaCore, { OpType } from './core/schema-core';
import { Context, OpConfig, APIConfig } from '../interfaces';
import { validateOpConfig, validateAPIConfig } from '../config-validators';

/**
 * A base class for supporting convict "Schema" definitions
 */
export default abstract class ConvictSchema<T extends Object, S = any> extends SchemaCore<T> {
    schema: convict.Schema<S>;

    constructor(context: Context, opType: OpType = 'operation') {
        super(context, opType);
        this.schema = this.build(context);
    }

    validate(inputConfig: any): APIConfig & T;
    validate(inputConfig: any): OpConfig & T;
    validate(inputConfig: any): OpConfig|APIConfig & T {
        if (this.opType === 'api') {
            return validateAPIConfig(this.schema, inputConfig);
        }

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
