'use strict';

const _ = require('lodash');
const os = require('os');
const convict = require('convict');
const { getModule } = require('./file_utils');
const sysSchema = require('../system_schema');

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
                allowed: false,
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

module.exports = function module(cluster, context, configFile) {
    const schema = extractSchema(context.config_schema, configFile);
    const config = {};

    if (context.schema_formats) {
        context.schema_formats.forEach((format) => {
            convict.addFormat(format);
        });
    }

    // iterate over top level config components
    _.forOwn(configFile, (value, key) => {
        // terafoundation
        if (key === 'terafoundation') {
            config[key] = validateConfig(cluster, sysSchema, configFile[key]);
            config[key].connectors = {};

            // iterate over different connectors
            _.forOwn(configFile[key].connectors, (innerConfig, connector) => {
                const innerSchema = getConnectorSchema(connector, context);
                config[key].connectors[connector] = {};

                // iterate over endpoints in connectors
                _.forOwn(configFile[key].connectors[connector], (name, endpoint) => {
                    const validated = validateConfig(cluster, innerSchema, name);
                    config[key].connectors[connector][endpoint] = validated;
                });
            });
        } else {
            config[key] = validateConfig(cluster, schema[key], configFile[key]);
        }
    });

    // Annotate the config with some information about this instance.
    const hostname = os.hostname();
    if (cluster.worker) {
        config._nodeName = `${hostname}.${cluster.worker.id}`;
    } else {
        config._nodeName = hostname;
    }

    return config;
};
