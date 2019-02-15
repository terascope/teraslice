import 'jest-extended';
import { request } from 'graphql-request';
import express from 'express';
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

            plugin.registerRoutes();
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

        let id: string;

        beforeAll(async () => {
            const user = await plugin.manager.users.create({
                username: 'foobar-1',
                firstname: 'Foo',
                lastname: 'Bar',
                email: 'foo@example.com',
                roles: [],
                client_id: 1,
            }, 'secrets');

            id = user.id;
        });

        it('should be able to get a user', async () => {
            const uri = formatUri();
            const query = `{
                getUser(id: "${id}") {
                    username,
                    firstname,
                    lastname,
                }
            }`;

            type GetUserResponse = {
                getUser: {
                    username: string,
                    fistname: string,
                    lastname: string,
                }
            };

            const result: GetUserResponse = await request(uri, query);
            expect(result.getUser).toEqual({
                username: 'foobar-1',
                firstname: 'Foo',
                lastname: 'Bar'
            });
        });
    });
});
