import {
    has, get, toString,
    isDeepEqual, Schema
} from '@terascope/core-utils';
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
    schema: Schema<S>;

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

    /**
    * This method will make sure that the api exists on the job, if it does not then
    * it will inject it using apiName provided and with the config key/values provided.
    * If the api does exist it will compare the apiConfig against the provided config.
    * If the key/values do not match, then it will throw
    *
    * @example
        const job = newTestJobConfig({
            operations: [
                { _op: 'test-reader' },
                { _op: 'noop' },
            ]
        });

        schema.ensureAPIFromConfig('someApi', job, { some: 'configs' });

        job === {
            apis: [{ _name: 'someApi', some: 'configs' }],
            operations: [
                { _op: 'test-reader' },
                { _op: 'noop' },
            ]
        }

    */
    ensureAPIFromConfig(
        apiName: string, job: ValidatedJobConfig, config: Record<string, any>
    ): void {
        if (!job.apis) job.apis = [];
        const apiConfig = job.apis.find((jobApi) => jobApi._name === apiName);

        if (!apiConfig) {
            job.apis.push({
                _name: apiName,
                ...config
            });
        } else {
            const mixedValues: Record<string, string[]> = {};

            for (const [key, value] of Object.entries(apiConfig)) {
                const configVal = get(config, key);
                if (has(config, key) && !isDeepEqual(configVal, value)) {
                    mixedValues[key] = [toString(configVal), toString(value)];
                }
            }

            let errMsg = '';

            for (const [key, values] of Object.entries(mixedValues)) {
                errMsg += `parameter "${key}" in the apiConfig is set to "${values[1]}" and will take precedence over provided value "${values[0]}"\n`;
            }

            if (errMsg.length > 0) {
                throw new Error(`Configuration clashes have been found between apiConfigs and opConfigs: \n${errMsg}`);
            }
        }
    }

    static type(): string {
        return 'convict';
    }

    abstract build<U = any>(context?: Context): Schema<S & U>;
}
