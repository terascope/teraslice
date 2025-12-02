import os from 'node:os';
// import convict from 'convict';
import {
    TSError, isFunction, isPlainObject,
    isEmpty, concat, pMap,
    cloneDeep, SchemaValidator,
    pDelay, Schema, Format
} from '@terascope/core-utils';
import type { Terafoundation, PartialDeep } from '@terascope/types';
import { getConnectorSchemaAndValFn } from './connector-utils.js';
import { foundationSchema } from './schema.js';

function validateConfig(
    cluster: { isMaster: boolean },
    schema: Schema<any>,
    namespaceConfig: any,
    schemaKey: string,
    extraFormats?: Format[]
) {
    try {
        console.log('@@@@ schema: ');
        console.dir(schema, { depth: null });
        console.log('@@@@ namespaceConfig: ', namespaceConfig);
        console.log('@@@@ extraFormats: ', extraFormats);

        // const config = convict(schema || {});
        const validator = new SchemaValidator<any>(schema, schemaKey, extraFormats);
        console.log('@@@@ config created');

        // config.load(namespaceConfig);

        // if (cluster.isMaster) {
        //     config.validate({
        //         // IMPORTANT: changing this will break things
        //         // FIXME
        //         // false is deprecated and will be removed in ^5.0.0
        //         // must be warn or strict
        //         allowed: true,
        //     } as any);
        // }

        // const result = config.safeParse(namespaceConfig);
        // if (!result.success) {
        //     throw result.error;
        // }
        // return result.data;
        // return config.parse(namespaceConfig);
        return validator.validate(namespaceConfig);
    } catch (err) {
        throw new TSError(err, { reason: 'Error validating configuration' });
    }
}

async function extractSchema<S>(
    fn: any,
    sysconfig: PartialDeep<Terafoundation.SysConfig<S>>
): Promise<Terafoundation.Schema<Record<string, any>>> {
    if (isFunction(fn)) {
        const result = await fn(sysconfig);
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
    sysconfig: PartialDeep<Terafoundation.SysConfig<S>>
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
export default async function validateConfigs<
    S = Record<string, any>,
    A = Record<string, any>,
    D extends string = string
>(
    cluster: Terafoundation.Cluster,
    config: Terafoundation.Config<S, A, D>,
    sysconfig: PartialDeep<Terafoundation.SysConfig<S>>
): Promise<Terafoundation.SysConfig<S>> {
    if (!isPlainObject(config) || isEmpty(config)) {
        throw new Error('Terafoundation requires a valid application configuration');
    }

    if (!isPlainObject(sysconfig) || isEmpty(sysconfig)) {
        throw new Error('Terafoundation requires a valid system configuration');
    }

    const listOfValidations: Record<string, Terafoundation.ValidationObj<S>> = {};
    const schema = await extractSchema(config.config_schema, sysconfig);

    schema.terafoundation = foundationSchema();

    const result: any = {};

    // if (config.schema_formats) {
    //     config.schema_formats.forEach((format) => {
    //         convict.addFormat(format);
    //     });
    // }

    const schemaKeys = concat(Object.keys(schema), Object.keys(sysconfig));

    for (const schemaKey of schemaKeys) {
        console.log('@@@@ schemaKey: ', schemaKey);
        const subSchema = schema[schemaKey] || {};
        const subConfig: Record<string, any>
            = sysconfig[schemaKey as keyof Terafoundation.SysConfig<S>] || {};

        const validatedConfig = validateConfig(
            cluster,
            subSchema,
            subConfig,
            schemaKey,
            config.schema_formats
        );
        console.log('@@@@ validatedConfig: ');
        console.dir(validatedConfig, { depth: null });
        await pDelay(1000); // FIXME remove

        result[schemaKey] = validatedConfig;

        if (schemaKey === 'terafoundation') {
            result[schemaKey].connectors = {};

            const connectors: Record<string, any> = subConfig.connectors || {};
            const connectorList = Object.entries(connectors);

            await pMap(connectorList, async ([connector, connectorConfig]) => {
                console.log('@@@@ connector: ', connector);

                const {
                    schema: connectorSchema,
                    validatorFn: connValidatorFn
                } = await getConnectorSchemaAndValFn(connector);

                result[schemaKey].connectors[connector] = {};

                for (const [connection, connectionConfig] of Object.entries(connectorConfig)) {
                    const validatedConnConfig = validateConfig(
                        cluster,
                        connectorSchema,
                        connectionConfig as any,
                        `${connector}.${connection}`,
                        config.schema_formats
                    );
                    console.log('@@@@ validatedConfig: ');
                    console.dir(validatedConfig, { depth: null });
                    await pDelay(1000); // FIXME remove

                    result[schemaKey].connectors[connector][connection] = validatedConnConfig;

                    listOfValidations[`${connector}:${connection}`] = {
                        validatorFn: connValidatorFn,
                        config: validatedConnConfig,
                        connector: true
                    };
                }
            });

            listOfValidations[schemaKey] = {
                config: validatedConfig
            };
        } else {
            listOfValidations[schemaKey] = {
                validatorFn: extractValidatorFn<S>(config.config_schema, sysconfig),
                config: validatedConfig
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
                validatorObj.validatorFn(cloneDeep(validatorObj.config), cloneDeep(result));
            } catch (err) {
                throw new TSError(`Cross-field validation failed for ${validatorObj.connector ? 'connector ' : ''}'${name}': ${err}`);
            }
        }
    }
    console.log('@@@@ result: ');
    console.dir(result, { depth: null });

    return result;
}
