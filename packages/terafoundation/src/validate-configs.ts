import os from 'os';
import convict, { addFormats } from 'convict';
import {
    TSError, isFunction, isPlainObject,
    isEmpty, concat, PartialDeep, cloneDeep
} from '@terascope/utils';
// @ts-expect-error no types
import convict_format_with_validator from 'convict-format-with-validator';
// @ts-expect-error no types
import convict_format_with_moment from 'convict-format-with-moment';
import { Terafoundation } from '@terascope/types';
import { getConnectorSchemaAndValFn } from './connector-utils';
import { foundationSchema, foundationValidatorFn } from './schema';
import * as i from './interfaces';

addFormats(convict_format_with_validator);
addFormats(convict_format_with_moment);

function validateConfig(
    cluster: { isMaster: boolean },
    schema: convict.Schema<any>,
    namespaceConfig: any
) {
    try {
        const config = convict(schema || {});
        config.load(namespaceConfig);

        if (cluster.isMaster) {
            config.validate({
                // IMPORTANT: changing this will break things
                // FIXME
                // false is deprecated and will be removed in ^5.0.0
                // must be warn or strict
                allowed: true,
            } as any);
        }

        return config.getProperties();
    } catch (err) {
        throw new TSError(err, { reason: 'Error validating configuration' });
    }
}

function extractSchema<S>(
    fn: any,
    sysconfig: PartialDeep<i.FoundationSysConfig<S>>
): Terafoundation.Schema<Record<string, any>> {
    if (isFunction(fn)) {
        const result = fn(sysconfig);
        if (result.schema) {
            return result.schema;
        }
        return result;
    }
    if (isPlainObject(fn)) {
        return fn;
    }

    return {};
}

function extractValidatorFn<S>(
    fn: any,
    sysconfig: PartialDeep<i.FoundationSysConfig<S>>
): Terafoundation.ValidatorFn<S> | undefined {
    if (isFunction(fn)) {
        const result = fn(sysconfig);
        if (result.validatorFn) {
            return result.validatorFn;
        }
    }
    if (isPlainObject(fn)) {
        return fn.validatorFn;
    }

    return undefined;
}

/**
 * @param cluster the nodejs cluster metadata
 * @param config the config object passed to the library terafoundation
 * @param sysconfig unvalidated sysconfig
*/
export default function validateConfigs<
    S = Record<string, unknown>,
    A = Record<string, unknown>,
    D extends string = string
>(
    cluster: i.Cluster,
    config: i.FoundationConfig<S, A, D>,
    sysconfig: PartialDeep<i.FoundationSysConfig<S>>
): i.FoundationSysConfig<S> {
    if (!isPlainObject(config) || isEmpty(config)) {
        throw new Error('Terafoundation requires a valid application configuration');
    }

    if (!isPlainObject(sysconfig) || isEmpty(sysconfig)) {
        throw new Error('Terafoundation requires a valid system configuration');
    }

    const listOfValidations: Record<string, Terafoundation.ValidationObj<S>> = {};
    const schema = extractSchema(config.config_schema, sysconfig);
    schema.terafoundation = foundationSchema();

    const result: any = {};

    if (config.schema_formats) {
        config.schema_formats.forEach((format) => {
            convict.addFormat(format);
        });
    }

    const schemaKeys = concat(Object.keys(schema), Object.keys(sysconfig));
    for (const schemaKey of schemaKeys) {
        const subSchema = schema[schemaKey] || {};
        const subConfig: Record<string, any> = sysconfig[schemaKey] || {};
        const validatedConfig = validateConfig(cluster, subSchema, subConfig);
        result[schemaKey] = validatedConfig;

        if (schemaKey === 'terafoundation') {
            result[schemaKey].connectors = {};

            const connectors: Record<string, any> = subConfig.connectors || {};
            for (const [connector, connectorConfig] of Object.entries(connectors)) {
                const {
                    schema: connectorSchema,
                    validatorFn: connValidatorFn
                } = getConnectorSchemaAndValFn<S>(connector);

                result[schemaKey].connectors[connector] = {};
                for (const [connection, connectionConfig] of Object.entries(connectorConfig)) {
                    const validatedConnConfig = validateConfig(
                        cluster,
                        connectorSchema,
                        connectionConfig as any
                    );

                    result[schemaKey].connectors[connector][connection] = validatedConnConfig;

                    listOfValidations[`${connector}:${connection}`] = {
                        validatorFn: connValidatorFn,
                        subconfig: validatedConnConfig,
                        connector: true
                    };
                }
            }

            listOfValidations[schemaKey] = {
                validatorFn: foundationValidatorFn<S>,
                subconfig: validatedConfig
            };
        } else {
            listOfValidations[schemaKey] = {
                validatorFn: extractValidatorFn<S>(config.config_schema, sysconfig),
                subconfig: validatedConfig
            };
        }
    }

    // Annotate the config with some information about this instance.
    const hostname = os.hostname();
    if (process.env.POD_IP) {
        result._nodeName = process.env.POD_IP;
    } else if (cluster.worker) {
        result._nodeName = `${hostname}.${cluster.worker.id}`;
    } else {
        result._nodeName = hostname;
    }

    // Cross-field validation
    for (const entry of Object.entries(listOfValidations)) {
        const [name, validatorObj] = entry;

        if (validatorObj.validatorFn) {
            try {
                validatorObj.validatorFn(cloneDeep(validatorObj.subconfig), cloneDeep(result));
            } catch (err) {
                throw new TSError(`Cross-field validation failed for ${validatorObj.connector ? 'connector ' : ''}'${name}': ${err}`);
            }
        }
    }

    return result;
}
