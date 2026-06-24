import { SchemaValidator } from '@terascope/core-utils';
import { Terafoundation as TF } from '@terascope/types';
import { ValidatedJobConfig, OpConfig, APIConfig } from './interfaces/index.js';
import { opSchema, apiSchema } from './job-schemas.js';

/**
 * Merges the provided inputSchema with commonSchema and then validates the
 * provided opConfig against the resulting schema.
 */
export function validateOpConfig<T>(
    inputSchema: TF.Schema<any>, inputConfig: Record<string, any>, context: TF.Context
): { config: OpConfig & T; warnings: TF.JobWarning[] } {
    const schema = Object.assign({}, opSchema, inputSchema) as TF.Schema<OpConfig & T>;
    const validator = new SchemaValidator<OpConfig & T>(
        schema,
        inputConfig._op,
        undefined,
        undefined,
        context);
    try {
        const config = validator.validate(inputConfig);
        const warnings: TF.JobWarning[] = validator.deprecationWarnings.map((schemaWarning) => ({
            type: 'JobValidation',
            reason: {
                type: 'assetOperationProperty',
                reason: {
                    name: inputConfig._op,
                    type: 'deprecation',
                    reason: {
                        name: schemaWarning.field,
                        description: schemaWarning.description,
                    },
                },
            },
        }));
        return { config, warnings };
    } catch (err) {
        throw new Error(`Validation failed for operation config: ${inputConfig._op} - ${err.message}`);
    }
}

/**
 * Merges the provided inputSchema with commonSchema and then validates the
 * provided apiConfig against the resulting schema.
 */
export function validateAPIConfig<T>(
    inputSchema: TF.Schema<any>, inputConfig: Record<string, any>, context: TF.Context
): { config: APIConfig & T; warnings: TF.JobWarning[] } {
    const schema = Object.assign({}, apiSchema, inputSchema) as TF.Schema<APIConfig & T>;
    const validator = new SchemaValidator<APIConfig & T>(
        schema,
        inputConfig._name,
        undefined,
        undefined,
        context
    );

    try {
        const config = validator.validate(inputConfig);
        const warnings: TF.JobWarning[] = validator.deprecationWarnings.map((schemaWarning) => ({
            type: 'JobValidation',
            reason: {
                type: 'assetAPIProperty',
                reason: {
                    name: inputConfig._name,
                    type: 'deprecation',
                    reason: {
                        name: schemaWarning.field,
                        description: schemaWarning.description,
                    },
                },
            },
        }));
        return { config, warnings };
    } catch (err) {
        throw new Error(`Validation failed for api config: ${inputConfig._name} - ${err.message}`);
    }
}

/**
 * Merges the provided inputSchema with commonSchema and then validates the
 * provided jobConfig against the resulting schema.
 */
export function validateJobConfig<T>(
    inputSchema: TF.Schema<any>, inputConfig: Record<string, any>, context: TF.Context
): ValidatedJobConfig & T {
    const validator = new SchemaValidator<ValidatedJobConfig & T>(
        inputSchema as TF.Schema<ValidatedJobConfig & T>,
        inputConfig.name,
        undefined,
        undefined,
        context
    );

    try {
        const jobProperties = validator.validate(inputConfig);

        if ((jobProperties.cpu && jobProperties.resources_limits_cpu)
            || (jobProperties.cpu && jobProperties.resources_requests_cpu)
            || (jobProperties.memory && jobProperties.resources_limits_memory)
            || (jobProperties.memory && jobProperties.resources_requests_memory)
        ) {
            throw new Error(`cpu/memory can't be mixed with resource settings of the same type.`);
        }
        return jobProperties;
    } catch (err) {
        throw new Error(`Validation failed for job config: ${inputConfig.name} - ${err.message}`);
    }
}
