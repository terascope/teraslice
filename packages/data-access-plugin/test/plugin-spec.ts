import 'jest-extended';
import got from 'got';
import express, { Router } from 'express';
import { debugLogger } from '@terascope/utils';
import { makeClient, cleanupIndexes } from './helpers/elasticsearch';
import TeraserverPlugin from '../src/teraserver';
import { Server } from 'http';

describe('TeraserverPlugin', () => {
    describe('when constructed', () => {
        const client = makeClient();

        const app = express();
        let listener: Server;
        const baseUrl = '/test';

        const plugin = new TeraserverPlugin({
            elasticsearch: client,
            url_base: baseUrl,
            app,
            logger: debugLogger('teraserver-plugin'),
            server_config: {
                data_access: {
                    namespace: 'test',
                },
                teraserver: {
                    shutdown_timeout: 1,
                    plugins: [],
                },
                terafoundation: {},
            }
        });

        function formatUri(uri: string = ''): string {
            // @ts-ignore because the types aren't set right
            const port = listener.address().port;

            const _uri = uri.replace(/^\//, '/');
            return `http://localhost:${port}${baseUrl}${_uri}`;
        }

        beforeAll(async () => {
            await Promise.all([
                cleanupIndexes(plugin.manager),
                (() => {
                    return new Promise((resolve, reject) => {
                        listener = app.listen((err: any) => {
                            if (err) {
                                reject(err);
                            } else {
                                resolve();
                            }
                        });
                    });
                })()
            ]);

            await plugin.initialize();

            const router = Router();
            plugin.registerRoutes(router);
            app.use(baseUrl, router);
        });

        afterAll(async () => {
            await Promise.all([
                cleanupIndexes(plugin.manager),
                (() => {
                    return new Promise((resolve, reject) => {
                        listener.close((err: any) => {
                            if (err) reject(err);
                            else resolve();
                        });
                    });
                })()
            ]);
            return plugin.shutdown();
        });

        it('should register the routes', async () => {
            const uri = formatUri();
            const result = await got(uri);
            expect(result.statusCode).toEqual(200);
        });
    });
});
