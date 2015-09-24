'use strict';

var sys_schema = require('../system_schema');
var _ = require('lodash');
var fs = require('fs');

function getPlugin(name, key, configFile) {

    var firstPath = configFile[key].plugins.path + '/' + name;

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

/*function mergeConnectors(sys_schema, schema) {
 var connectors = {
 elasticsearch: true, kafka: true, mongodb: true, redis: true,
 statsd: true
 };

 _.forOwn(schema, function(){

 });


 }*/

function setConfig(context, name, schema){
    if (context.config_schema) {
        if (typeof context.config_schema === 'function') {
            schema[name] = context.config_schema();
        }
        else {
            schema[name] = context.config_schema;
        }
    }
}

module.exports = function(context, configFile) {
    var schema = {};

    _.forOwn(configFile, function(value, key) {

        if (configFile[key].plugins) {
            var plugins = configFile[key].plugins.names;

            plugins.forEach(function(name) {
                var code = getPlugin(name, key, configFile);
                setConfig(code, name, schema);
            });

        }
    });

    schema.terafoundation = sys_schema;

    setConfig(context, context.name, schema);

    return schema;
};