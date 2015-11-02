'use strict';

var sys_schema = require('../system_schema');
var _ = require('lodash');
var fs = require('fs');
var convict = require('convict');

function getPlugin(name, key, configFile) {

    var firstPath = configFile[key].plugins.path + '/' + name;

    if (!firstPath.match(/.js/)) {
        firstPath += '.js';
    }

    try {
        if (fs.existsSync(firstPath)) {
            return require(firstPath);
        }
        else {
            return require(name);
        }
    }
    catch (e) {
        throw new Error('Could not retrieve plugin code for: ' + name + '\n' + e);
    }
}

function getConnectorSchema(name, configFile) {
    var opsDir = 'noOP';

    if (configFile.teraslice && configFile.teraslice.teraslice_ops_directory) {
        opsDir = configFile.teraslice.teraslice_ops_directory;
    }

    var localPath = __dirname + '/connectors/' + name + '.js';
    var firstPath = opsDir + '/connectors/' + name + '.js';

    try {
        if (fs.existsSync(firstPath)) {
            return require(firstPath).config_schema();
        }
        else if (fs.existsSync(localPath)) {
            return require(localPath).config_schema();
        }
        else {
            return require(name).config_schema();
        }
    }
    catch (e) {
        throw new Error('Could not retrieve plugin code for: ' + name + '\n' + e);
    }
}

function validateConfig(cluster, schema, configFile) {
    var config = convict(schema);

    config.load(configFile);

    if (cluster.isMaster) {
        config.validate();
    }

    return config.getProperties();
}
module.exports = function(cluster, context, configFile) {
    var topLevelName = context.name;
    var topLevelSchema = context.config_schema();
    var config = {};

    // iterate over top level config components
    _.forOwn(configFile, function(value, key) {

        //terafoundation
        if (configFile[key].connectors) {

            config[key] = validateConfig(cluster, sys_schema, configFile[key]);
            config[key].connectors = {};

            //iterate over different connectors
            _.forOwn(configFile[key].connectors, function(innerConfig, connector) {
                var innerSchema = getConnectorSchema(connector, configFile);
                config[key].connectors[connector] = {};

                //iterate over endpoints in connectors
                _.forOwn(configFile[key].connectors[connector], function(value, endpoint) {
                    config[key].connectors[connector][endpoint] = validateConfig(cluster, innerSchema, value);
                });
            });
        }

        //top level service configuration
        if (key === topLevelName) {
            config[key] = validateConfig(cluster, topLevelSchema, configFile[key]);
        }

        if (configFile[key].plugins) {
            var plugins = configFile[key].plugins.names;

            plugins.forEach(function(name) {
                var code = getPlugin(name, key, configFile);
                var pluginSchema;

                if (code.config_schema) {
                    if (typeof code.config_schema === 'function') {
                        pluginSchema = context.config_schema();
                    }
                    else {
                        pluginSchema = context.config_schema;
                    }
                }

                config[name] = validateConfig(cluster, pluginSchema, configFile[name]);
            });
        }
    });

    return config;
};