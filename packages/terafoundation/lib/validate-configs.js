'use strict';

const os = require('os');
const convict = require('convict');
const { TSError, isFunction, isPlainObject } = require('@terascope/utils');
const { getConnectorSchema } = require('./connector-utils');
const sysSchema = require('../system_schema');

function validateConfig(cluster, schema, configFile) {
    try {
        const config = convict(schema || {});
        config.load(configFile);

        if (cluster.isMaster) {
            config.validate({
                // IMPORTANT: changing this will break things
                // FIXME
                // false is deprecated and will be removed in ^5.0.0
                // must be warn or strict
                allowed: true,
            });
        }

        return config.getProperties();
    } catch (err) {
        throw new TSError(err, { reason: 'Error validating configuration' });
    }
}

function extractSchema(fn, configFile) {
    if (isFunction(fn)) {
        return fn(configFile);
    }
    if (isPlainObject(fn)) {
        return fn;
    }

    return {};
}

/**
 * @param cluster the nodejs cluster metadata
 * @param config the config object passed to the library terafoundation
 * @param configFile the parsed config from the config file
*/
module.exports = function validateConfigs(cluster, config, configFile) {
    const schema = extractSchema(config.config_schema, configFile);
    const result = {};

    if (config.schema_formats) {
        config.schema_formats.forEach((format) => {
            convict.addFormat(format);
        });
    }

    for (const [namespace, namespaceConfig] of Object.entries(configFile)) {
        // terafoundation
        if (namespace === 'terafoundation') {
            result[namespace] = validateConfig(cluster, sysSchema, namespaceConfig);
            result[namespace].connectors = {};

            const connectors = configFile[namespace].connectors || {};
            for (const [connector, connectorConfig] of Object.entries(connectors)) {
                const innerSchema = getConnectorSchema(connector);
                result[namespace].connectors[connector] = {};

                for (const [endpoint, endpointConfig] of Object.entries(connectorConfig)) {
                    result[namespace].connectors[connector][endpoint] = validateConfig(
                        cluster,
                        innerSchema,
                        endpointConfig
                    );
                }
            }
        } else {
            result[namespace] = validateConfig(
                cluster,
                schema[namespace],
                namespaceConfig
            );
        }
    }

    // Annotate the config with some information about this instance.
    const hostname = os.hostname();
    if (cluster.worker) {
        result._nodeName = `${hostname}.${cluster.worker.id}`;
    } else {
        result._nodeName = hostname;
    }

    return result;
};
