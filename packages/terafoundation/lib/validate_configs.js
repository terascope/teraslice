'use strict';

const _ = require('lodash');
const os = require('os');
const convict = require('convict');
const { getConnectorModule } = require('./file_utils');
const sysSchema = require('../system_schema');

function getConnectorSchema(name, config) {
    const reason = `Could not retrieve schema code for: ${name}\n`;

    return getConnectorModule(config, name, reason).config_schema();
}

function validateConfig(cluster, _schema, configFile) {
    const schema = _schema || {};
    try {
        const config = convict(schema);
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
        throw new Error(`Error validating configuration, error: ${err.stack}`);
    }
}

function extractSchema(fn, configFile) {
    if (fn && typeof fn === 'function') {
        return fn(configFile);
    }
    if (fn && typeof fn === 'object') {
        return fn;
    }

    return {};
}

module.exports = function validateConfigs(cluster, config, configFile) {
    const schema = extractSchema(config.config_schema, configFile);
    const validatedConfig = {};

    if (config.schema_formats) {
        config.schema_formats.forEach((format) => {
            convict.addFormat(format);
        });
    }

    // iterate over top level config components
    _.forOwn(configFile, (value, key) => {
        // terafoundation
        if (key === 'terafoundation') {
            validatedConfig[key] = validateConfig(cluster, sysSchema, configFile[key]);
            validatedConfig[key].connectors = {};

            // iterate over different connectors
            _.forOwn(configFile[key].connectors, (innerConfig, connector) => {
                const innerSchema = getConnectorSchema(connector, config);
                validatedConfig[key].connectors[connector] = {};

                // iterate over endpoints in connectors
                _.forOwn(configFile[key].connectors[connector], (name, endpoint) => {
                    const validated = validateConfig(cluster, innerSchema, name);
                    validatedConfig[key].connectors[connector][endpoint] = validated;
                });
            });
        } else {
            validatedConfig[key] = validateConfig(cluster, schema[key], configFile[key]);
        }
    });

    // Annotate the config with some information about this instance.
    const hostname = os.hostname();
    if (cluster.worker) {
        validatedConfig._nodeName = `${hostname}.${cluster.worker.id}`;
    } else {
        validatedConfig._nodeName = hostname;
    }

    return validatedConfig;
};
