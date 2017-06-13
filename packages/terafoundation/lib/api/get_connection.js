'use strict';

/*
 Common events
 error
 connected
 reconnected
 */
var fs = require("fs");
var getModule = require('../file_utils').getModule;

module.exports = function(context) {
    var sysconfig = context.sysconfig;
    var logger = context.logger;

    var connections = {};

    /*
     * Connectors can either be JavaScript file in a directory or can be packaged
     * as a npm module.
     */
    function loadConnector(type) {
        var localPath = __dirname + '/../connectors/' + type + ".js";
        var paths = {};
        paths[localPath] = true;
        paths[type] = true;

        var err = 'Could not find connector implementation for: ' + type + '\n';

        return getModule(type, paths, err);
    }

    /*
     * Creates a new connection to a remote service.
     *
     * options.type
     * options.endpoint
     * options.cached
     */
    return function(options) {
        var type = options.type;
        var endpoint = options.endpoint;
        var cached = options.cached;

        if (!endpoint) {
            endpoint = 'default';
        }

        // If it's acceptable to use a cached connection just return instead
        // of creating a new one
        var key = type + ":" + endpoint;

        if (cached && connections.hasOwnProperty(key)) {
            return connections[key];
        }

        if (sysconfig.terafoundation.connectors.hasOwnProperty(type)) {
            logger.info("Creating connection for " + type);

            var moduleConfig = {};

            if (sysconfig.terafoundation.connectors[type].hasOwnProperty(endpoint)) {
                moduleConfig = sysconfig.terafoundation.connectors[type][endpoint];
            }
            else {
                // If an endpoint was specified and doesn't exist we need to error.
                if (endpoint) {
                    throw new Error("No " + type + " endpoint configuration found for " + endpoint);
                }
            }

            var connector = loadConnector(type);

            var connection = connector.create(moduleConfig, logger, options);

            if (cached) {
                connections[key] = connection;
            }

            return connection;
        }
        else {
            throw new Error("No connection configuration found for " + type);
        }
    }
};