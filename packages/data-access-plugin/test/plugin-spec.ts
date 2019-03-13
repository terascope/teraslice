import 'jest-extended';
import got from 'got';
import express from 'express';
import { Server } from 'http';
import { request } from 'graphql-request';
import { TestContext } from '@terascope/job-components';
import { makeClient, cleanupIndexes } from './helpers/elasticsearch';
import { PluginConfig } from '../src/interfaces';
import ManagerPlugin from '../src/manager';
import SearchPlugin from '../src/search';

describe('Data Access Plugin', () => {
    const client = makeClient();

    const app = express();
    let listener: Server;

    const context = new TestContext('plugin-spec', {
        clients: [
            {
                type: 'elasticsearch',
                endpoint: 'default',
                create: () => {
                    return { client };
                },
            },
            {
                type: 'elasticsearch',
                endpoint: 'other',
                create: () => {
                    return { client };
                },
            }
        ]
    });

    const pluginConfig: PluginConfig = {
        elasticsearch: client,
        url_base: '',
        app,
        context,
        logger: context.logger,
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
    let newApiToken: string;
    let roleId: string;
    let spaceId: string;
    let viewId: string;
    let defaultViewId: string;

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
                            },
                            teraserver: {
                                connection: "other"
                            }
                        }
                    }, views: [
                        {
                            name: "greetings-admin",
                            excludes: ["group"],
                            roles: ["${roleId}"]
                        }
                    ], defaultView: {
                        metadata: {
                            searchConfig: {
                                require_query: true,
                                sort_enabled: true
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
                        require_query: true,
                        sort_enabled: true
                    }
                },
                roles: []
            });

            spaceId = space.id;
            expect(spaceId).toBeTruthy();

            viewId = views[0].id;
            expect(viewId).toBeTruthy();

            defaultViewId = views[1].id;
            expect(defaultViewId).toBeTruthy();
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
            expect(viewId).toBeTruthy();
            expect(defaultViewId).toBeTruthy();

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
                    findSpace(id: "${spaceId}") {
                        default_view,
                        views
                    }
                    findSpaces(query: "*") {
                        name
                    }
                    findView(id: "${viewId}") {
                        excludes
                    }
                    findViews(query: "*") {
                        name
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
                ],
                findSpace: {
                    default_view: defaultViewId,
                    views: [viewId]
                },
                findSpaces: [
                    {
                        name: 'greetings',
                    }
                ],
                findView: {
                    excludes: ['group']
                },
                findViews: [
                    {
                        name: `Default View for Space ${spaceId}`,
                    },
                    {
                        name: 'greetings-admin',
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
                    token: apiToken
                },
                json: true,
                throwHttpErrors: false
            });

            expect(result.statusCode).toEqual(204);
        });

        it('should be able to update a user\'s password', async () => {
            expect(userId).toBeTruthy();

            const uri = formatBaseUri('/data-access');
            const query = `
                mutation {
                    updatePassword(id: "${userId}", password: "bananas")
                    updateToken(id: "${userId}")
                }
            `;

            const result: any = await request(uri, query);
            expect(result.updatePassword).toBeTrue();
            expect(result.updateToken).not.toBe(apiToken);

            newApiToken = result.updateToken;
            expect(newApiToken).toBeTruthy();
        });

        it('should return a 403 when using the outdated apiToken', async () => {
            expect(newApiToken).toBeTruthy();
            expect(apiToken).toBeTruthy();

            const uri = formatBaseUri();
            const result = await got(uri, {
                query: {
                    token: apiToken
                },
                json: true,
                throwHttpErrors: false
            });

            expect(result.statusCode).toEqual(403);
            apiToken = newApiToken;
        });
    });

    describe('when searching a space', () => {
        const index = 'hello-space';

        beforeAll(async () => {
            await client.indices.delete({
                index,
                ignoreUnavailable: true,
            });

            await client.indices.create({
                index,
                waitForActiveShards: 'all',
                body: {
                    settings: {
                        'index.number_of_shards': 1,
                        'index.number_of_replicas': 0
                    },
                    mappings: {
                        _doc: {
                            _all: {
                                enabled: false
                            },
                            dynamic: false,
                            properties: {
                                id: {
                                    type: 'keyword'
                                },
                                foo: {
                                    type: 'keyword'
                                },
                                group: {
                                    type: 'keyword'
                                },
                            }
                        }
                    },
                }
            });

            await client.create({
                index,
                type: '_doc',
                id: '1',
                refresh: true,
                body: {
                    id: 1,
                    foo: 'bar',
                    group: 'a'
                },
            });

            await client.create({
                index,
                type: '_doc',
                id: '2',
                refresh: true,
                body: {
                    id: 2,
                    foo: 'bar',
                    group: 'b'
                },
            });

            await client.create({
                index,
                type: '_doc',
                id: '3',
                refresh: true,
                body: {
                    id: 3,
                    foo: 'baz',
                    group: 'a'
                },
            });
        });

        afterAll(async () => {
            await client.indices.delete({
                index,
                ignoreUnavailable: true,
            });
        });

        it('should be able to search a space', async () => {
            expect(spaceId).toBeTruthy();
            expect(apiToken).toBeTruthy();

            const uri = formatBaseUri(spaceId);
            const result = await got(uri, {
                query: {
                    token: apiToken,
                    q: 'foo:bar',
                    sort: '_id:asc'
                },
                json: true,
                throwHttpErrors: false
            });

            expect(result).toMatchObject({
                body: {
                    info: '2 results found.',
                    total: 2,
                    returning: 2,
                    results: [
                        {
                            id: 1,
                            foo: 'bar',
                        },
                        {
                            id: 2,
                            foo: 'bar',
                        }
                    ]
                },
                statusCode: 200
            });
        });

        describe('when perserve index is set to true', () => {
            it('should be able to update the default view', async () => {
                expect(defaultViewId).toBeTruthy();

                const uri = formatBaseUri('/data-access');
                const query = `
                    mutation {
                        updateView(view: {
                            id: "${defaultViewId}",
                            metadata: {
                                searchConfig: {
                                    require_query: true,
                                    sort_enabled: true,
                                    preserve_index_name: true
                                }
                            }
                        }) {
                            id
                        }
                    }
                `;

                expect(await request(uri, query)).toEqual({
                    updateView: {
                        id: defaultViewId,
                    }
                });
            });

            it('should be able to search a space with pretty output', async () => {
                expect(spaceId).toBeTruthy();
                expect(apiToken).toBeTruthy();

                const uri = formatBaseUri(spaceId);
                const result = await got(uri, {
                    query: {
                        token: apiToken,
                        q: 'foo:baz',
                        pretty: true
                    },
                    throwHttpErrors: false
                });

                const expected = JSON.stringify({
                    info: '1 results found.',
                    total: 1,
                    returning: 1,
                    results: [
                        {
                            foo: 'baz',
                            id: 3,
                            _index: index,
                        }
                    ]
                }, null, 2);

                expect(result.body).toEqual(expected);
                expect(result.statusCode).toEqual(200);
            });
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
