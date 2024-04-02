import os from 'os';
import convict, { addFormats } from 'convict';
import {
    TSError, isFunction, isPlainObject,
    isEmpty, concat, PartialDeep
} from '@terascope/utils';
// @ts-expect-error no types
import convict_format_with_validator from 'convict-format-with-validator';
// @ts-expect-error no types
import convict_format_with_moment from 'convict-format-with-moment';
import { getConnectorSchema, getConnectorSchemaValidation } from './connector-utils';
import { foundationSchema } from './schema';
import * as i from './interfaces';

addFormats(convict_format_with_validator);
addFormats(convict_format_with_moment);

function validateConfig(
    cluster: { isMaster: boolean },
    schema: convict.Schema<any>,
    namespaceConfig: any,
    connectorValidation?: Function | undefined
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
        if (typeof connectorValidation === 'function') {
            connectorValidation(config.getProperties());
        }

        return config.getProperties();
    } catch (err) {
        throw new TSError(err, { reason: 'Error validating configuration' });
    }
}

function extractSchema<S>(
    fn: any,
    sysconfig: PartialDeep<i.FoundationSysConfig<S>>
): Record<string, any> {
    if (isFunction(fn)) {
        return fn(sysconfig);
    }
    if (isPlainObject(fn)) {
        return fn;
    }

    return {};
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

    const schema = extractSchema(config.config_schema, sysconfig);
    schema.terafoundation = foundationSchema(sysconfig);
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
        result[schemaKey] = validateConfig(cluster, subSchema, subConfig);

        if (schemaKey === 'terafoundation') {
            result[schemaKey].connectors = {};

            const connectors: Record<string, any> = subConfig.connectors || {};
            for (const [connector, connectorConfig] of Object.entries(connectors)) {
                const connectorSchema = getConnectorSchema(connector);
                const connectorValidation = getConnectorSchemaValidation(connector);
                result[schemaKey].connectors[connector] = {};
                for (const [connection, connectionConfig] of Object.entries(connectorConfig)) {
                    result[schemaKey].connectors[connector][connection] = validateConfig(
                        cluster,
                        connectorSchema,
                        connectionConfig as any,
                        connectorValidation
                    );
                }
            }
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

    return result;
}
