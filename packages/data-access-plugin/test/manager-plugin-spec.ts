import 'jest-extended';
import got from 'got';
import express from 'express';
import { request } from 'graphql-request';
import { debugLogger } from '@terascope/utils';
import { makeClient, cleanupIndexes } from './helpers/elasticsearch';
import TeraserverPlugin from '../src/manager';
import { Server } from 'http';

describe('ManagerPlugin', () => {
    describe('when constructed', () => {
        const client = makeClient();

        const app = express();
        let listener: Server;
        const baseUrl = '/test';

        const plugin = new TeraserverPlugin({
            elasticsearch: client,
            url_base: baseUrl,
            app,
            logger: debugLogger('manager-plugin'),
            server_config: {
                data_access: {
                    namespace: 'test_da_plugin',
                },
                teraserver: {
                    shutdown_timeout: 1,
                    plugins: [],
                },
                terafoundation: {},
            }
        });

        function formatBaseUri(uri: string = ''): string {
            // @ts-ignore because the types aren't set right
            const port = listener.address().port;

            const _uri = uri.replace(/^\//, '');
            return `http://localhost:${port}/${_uri}`;
        }

        function formatManagementURL(uri: string = ''): string {
            const _uri = uri.replace(/^\//, '');
            return formatBaseUri(`${baseUrl}/${_uri}`);
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

        let userId: string;
        let apiToken: string;
        let roleId: string;
        let spaceId: string;

        it('should be able to create a role', async () => {
            const uri = formatManagementURL();
            const query = `
                mutation {
                    createRole(role: {
                        name: "greeter",
                        spaces: [],
                    }) {
                        id,
                        name,
                        spaces,
                    }
                }
            `;

            const { createRole } = await request(uri, query);
            expect(createRole).toMatchObject({
                name: 'greeter',
                spaces: [],
            });

            roleId = createRole.id;
            expect(roleId).toBeTruthy();
        });

        it('should be able to create a space and views', async () => {
            expect(roleId).toBeTruthy();

            const uri = formatManagementURL();
            const query = `
                mutation {
                    createSpace(space: {
                        name: "greetings",
                        metadata: {
                            example: true
                        }
                    }, views: [
                        {
                            name: "greetings-admin",
                            roles: ["${roleId}"],
                        }
                    ]) {
                        space {
                            id,
                            name,
                            metadata
                        }
                        views {
                            id,
                            name,
                            roles
                        }
                    }
                }
            `;

            const {
                createSpace: {
                    space,
                    views
                }
            } = await request(uri, query);

            expect(space).toMatchObject({
                name: 'greetings',
                metadata: {
                    example: true
                }
            });

            expect(views).toBeArrayOfSize(1);
            expect(views[0]).toMatchObject({
                name: 'greetings-admin',
                roles: [roleId],
            });

            spaceId = space.id;
            expect(spaceId).toBeTruthy();
        });

        it('should be able to create a user', async () => {
            expect(roleId).toBeTruthy();

            const uri = formatManagementURL();
            const query = `
                mutation {
                    createUser(user: {
                        username: "hello",
                        firstname: "hi",
                        lastname: "hello",
                        email: "hi@example.com",
                        roles: ["${roleId}"],
                        client_id: 1,
                    }, password: "greeting") {
                        id,
                        username,
                        email,
                        api_token
                    }
                }
            `;

            const { createUser } = await request(uri, query);
            expect(createUser).toMatchObject({
                username: 'hello',
                email: 'hi@example.com',
            });

            userId = createUser.id;
            apiToken = createUser.api_token;
            expect(userId).toBeTruthy();
        });

        it('should be able to update a user', async () => {
            expect(userId).toBeTruthy();
            expect(roleId).toBeTruthy();

            const uri = formatManagementURL();
            const query = `
                mutation {
                    updateUser(user: {
                        id: "${userId}"
                        username: "hello",
                        email: "hi@example.com",
                        client_id: 2,
                        roles: ["${roleId}"]
                    }) {
                        username,
                        email,
                        roles,
                        client_id,
                    }
                }
            `;

            expect(await request(uri, query)).toEqual({
                updateUser: {
                    username: 'hello',
                    email: 'hi@example.com',
                    roles: [roleId],
                    client_id: 2
                }
            });
        });

        it('should be not able to get /api/v2 when not logged in', async () => {
            const uri = formatBaseUri('/api/v2');
            const result = await got(uri, {
                throwHttpErrors: false
            });
            expect(result.statusCode).toEqual(401);
        });

        it('should be able to get /api/v2 when logged in with api_token', async () => {
            const uri = formatBaseUri('/api/v2');
            const result = await got(uri, {
                query: {
                    api_token: apiToken
                },
                throwHttpErrors: false
            });
            expect(result.statusCode).toEqual(204);
        });

        it('should be able to get /api/v2 when logged in with username and password', async () => {
            const uri = formatBaseUri('/api/v2');
            const result = await got(uri, {
                query: {
                    username: 'hello',
                    password: 'greeting'
                },
                throwHttpErrors: false
            });
            expect(result.statusCode).toEqual(204);
        });

        it('should be able to update a user\'s password', async () => {
            expect(userId).toBeTruthy();

            const uri = formatManagementURL();
            const query = `
                mutation {
                    updatePassword(id: "${userId}", password: "bananas")
                }
            `;

            expect(await request(uri, query)).toEqual({
                updatePassword: true
            });
        });

        it('should be not able to get /api/v2 when using an outdated username and password', async () => {
            const uri = formatBaseUri('/api/v2');
            const result = await got(uri, {
                query: {
                    api_token: apiToken
                },
                throwHttpErrors: false
            });

            expect(result.statusCode).toEqual(403);
        });

        it('should be not able to get /api/v2 when using an outdated api_token', async () => {
            const uri = formatBaseUri('/api/v2');
            const result = await got(uri, {
                query: {
                    username: 'hello',
                    password: 'greeting'
                },
                throwHttpErrors: false
            });

            expect(result.statusCode).toEqual(403);
        });

        it('should be able to find everything', async () => {
            expect(userId).toBeTruthy();
            expect(spaceId).toBeTruthy();

            const uri = formatManagementURL();
            const query = `
                query {
                    findRole(id: "${roleId}") {
                        name,
                        spaces
                    }

                    findRoles(query: "*") {
                        name,
                        spaces
                    }

                    findUser(id: "${userId}") {
                        username,
                        firstname,
                        lastname,
                    }

                    findUsers(query: "*") {
                        username,
                        firstname,
                        lastname,
                    }
                }
            `;

            expect(await request(uri, query)).toEqual({
                findRole: {
                    name: 'greeter',
                    spaces: [spaceId]
                },
                findRoles: [
                    {
                        name: 'greeter',
                        spaces: [spaceId]
                    }
                ],
                findUser: {
                    username: 'hello',
                    firstname: 'hi',
                    lastname: 'hello'
                },
                findUsers: [
                    {
                        username: 'hello',
                        firstname: 'hi',
                        lastname: 'hello'
                    }
                ]
            });
        });

        it('should be able to remove a user', async () => {
            expect(userId).toBeTruthy();

            const uri = formatManagementURL();
            const query = `
                mutation {
                    removeUser(id: "${userId}")
                }
            `;

            expect(await request(uri, query)).toEqual({
                removeUser: true
            });
        });
    });
});
