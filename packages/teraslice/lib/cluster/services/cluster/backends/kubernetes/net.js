'use strict';

const net = require('net');

/**
 * waitForTcpPortOpen will try to connect to the specified host and port, if it
 * connects it will exit without error, if it does not connect, it will time
 * out
 * @param {Object} options - socket configuration options
 * @param {string} options.host - Hostname or IP address to check
 * @param {number} options.port - port number to check
 * @param {number} options.retryFrequency - time in ms between retry attempts
 * @param {number} options.retryTimeout - time in ms until it times out
 *  connecting, name resolution timeouts are separate and not configurable
 * @param {Object} options.logger - Teraslice logger object
 */
async function waitForTcpPortOpen(options) {
    let retrying = false;
    let now = Date.now();
    let done = false;
    const { logger } = options;

    return new Promise((resolve, reject) => {
        // Create socket
        const socket = new net.Socket();

        function makeConnection() {
            socket.connect(options.port, options.host);
        }

        // Functions to handle socket events
        function connectEventHandler() {
            logger.info(`Connected to ${options.host}:${options.port}`);
            retrying = false;
            done = true;
            socket.destroy();
        }

        function errorEventHandler(msg) {
            logger.debug(`error: ${msg}`);
        }

        function closeEventHandler() {
            const diff = Date.now() - now;
            logger.debug('close');

            // We're done anytime we've connected, we should just exit at this point.
            if (!done) {
                if (!retrying) {
                    now = Date.now();
                    retrying = true;
                    logger.info('Reconnecting...');
                }

                if (diff > options.retryTimeout) {
                    // exit after retryTimeout has been exceeded
                    logger.error(`Timeout expired: ${options.retryTimeout}`);
                    socket.destroy();
                    reject(new Error(`Timeout connecting to ${options.host}:${options.port}`));
                } else {
                    // retry as long as retryTimeout has not been exceeded
                    logger.debug(`retry: ${diff} ms`);
                    setTimeout(makeConnection, options.retryFrequency);
                }
            } else {
                logger.info('Execution Controller responding, closing test socket.');
                resolve();
            }
        }

        // bind callbacks
        socket.on('connect', connectEventHandler);
        socket.on('error', errorEventHandler);
        socket.on('close', closeEventHandler);

        // Connect
        logger.info(`Connecting to ${options.host}:${options.port}...`);
        makeConnection();
    });
}

module.exports = {
    waitForTcpPortOpen
};
