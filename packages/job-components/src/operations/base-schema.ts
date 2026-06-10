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
export default abstract class BaseSchema<T extends Record<string, any>, S = any>
    extends SchemaCore<T> {
    // ...
    schema: Terafoundation.Schema<S>;

    constructor(context: Context, opType: OpType = 'operation') {
        super(context, opType);
        this.schema = this.build(context);
    }

    validate(inputConfig: Record<string, any>): { config: APIConfig & T, warnings: Terafoundation.JobWarning[] };
    validate(inputConfig: Record<string, any>): { config: OpConfig & T, warnings: Terafoundation.JobWarning[] };
    validate(inputConfig: Record<string, any>): { config: OpConfig | APIConfig & T, warnings: Terafoundation.JobWarning[] } {
        if (this.opType === 'api') {
            return validateAPIConfig<T>(this.schema, inputConfig, this.context);
        }
        return validateOpConfig<T>(this.schema, inputConfig, this.context);
    }

    validateJob(_job: ValidatedJobConfig): void {

    }

    static type(): string {
        return 'convict';
    }

    abstract build<U = any>(context?: Context): Terafoundation.Schema<S & U>;
}
