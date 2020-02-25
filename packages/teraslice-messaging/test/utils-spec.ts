import * as net from 'net';
import * as porty from 'porty';
import 'jest-extended'; // require for type definitions
import { debugLogger } from '@terascope/utils';
import { formatURL, waitForTcpPortOpen } from '../src';

const logger = debugLogger('port_utils');

let server: any;
let serverPort: any;

describe('Utils', () => {
    describe('->formatUrl', () => {
        describe('when given a hostname and port', () => {
            it('should return a url', () => {
                expect(formatURL('hello.com', 8080)).toEqual('http://hello.com:8080');
            });
        });

        describe('when given a url and a port', () => {
            it('should return a url', () => {
                expect(formatURL('https://example.com', 8080)).toEqual('https://example.com:8080/');
            });
        });
    });
});

async function setServerPort() {
    serverPort = await porty.find({ min: 14500, max: 14549 });
    logger.debug(`serverPort: ${serverPort}`);
}

async function startServer() {
    server = await net.createServer();
    return new Promise((resolve) => server.listen(
        serverPort, () => { resolve(); }
    ));
}

async function stopServer() {
    return new Promise((resolve) => server.close(
        () => { resolve(); }
    ));
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
            await expect(waitForTcpPortOpen(options)).toResolve();
        });
    });

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
