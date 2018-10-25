import { ValidatedJobConfig, OpConfig } from './interfaces';
import convict from 'convict';
import { opSchema } from './job-schemas';

// @ts-ignore
const validateOptions: convict.ValidateOptions = { allowed: true };

/**
 * Merges the provided inputSchema with commonSchema and then validates the
 * provided opConfig against the resulting schema.
 */
export function validateOpConfig<T>(inputSchema: convict.Schema<any>, inputConfig: any) {
    const schema = Object.assign({}, opSchema, inputSchema) as convict.Schema<OpConfig & T>;
    const config = convict(schema);

    try {
        config.load(inputConfig);
        config.validate(validateOptions);
    } catch (err) {
        throw new Error(`Validation failed for opConfig: ${inputConfig._op} - ${err.message}`);
    }

    return config.getProperties();
}

/**
 * Merges the provided inputSchema with commonSchema and then validates the
 * provided jobConfig against the resulting schema.
 */
export function validateJobConfig<T>(inputSchema: convict.Schema<any>, inputConfig: any) {
    const config = convict(inputSchema as convict.Schema<ValidatedJobConfig & T>);

    try {
        config.load(inputConfig);
        config.validate(validateOptions);
    } catch (err) {
        throw new Error(`Validation failed for jobConfig: ${inputConfig.name} - ${err.stack}`);
    }

    return config.getProperties();
}
