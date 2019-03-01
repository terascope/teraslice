'use strict';

/*
 Common events
 error
 connected
 reconnected
 */
const { getModule } = require('../file_utils');

module.exports = function module(context) {
    const { sysconfig } = context;
    const connections = {};

    /*
     * Connectors can either be JavaScript file in a directory or can be packaged
     * as a npm module.
     */
    function loadConnector(type) {
        const localPath = `${__dirname}/../connectors/${type}.js`;
        const paths = {};
        paths[localPath] = true;
        paths[type] = true;

        const err = `Could not find connector implementation for: ${type}\n`;

        return getModule(type, paths, err);
    }

    /*
     * Creates a new connection to a remote service.
     *
     * options.type
     * options.endpoint
     * options.cached
     */
    return function getConnection(options) {
        const { logger } = context;

        const { type, endpoint = 'default', cached } = options;

        // If it's acceptable to use a cached connection just return instead
        // of creating a new one
        const key = `${type}:${endpoint}`;

        // Location in the configuration where we look for connectors.
        const { connectors } = sysconfig.terafoundation;

        if (cached && Object.prototype.hasOwnProperty.call(connections, key)) {
            return connections[key];
        }

        if (Object.prototype.hasOwnProperty.call(connectors, type)) {
            logger.info(`creating connection for ${type}`);

            let moduleConfig = {};

            if (Object.prototype.hasOwnProperty.call(connectors[type], endpoint)) {
                moduleConfig = sysconfig.terafoundation.connectors[type][endpoint];
            // If an endpoint was specified and doesn't exist we need to error.
            } else if (endpoint) {
                throw new Error(`No ${type} endpoint configuration found for ${endpoint}`);
            }

            const connector = loadConnector(type);

            const connection = connector.create(moduleConfig, logger, options);

            if (cached) {
                connections[key] = connection;
            }

            return connection;
        }

        throw new Error(`No connection configuration found for ${type}`);
    };
};
