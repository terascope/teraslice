import 'jest-extended';
import got from 'got';
import express from 'express';
import { Server } from 'http';
import { request } from 'graphql-request';
import { debugLogger } from '@terascope/utils';
import { makeClient, cleanupIndexes } from './helpers/elasticsearch';
import { PluginConfig } from '../src/interfaces';
import ManagerPlugin from '../src/manager';
import SearchPlugin from '../src/search';

describe('Data Access Plugin', () => {
    const client = makeClient();

    const app = express();
    let listener: Server;

    const pluginConfig: PluginConfig = {
        elasticsearch: client,
        url_base: '',
        app,
        logger: debugLogger('manager-plugin'),
        server_config: {
            data_access: {
                namespace: 'test_da_plugin',
                bootstrap_mode: true,
            },
            teraserver: {
                shutdown_timeout: 1,
                plugins: [],
            },
            terafoundation: {},
        }
    };

    const manager = new ManagerPlugin(pluginConfig);
    const search = new SearchPlugin(pluginConfig);

    function formatBaseUri(uri: string = ''): string {
        // @ts-ignore because the types aren't set right
        const port = listener.address().port;

        const _uri = uri.replace(/^\//, '');
        return `http://localhost:${port}/api/v2/${_uri}`;
    }

    beforeAll(async () => {
        await Promise.all([
            cleanupIndexes(manager.manager),
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

        await Promise.all([
            manager.initialize(),
            search.initialize(),
        ]);

        manager.registerRoutes();
        search.registerRoutes();
    });

    afterAll(async () => {
        await Promise.all([
            cleanupIndexes(manager.manager),
            (() => {
                return new Promise((resolve, reject) => {
                    listener.close((err: any) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
            })()
        ]);

        await Promise.all([
            manager.shutdown(),
            search.shutdown(),
        ]);
    });

    let userId: string;
    let apiToken: string;
    let roleId: string;
    let spaceId: string;

    describe('when using the management api', () => {
        it('should be able to create a role', async () => {
            const uri = formatBaseUri('/data-access');
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

            const uri = formatBaseUri('/data-access');
            const query = `
                mutation {
                    createSpace(space: {
                        name: "greetings",
                        metadata: {
                            indexConfig: {
                                index: "hello-space"
                            }
                        }
                    }, views: [
                        {
                            name: "greetings-admin",
                            roles: ["${roleId}"]
                        }
                    ], defaultView: {
                        metadata: {
                            searchConfig: {
                                require_query: true
                            }
                        }
                    }) {
                        space {
                            id,
                            name,
                            metadata
                        }
                        views {
                            id,
                            name,
                            roles,
                            metadata
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
                    indexConfig: {
                        index: 'hello-space'
                    }
                }
            });

            expect(views).toBeArrayOfSize(2);
            expect(views[0]).toMatchObject({
                name: 'greetings-admin',
                roles: [roleId],
            });

            expect(views[1]).toMatchObject({
                metadata: {
                    searchConfig: {
                        require_query: true
                    }
                },
                roles: []
            });

            spaceId = space.id;
            expect(spaceId).toBeTruthy();
        });

        it('should be able to create a user', async () => {
            expect(roleId).toBeTruthy();

            const uri = formatBaseUri('/data-access');
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

            const uri = formatBaseUri('/data-access');
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

        it('should be able to find everything', async () => {
            expect(userId).toBeTruthy();
            expect(spaceId).toBeTruthy();

            const uri = formatBaseUri('/data-access');
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
    });

    describe('when using the api', () => {
        it('should return a 401 if no credentials are used', async () => {
            const uri = formatBaseUri();
            const result = await got(uri, {
                json: true,
                throwHttpErrors: false
            });
            expect(result.statusCode).toEqual(401);
        });

        it('should be able to authenticate with a api_token', async () => {
            expect(apiToken).toBeTruthy();

            const uri = formatBaseUri();

            const result = await got(uri, {
                query: {
                    api_token: apiToken
                },
                json: true,
                throwHttpErrors: false
            });

            expect(result.statusCode).toEqual(204);
        });

        it('should be able to authenticate with a username and password', async () => {
            const uri = formatBaseUri();
            const result = await got(uri, {
                query: {
                    username: 'hello',
                    password: 'greeting'
                },
                json: true,
                throwHttpErrors: false
            });
            expect(result.statusCode).toEqual(204);
        });

        it('should be able to search a space', async () => {
            expect(spaceId).toBeTruthy();
            expect(apiToken).toBeTruthy();

            const uri = formatBaseUri(spaceId);
            const result = await got(uri, {
                query: {
                    api_token: apiToken,
                    q: 'foo:bar'
                },
                json: true,
                throwHttpErrors: false
            });

            expect(result).toMatchObject({
                body: {
                    info: 'idk',
                    returned: 0,
                    results: []
                },
                statusCode: 200
            });
        });

        it('should be able to update a user\'s password', async () => {
            expect(userId).toBeTruthy();

            const uri = formatBaseUri('/data-access');
            const query = `
                mutation {
                    updatePassword(id: "${userId}", password: "bananas")
                }
            `;

            expect(await request(uri, query)).toEqual({
                updatePassword: true
            });
        });

        it('should return a 403 when using the outdated apiToken', async () => {
            const uri = formatBaseUri();
            const result = await got(uri, {
                query: {
                    api_token: apiToken
                },
                json: true,
                throwHttpErrors: false
            });

            expect(result.statusCode).toEqual(403);
        });

        it('should return a 403 when using the outdated username and password', async () => {
            const uri = formatBaseUri();
            const result = await got(uri, {
                query: {
                    username: 'hello',
                    password: 'greeting'
                },
                json: true,
                throwHttpErrors: false
            });

            expect(result.statusCode).toEqual(403);
        });
    });

    it('should be able to remove a everything', async () => {
        expect(userId).toBeTruthy();
        expect(roleId).toBeTruthy();
        expect(spaceId).toBeTruthy();

        const uri = formatBaseUri('/data-access');
        const query = `
            mutation {
                removeSpace(id: "${spaceId}")
                removeRole(id: "${roleId}")
                removeUser(id: "${userId}")
            }
        `;

        expect(await request(uri, query)).toEqual({
            removeSpace: true,
            removeRole: true,
            removeUser: true
        });
    });
});
