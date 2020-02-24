import net from 'net';
import os from 'os';
import url from 'url';
import nanoid from 'nanoid/async';

export function newMsgId(): Promise<string> {
    return nanoid(10);
}

export function formatURL(hostname = os.hostname(), port: number): string {
    let formatOptions;
    try {
        const parsed = new url.URL(hostname);
        formatOptions = Object.assign(parsed, {
            port,
        });
    } catch (err) {
        formatOptions = {
            protocol: 'http:',
            slashes: true,
            hostname,
            port,
        };
    }

    return url.format(formatOptions);
}

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
export async function waitForTcpPortOpen(options: {
    retryFrequency?: number;
    retryTimeout?: number;
    port: any;
    host: any;
    logger: any;
}) {
    let retrying = false;
    let now = Date.now();
    let done = false;
    const retryFrequency = options.retryFrequency || 1000; // 1s
    const retryTimeout = options.retryTimeout || 60000; // 60s
    const { logger } = options;

    return new Promise((resolve, reject) => {
        // Create socket
        const socket = new net.Socket();

        function makeConnection() {
            socket.connect(options.port, options.host);
        }

        // Functions to handle socket events
        function connectEventHandler() {
            logger.info(`waitForTcpPortOpen Connected to ${options.host}:${options.port}`);
            retrying = false;
            done = true;
            socket.destroy();
        }

        function errorEventHandler(msg: string) {
            logger.debug(`waitForTcpPortOpen error: ${msg}`);
        }

        function closeEventHandler() {
            const diff = Date.now() - now;
            logger.debug('waitForTcpPortOpen closeEventHandler called');

            // We're done anytime we've connected, we should just exit at this point.
            if (!done) {
                if (!retrying) {
                    now = Date.now();
                    retrying = true;
                    logger.info(`waitForTcpPortOpen Reconnecting to execution controller ${options.host}:${options.port}`);
                }

                if (diff > retryTimeout) {
                    // exit after retryTimeout has been exceeded
                    logger.error(`waitForTcpPortOpen Timeout expired: ${retryTimeout}`);
                    socket.destroy();
                    reject(new Error(`Timeout connecting to execution controller ${options.host}:${options.port}`));
                } else {
                    // retry as long as retryTimeout has not been exceeded
                    logger.debug(`waitForTcpPortOpen retryTimeout: ${retryTimeout} not expired: ${diff} ms`);
                    setTimeout(makeConnection, retryFrequency);
                }
            } else {
                logger.info('waitForTcpPortOpen Execution Controller responding, closing test socket.');
                resolve();
            }
        }

        // bind callbacks
        socket.on('connect', connectEventHandler);
        socket.on('error', errorEventHandler);
        socket.on('close', closeEventHandler);

        // Connect
        logger.info(`waitForTcpPortOpen connecting to ${options.host}:${options.port}...`);
        makeConnection();
    });
}
