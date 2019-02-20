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

        let userId: string;
        let roleId: string;
        let spaceId: string;

        it('should be able to create a role', async () => {
            const uri = formatUri();
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

            const uri = formatUri();
            const query = `
                mutation {
                    createSpace(space: {
                        name: "greetings",
                    }, views: [
                        {
                            name: "greetings-admin",
                            roles: ["${roleId}"],
                        }
                    ]) {
                        space {
                            id,
                            name
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

            const uri = formatUri();
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
                        email
                    }
                }
            `;

            const { createUser } = await request(uri, query);
            expect(createUser).toMatchObject({
                username: 'hello',
                email: 'hi@example.com',
            });

            userId = createUser.id;
            expect(userId).toBeTruthy();
        });

        it('should be able to get a user', async () => {
            expect(userId).toBeTruthy();

            const uri = formatUri();
            const query = `
                query {
                    findUser(id: "${userId}") {
                        username,
                        firstname,
                        lastname,
                    }
                }
            `;

            expect(await request(uri, query)).toEqual({
                findUser: {
                    username: 'hello',
                    firstname: 'hi',
                    lastname: 'hello'
                }
            });
        });

        it('should be able to find all users', async () => {
            expect(userId).toBeTruthy();

            const uri = formatUri();
            const query = `
                query {
                    findUsers(query: "*") {
                        username,
                        firstname,
                        lastname,
                    }
                }
            `;

            expect(await request(uri, query)).toEqual({
                findUsers: [
                    {
                        username: 'hello',
                        firstname: 'hi',
                        lastname: 'hello'
                    }
                ]
            });
        });

        it('should be able to update a user', async () => {
            expect(userId).toBeTruthy();
            expect(roleId).toBeTruthy();

            const uri = formatUri();
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

        it('should be able to update a user\'s password', async () => {
            expect(userId).toBeTruthy();

            const uri = formatUri();
            const query = `
                mutation {
                    updatePassword(id: "${userId}", password: "bananas")
                }
            `;

            expect(await request(uri, query)).toEqual({
                updatePassword: true
            });
        });

        it('should be able to remove a user', async () => {
            expect(userId).toBeTruthy();

            const uri = formatUri();
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
