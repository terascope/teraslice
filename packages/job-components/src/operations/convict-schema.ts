import convict from 'convict';
import { Context, OpConfig } from '../interfaces';
import SchemaCore from './core/schema-core';
import { validateOpConfig } from '../config-validators';

/**
 * A base class for supporting convict "Schema" definitions
 */

export default abstract class ConvictSchema extends SchemaCore {
    schema: convict.Schema<any>;

    constructor(context: Context) {
        super(context);
        this.schema = this.build(context);
    }

    validate(inputConfig: any): OpConfig {
        return validateOpConfig(this.schema, inputConfig);
    }

    static type() {
        return 'convict';
    }

    abstract build(context?: Context): convict.Schema<any>;
}
