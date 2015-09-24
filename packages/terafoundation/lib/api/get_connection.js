'use strict';

/*
    Common events
        error
        connected
        reconnected
*/
var fs = require("fs");

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

        try {
            if (fs.existsSync(localPath)) {
                return require(localPath)(context);
            }
            else {
                return require(type)(context);
            }
        }
        catch (e) {
            throw new Error('Could not find connector implementation for: ' + type + '\n' + e);
        }
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

        if (! endpoint) endpoint = 'default';

        // If it's acceptable to use a cached connection just return instead
        // of creating a new one
        var key = type + ":" + endpoint;
        if (cached && connections.hasOwnProperty(key)) return connections[key];

        if (sysconfig.terafoundation.connectors.hasOwnProperty(type)) {
            logger.info("Creating connection for " + type);

            var moduleConfig = {};

            if (sysconfig.terafoundation.connectors[type].hasOwnProperty(endpoint)) {
                moduleConfig = sysconfig.terafoundation.connectors[type][endpoint];
            }

            var connector = loadConnector(type);

            var connection = connector.create(moduleConfig);

            if (cached) connections[key] = connection;

            return connection;
        }
        else {
            throw new Error("No connection configuration found for " + type);
        }
    }
};