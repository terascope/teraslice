'use strict';

const net = require('net');

const shuffle = require('lodash/shuffle');
const {
    get,
    times,
    toInteger,
    pDelay,
} = require('@terascope/utils');
const porty = require('porty');

const _portLists = new Map();
const listPorts = (start, end) => {
    const key = `${start}:${end}`;
    if (_portLists.has(key)) {
        return _portLists.get(key);
    }

    // this should only be done once
    const ports = shuffle(times((end - start) + 1, (n) => n + start));
    _portLists.set(key, ports);
    return ports;
};

async function findPort(options = {}) {
    const {
        start = 8002,
        end = 40000,
        assetsPort = 8003
    } = options;

    const ports = listPorts(start, end);

    const tested = [];
    let port;

    while (ports.length) {
        port = ports.shift();
        if (port === assetsPort) continue;
        // these will be enqueue
        tested.push(port);

        const available = await porty.test(port);
        if (available) {
            break;
        } else {
            await pDelay(100);
            port = undefined;
        }
    }

    _portLists[`${start}:${end}`] = ports.concat(tested);

    if (port) return port;
    throw new Error(`No available port between ${start}-${end}`);
}

function getPorts(context) {
    const portConfig = get(context, 'sysconfig.teraslice.slicer_port_range');
    const dataArray = portConfig.split(':');
    const assetsPort = toInteger(dataArray[0]);
    const start = assetsPort + 1;
    // range end is exclusive, so we need to add one
    const end = toInteger(dataArray[1]) + 1;
    return { assetsPort, start, end };
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
async function waitForTcpPortOpen(options) {
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

        function errorEventHandler(msg) {
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

if (require.main === module) {
    // eslint-disable-next-line no-inner-declarations
    function _test(tries = 10) {
        if (!tries) return false;

        // for testing
        return findPort()
            .then((port) => console.error(`Found port ${port}`))
            .catch((err) => console.error(err))
            .then(() => _test(tries - 1));
    }

    _test();
} else {
    module.exports = {
        findPort,
        getPorts,
        waitForTcpPortOpen
    };
}
