import { ValidatedJobConfig, OpConfig } from '@terascope/teraslice-types';
import convict from 'convict';
import { opSchema } from './job-schemas';

// @ts-ignore
const validateOptions: convict.ValidateOptions = { allowed: true };

/**
 * Merges the provided inputSchema with commonSchema and then validates the
 * provided opConfig against the resulting schema.
 */
export function validateOpConfig(inputSchema: convict.Schema<any>, inputConfig: any): OpConfig {
    const schema: convict.Schema<any> = Object.assign({}, opSchema, inputSchema);
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
export function validateJobConfig(inputSchema: convict.Schema<any>, inputConfig: any): ValidatedJobConfig {
    const config = convict(inputSchema);

    try {
        config.load(inputConfig);
        config.validate(validateOptions);
    } catch (err) {
        throw new Error(`Validation failed for jobConfig: ${inputConfig.name} - ${err.stack}`);
    }

    return config.getProperties();
}
