import { Terafoundation } from '@terascope/types';
import SchemaCore, { OpType } from './core/schema-core.js';
import {
    Context, OpConfig, APIConfig,
    ValidatedJobConfig
} from '../interfaces/index.js';
import { validateOpConfig, validateAPIConfig } from '../config-validators.js';

/**
 * A base class for supporting convict style "Schema" definitions
 */
export default abstract class ConvictSchema<T extends Record<string, any>, S = any>
    extends SchemaCore<T> {
    // ...
    schema: Terafoundation.Schema<S>;

    constructor(context: Context, opType: OpType = 'operation') {
        super(context, opType);
        this.schema = this.build(context);
    }

    validate(inputConfig: Record<string, any>): APIConfig & T;
    validate(inputConfig: Record<string, any>): OpConfig & T;
    validate(inputConfig: Record<string, any>): OpConfig | APIConfig & T {
        if (this.opType === 'api') {
            return validateAPIConfig<T>(this.schema, inputConfig);
        }
        return validateOpConfig<T>(this.schema, inputConfig);
    }

    validateJob(_job: ValidatedJobConfig): void {

    }

    static type(): string {
        return 'convict';
    }

    abstract build<U = any>(context?: Context): Terafoundation.Schema<S & U>;
}
