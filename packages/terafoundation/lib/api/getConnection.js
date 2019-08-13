'use strict';

/*
 Common events
 error
 connected
 reconnected
 */
const { createConnection } = require('../connector_utils');

module.exports = function getConnectionModule(context) {
    const { sysconfig } = context;
    const connections = {};

    /*
     * Creates a new connection to a remote service.
     *
     * @param options
     * @param options.type
     * @param options.endpoint
     * @param options.cached
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
                moduleConfig = Object.assign(
                    {},
                    sysconfig.terafoundation.connectors[type][endpoint]
                );
                // If an endpoint was specified and doesn't exist we need to error.
            } else if (endpoint) {
                throw new Error(`No ${type} endpoint configuration found for ${endpoint}`);
            }

            const connection = createConnection(type, moduleConfig, logger, options);

            if (cached) {
                connections[key] = connection;
            }

            return connection;
        }

        throw new Error(`No connection configuration found for ${type}`);
    };
};
