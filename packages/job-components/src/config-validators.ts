import { SchemaValidator } from '@terascope/core-utils';
import { Teraslice, Terafoundation as TF } from '@terascope/types';
import { ValidatedJobConfig, OpConfig, APIConfig } from './interfaces/index.js';
import { opSchema, apiSchema } from './job-schemas.js';

/**
 * The property key that deprecation warnings are attached to on a validated
 * op/API config.
 *
 * `validateOpConfig`/`validateAPIConfig` are compiled into every asset, so the
 * *shape* they return is a contract shared with every Teraslice runtime that
 * loads the asset — including runtimes older than the one that introduced the
 * deprecations API (3.15.0). Returning a `{ config, warnings }` wrapper broke
 * that contract: a runtime with no unwrap logic baked the wrapper into the
 * stored execution and handed it to the op verbatim, nesting the op's real
 * parameters one level down under `.config`. See
 * https://github.com/terascope/teraslice/issues/4509
 *
 * To keep the return value backwards-compatible we return the flat validated
 * config (the shape every released runtime understands) and attach the warnings
 * to it here. The property is non-enumerable so it is skipped by
 * `JSON.stringify`, `Object.keys`, and object spread — it never gets persisted
 * onto the execution record and is invisible to ops that receive the config.
 * Newer runtimes read it back with {@link getValidationWarnings}.
 */
export const VALIDATION_WARNINGS_KEY = '__validationWarnings';

function attachWarnings<T extends Record<string, any>>(
    config: T, warnings: Teraslice.JobWarning[]
): T {
    Object.defineProperty(config, VALIDATION_WARNINGS_KEY, {
        value: warnings,
        enumerable: false,
        writable: true,
        configurable: true,
    });
    return config;
}

/**
 * Reads the deprecation warnings attached to a validated op/API config by
 * `validateOpConfig`/`validateAPIConfig`. Returns an empty array when the config
 * was produced by an older `job-components` that carried no warnings.
 */
export function getValidationWarnings(config: any): Teraslice.JobWarning[] {
    if (config != null && Array.isArray(config[VALIDATION_WARNINGS_KEY])) {
        return config[VALIDATION_WARNINGS_KEY];
    }
    return [];
}

/**
 * Merges the provided inputSchema with commonSchema and then validates the
 * provided opConfig against the resulting schema.
 *
 * Returns the flat validated config. Any deprecation warnings are attached to it
 * under {@link VALIDATION_WARNINGS_KEY} (non-enumerable) — read them with
 * {@link getValidationWarnings}.
 */
export function validateOpConfig<T>(
    inputSchema: TF.Schema<any>, inputConfig: Record<string, any>, context: TF.Context
): OpConfig & T {
    const schema = Object.assign({}, opSchema, inputSchema) as TF.Schema<OpConfig & T>;
    const validator = new SchemaValidator<OpConfig & T>(
        schema,
        inputConfig._op,
        undefined,
        undefined,
        context);
    try {
        const config = validator.validate(inputConfig);
        const warnings: Teraslice.JobWarning[] = validator.deprecationWarnings
            .map((schemaWarning) => ({
                type: 'JobValidation',
                reason: {
                    type: 'assetOperation',
                    kind: 'deprecation',
                    reason: {
                        _op: inputConfig._op,
                        field: schemaWarning.field,
                        description: schemaWarning.description,
                    },
                },
            }));
        return attachWarnings(config, warnings);
    } catch (err) {
        throw new Error(`Validation failed for operation config: ${inputConfig._op} - ${err.message}`);
    }
}

/**
 * Merges the provided inputSchema with commonSchema and then validates the
 * provided apiConfig against the resulting schema.
 *
 * Returns the flat validated config. Any deprecation warnings are attached to it
 * under {@link VALIDATION_WARNINGS_KEY} (non-enumerable) — read them with
 * {@link getValidationWarnings}.
 */
export function validateAPIConfig<T>(
    inputSchema: TF.Schema<any>, inputConfig: Record<string, any>, context: TF.Context
): APIConfig & T {
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
        const warnings: Teraslice.JobWarning[] = validator.deprecationWarnings
            .map((schemaWarning) => ({
                type: 'JobValidation',
                reason: {
                    type: 'assetAPIProperty',
                    kind: 'deprecation',
                    reason: {
                        api_name: inputConfig._name,
                        field: schemaWarning.field,
                        description: schemaWarning.description,
                    },
                },
            }));
        return attachWarnings(config, warnings);
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
): { config: ValidatedJobConfig & T; warnings: Teraslice.JobWarning[] } {
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

        // collect warnings from job fields
        const warnings: Teraslice.JobWarning[] = validator.deprecationWarnings
            .map((schemaWarning) => ({
                type: 'JobValidation',
                reason: {
                    type: 'jobProperty',
                    kind: 'deprecation',
                    reason: {
                        field: schemaWarning.field,
                        description: schemaWarning.description,
                    },
                },
            }));

        return { config: jobProperties, warnings };
    } catch (err) {
        throw new Error(`Validation failed for job config: ${inputConfig.name} - ${err.message}`);
    }
}
