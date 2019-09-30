import os from 'os';
import convict from 'convict';
import {
    TSError, isFunction, isPlainObject, isEmpty
} from '@terascope/utils';
import { getConnectorSchema } from './connector-utils';
import sysSchema from './schema';
import * as i from './interfaces';

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

function extractSchema<S>(fn: any, sysconfig: i.FoundationSysConfig<S>): any {
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
export default function validateConfigs<S = {}, A = {}, D extends string = string>(
    cluster: i.Cluster,
    config: i.FoundationConfig<S, A, D>,
    sysconfig: i.FoundationSysConfig<S>
): i.FoundationSysConfig<S> {
    if (!isPlainObject(config) || isEmpty(config)) {
        throw new Error('Terafoundation requires a valid application configuration');
    }

    if (!isPlainObject(sysconfig) || isEmpty(sysconfig)) {
        throw new Error('Terafoundation requires a valid system configuration');
    }

    const schema = extractSchema(config.config_schema, sysconfig);
    const result: any = {};

    if (config.schema_formats) {
        config.schema_formats.forEach((format) => {
            convict.addFormat(format);
        });
    }

    for (const [namespace, namespaceConfig] of Object.entries(sysconfig)) {
        // terafoundation
        if (namespace === 'terafoundation') {
            result[namespace] = validateConfig(cluster, sysSchema, namespaceConfig);
            result[namespace].connectors = {};

            const connectors: Record<string, any> = sysconfig[namespace].connectors || {};
            for (const [connector, connectorConfig] of Object.entries(connectors)) {
                const innerSchema = getConnectorSchema(connector);
                result[namespace].connectors[connector] = {};

                for (const [endpoint, endpointConfig] of Object.entries(connectorConfig)) {
                    result[namespace].connectors[connector][endpoint] = validateConfig(
                        cluster,
                        innerSchema,
                        endpointConfig as any
                    );
                }
            }
        } else {
            result[namespace] = validateConfig(
                cluster,
                schema[namespace],
                namespaceConfig as any
            );
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
