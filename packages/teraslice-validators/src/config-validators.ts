import * as convict from 'convict';
import { merge } from 'lodash';
import { OpConfig, JobConfig } from '@terascope/teraslice-types';

const validateOptions: convict.ValidateOptions = { allowed: 'strict' };

/**
 * Merges the provided inputSchema with commonSchema and then validates the
 * provided opConfig against the resulting schema.
 */
export function validateOpConfig(inputSchema: convict.Schema<any>, inputConfig: any): OpConfig {
    const schema: convict.Schema<any> = merge(inputSchema, inputConfig);
    const config = convict(schema);

    try {
        config.load(inputConfig);
        config.validate(validateOptions);
    } catch (err) {
        throw new Error(`Validation failed for opConfig: ${inputConfig._op} - ${err.message}`);
    }

    return config.getProperties() as OpConfig;
}

/**
 * Merges the provided inputSchema with commonSchema and then validates the
 * provided jobConfig against the resulting schema.
 */
export function validateJobConfig(inputSchema: convict.Schema<any>, inputConfig: any): JobConfig {
    const config = convict(inputSchema);

    try {
        config.load(inputConfig);
        config.validate(validateOptions);
    } catch (err) {
        throw new Error(`Validation failed for jobConfig: ${inputConfig.name} - ${err.message}`);
    }

    return config.getProperties() as JobConfig;
}
