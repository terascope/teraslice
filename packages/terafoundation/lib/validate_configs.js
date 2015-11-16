'use strict';

var sys_schema = require('../system_schema');
var _ = require('lodash');
var convict = require('convict');
var getModule = require('./file_utils').getModule;

function getPlugin(name, key, configFile) {

    var firstPath = configFile[key].plugins.path + '/' + name;

    var paths = {};
    paths[firstPath] = true;
    paths[name] = true;
    var err = 'Could not retrieve plugin code for: ' + name + '\n';

    return getModule(name, paths, err);

}

function getConnectorSchema(name, configFile) {
    var opsDir = 'noOP';

    if (configFile.teraslice && configFile.teraslice.teraslice_ops_directory) {
        opsDir = configFile.teraslice.teraslice_ops_directory;
    }

    var localPath = __dirname + '/connectors/' + name + '.js';
    var firstPath = opsDir + '/connectors/' + name + '.js';

    var paths = {};
    paths[opsDir] = true;
    paths[localPath] = true;
    paths[firstPath] = true;
    var err = 'Could not retrieve schema code for: ' + name + '\n';

    return getModule(name, paths, err).config_schema();

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
    var topLevelSchema;

    if (context.config_schema && typeof context.config_schema === 'function') {
        topLevelSchema = context.config_schema();
    }
    else {
        topLevelSchema = {};
    }

    var topLevelName = context.name;
    var config = {};
    var pluginsContainer = {};
    var customContainer = {};

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
        else if (key === topLevelName) {
            config[key] = validateConfig(cluster, topLevelSchema, configFile[key]);
        }

        else if (configFile[key].plugins) {
            var plugins = configFile[key].plugins.names;

            plugins.forEach(function(name) {
                pluginsContainer[name] = true;
                var code = getPlugin(name, key, configFile);
                var pluginSchema = {};

                if (code.config_schema) {
                    if (typeof code.config_schema === 'function') {
                        pluginSchema = code.config_schema();
                    }
                    else {
                        pluginSchema = code.config_schema;
                    }
                }

                config[name] = validateConfig(cluster, pluginSchema, configFile[name]);
            });
        }
        //Any other custom top level configuration outside terafoundation and teraserver
        else {
            customContainer[key] = configFile[key]
        }
    });

    //add any custom configurations that are not plugins
    _.forOwn(customContainer, function(value, key) {
        if (!pluginsContainer[key]) {
            config[key] = value;
        }
    });

    return config;
};