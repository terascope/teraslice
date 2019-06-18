import convict from 'convict';
import { ValidatedJobConfig, OpConfig, APIConfig } from './interfaces';
import { opSchema, apiSchema } from './job-schemas';

const validateOptions: convict.ValidateOptions = {
    // IMPORTANT: changing this will break things
    // @ts-ignore because this is deprecated and will be removed in ^5.0.0
    allowed: true,
};

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
        throw new Error(`Validation failed for operation config: ${inputConfig._op} - ${err.message}`);
    }

    return config.getProperties();
}

/**
 * Merges the provided inputSchema with commonSchema and then validates the
 * provided apiConfig against the resulting schema.
 */
export function validateAPIConfig<T>(inputSchema: convict.Schema<any>, inputConfig: any) {
    const schema = Object.assign({}, apiSchema, inputSchema) as convict.Schema<APIConfig & T>;
    const config = convict(schema);

    try {
        config.load(inputConfig);
        config.validate(validateOptions);
    } catch (err) {
        throw new Error(`Validation failed for api config: ${inputConfig._name} - ${err.message}`);
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
        throw new Error(`Validation failed for job config: ${inputConfig.name} - ${err.message}`);
    }

    return config.getProperties();
}
