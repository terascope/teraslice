'use strict';

const net = require('net');
const Porty = require('porty');

const {
    waitForTcpPortOpen
} = require('../../../../../../../lib/cluster/services/cluster/backends/kubernetes/net');

// Run tests with DEBUG=True to see output
function l(msg) {
    if (process.env.DEBUG) {
        // eslint-disable-next-line no-console
        console.log(msg);
    }
}

const logger = {
    debug: (msg) => l(`[DEBUG]: ${msg}`),
    error: (msg) => l(`[ERROR]: ${msg}`),
    info: (msg) => l(`[INFO]: ${msg}`),
};

let server;
let serverPort;

async function setServerPort() {
    serverPort = await Porty.find({ min: 14500, max: 14549 });
    logger.debug(`serverPort: ${serverPort}`);
}

async function startServer() {
    server = await net.createServer();
    return new Promise((resolve) => server.listen(serverPort, () => { resolve(); });
}

async function stopServer() {
    return new Promise((resolve) => server.close(() => { resolve(); });
}

describe('waitForTcpPortOpen', () => {
    describe('with service running', () => {
        beforeEach(async () => {
            await setServerPort();
            await startServer();
        });
        afterEach(async () => { await stopServer(); });

        test('should not raise an error', async () => {
            const options = {
                host: 'localhost',
                logger,
                port: serverPort,
                retryFrequency: 100,
                retryTimeout: 2000,
            };
            await expect(waitForTcpPortOpen(options)).resolves.toBe();
        });
    });

    // eslint-disable-next-line jest/no-disabled-tests
    describe('with service not running', () => {
        beforeEach(async () => {
            await setServerPort();
        });

        test('should raise an error', async () => {
            const options = {
                host: 'localhost',
                logger,
                port: serverPort,
                retryFrequency: 500,
                retryTimeout: 2000,
            };
            await expect(waitForTcpPortOpen(options)).rejects.toThrow('Timeout');
        });
    });
});
