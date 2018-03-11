'use strict';

const sysSchema = require('../system_schema');
const _ = require('lodash');
const convict = require('convict');
const getModule = require('./file_utils').getModule;

function getConnectorSchema(name, context) {
    const paths = {};
    const err = `Could not retrieve schema code for: ${name}\n`;

    const localPath = `${__dirname}/connectors/${name}.js`;
    paths[localPath] = true;

    if (context.ops_directory) {
        const opsPath = `${context.ops_directory}/connectors/${name}.js`;
        paths[opsPath] = true;
    }

    // getModule has a fallback to check node modules for connector schema
    return getModule(name, paths, err).config_schema();
}

function validateConfig(cluster, schema, configFile) {
    try {
        const config = convict(schema);
        config.load(configFile);

        if (cluster.isMaster) {
            config.validate();
        }

        return config.getProperties();
    } catch (err) {
        throw new Error(`Error validating configuration, error: ${err.stack}`);
    }
}

function extractSchema(fn, configFile) {
    if (fn && typeof fn === 'function') {
        return fn(configFile);
    } else if (fn && typeof fn === 'object') {
        return fn;
    }

    return {};
}

module.exports = function module(cluster, context, configFile) {
    const topLevelSchema = extractSchema(context.config_schema, configFile);
    const pluginSchema = extractSchema(context.plugin_schema, configFile);

    const topLevelName = context.name;
    const config = {};

    if (context.schema_formats) {
        context.schema_formats.forEach((format) => {
            convict.addFormat(format);
        });
    }

    // iterate over top level config components
    _.forOwn(configFile, (value, key) => {
        // terafoundation
        if (configFile[key].connectors) {
            config[key] = validateConfig(cluster, sysSchema, configFile[key]);
            config[key].connectors = {};

            // iterate over different connectors
            _.forOwn(configFile[key].connectors, (innerConfig, connector) => {
                const innerSchema = getConnectorSchema(connector, context);
                config[key].connectors[connector] = {};

                // iterate over endpoints in connectors
                _.forOwn(configFile[key].connectors[connector], (name, endpoint) => {
                    config[key].connectors[connector][endpoint] =
                        validateConfig(cluster, innerSchema, name);
                });
            });

        // top level service configuration
        } else if (key === topLevelName) {
            config[key] = validateConfig(cluster, topLevelSchema, configFile[key]);
        } else if (pluginSchema[key]) {
            config[key] = validateConfig(cluster, pluginSchema[key], configFile[key]);

        // Any other custom top level configuration outside terafoundation and teraserver
        } else {
            config[key] = configFile[key];
        }
    });

    return config;
};
