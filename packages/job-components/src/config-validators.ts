import convict from 'convict';
import { ValidatedJobConfig, OpConfig, APIConfig } from './interfaces/index.js';
import { opSchema, apiSchema } from './job-schemas.js';
import { Teraslice } from 'packages/types/dist/src/index.js';

const validateOptions: convict.ValidateOptions = {
    allowed: 'warn',
};

/**
 * Merges the provided inputSchema with commonSchema and then validates the
 * provided opConfig against the resulting schema.
 */
export function validateOpConfig<T>(
    inputSchema: convict.Schema<any>, inputConfig: Record<string, any>
): OpConfig & T {
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
export function validateAPIConfig<T>(
    inputSchema: convict.Schema<any>, inputConfig: Record<string, any>
): APIConfig & T {
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
export function validateJobConfig<T>(
    inputSchema: convict.Schema<any>, inputConfig: Record<string, any>
): ValidatedJobConfig & T {
    const config = convict(inputSchema as convict.Schema<ValidatedJobConfig & T>);

    try {
        config.load(inputConfig);
        config.validate(validateOptions);
    } catch (err) {
        throw new Error(`Validation failed for job config: ${inputConfig.name} - ${err.message}`);
    }

    const jobProperties = config.getProperties();

    if ((jobProperties.cpu && jobProperties.resources_limits_cpu)
        || (jobProperties.cpu && jobProperties.resources_requests_cpu)
        || (jobProperties.memory && jobProperties.resources_limits_memory)
        || (jobProperties.memory && jobProperties.resources_requests_memory)
    ) {
        throw new Error(`Validation failed for job config: ${inputConfig.name} - cpu/memory can't be mixed with resource settings of the same type.`);
    }

    return jobProperties;
}

