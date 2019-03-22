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
    let dataTypeId: string;

    describe('when using the management api', () => {
        it('should be able to create a role', async () => {
            const uri = formatBaseUri('/data-access');
            const query = `
                mutation {
                    createRole(role: { name: "greeter" }) {
                        id,
                        name,
                    }
                }
            `;

            const { createRole } = await request(uri, query);
            roleId = createRole.id;
            expect(roleId).toBeTruthy();

            expect(createRole).toMatchObject({
                name: 'greeter',
            });
        });

        it('should be able to create a data type', async () => {
            const uri = formatBaseUri('/data-access');
            const query = `
                mutation {
                    createDataType(dataType: {
                        name: "Greeter",
                        type_config: {
                            created: "date",
                            updated: "date"
                        }
                    }) {
                        id,
                        name,
                        type_config
                    }
                }
            `;

            const { createDataType } = await request(uri, query);

            dataTypeId = createDataType.id;
            expect(dataTypeId).toBeTruthy();

            expect(createDataType).toMatchObject({
                name: 'Greeter',
                type_config: {
                    created: 'date',
                    updated: 'date'
                },
            });
        });

        it('should be able to create a view', async () => {
            expect(roleId).toBeTruthy();
            expect(dataTypeId).toBeTruthy();

            const uri = formatBaseUri('/data-access');
            const query = `
                mutation {
                    createView(view: {
                        name: "greetings-admin",
                        data_type: "${dataTypeId}",
                        excludes: ["created", "updated"],
                        constraint: "group:a",
                        roles: ["${roleId}"]
                    }) {
                        id,
                        name,
                        roles,
                        data_type
                    }
                }
            `;

            const { createView } = await request(uri, query);

            viewId = createView.id;
            expect(viewId).toBeTruthy();

            expect(createView).toMatchObject({
                name: 'greetings-admin',
                roles: [roleId],
                data_type: dataTypeId,
            });
        });

        it('should be able to create a space', async () => {
            expect(roleId).toBeTruthy();
            expect(dataTypeId).toBeTruthy();
            expect(viewId).toBeTruthy();

            const uri = formatBaseUri('/data-access');
            const query = `
                mutation {
                    createSpace(space: {
                        name: "Greetings Space",
                        endpoint: "greetings",
                        data_type: "${dataTypeId}",
                        roles: ["${roleId}"],
                        views: ["${viewId}"],
                        search_config: {
                            index: "hello-space",
                            connection: "other",
                            require_query: true,
                            sort_enabled: true
                        }
                    }) {
                        id,
                        name,
                        endpoint,
                        search_config {
                            index,
                            connection,
                            require_query,
                            sort_enabled
                        }
                        data_type
                    }
                }
            `;

            const { createSpace } = await request(uri, query);

            spaceId = createSpace.id;
            expect(spaceId).toBeTruthy();

            expect(createSpace).toMatchObject({
                name: 'Greetings Space',
                endpoint: 'greetings',
                data_type: dataTypeId,
                search_config: {
                    require_query: true,
                    sort_enabled: true,
                    index: 'hello-space',
                    connection: 'other'
                }
            });
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
                        role: "${roleId}",
                        client_id: 1,
                        type: SUPERADMIN
                    }, password: "greeting") {
                        id,
                        username,
                        email,
                        api_token,
                        role,
                        type
                    }
                }
            `;

            const { createUser } = await request(uri, query);

            userId = createUser.id;
            expect(userId).toBeTruthy();
            apiToken = createUser.api_token;
            expect(apiToken).toBeTruthy();

            expect(createUser).toMatchObject({
                username: 'hello',
                email: 'hi@example.com',
                role: roleId,
                type: 'SUPERADMIN'
            });
        });

        it('should be able to find everything', async () => {
            expect(userId).toBeTruthy();
            expect(spaceId).toBeTruthy();
            expect(viewId).toBeTruthy();

            const uri = formatBaseUri('/data-access');
            const query = `
                query {
                    findRole(id: "${roleId}") {
                        name
                    }
                    findRoles(query: "*") {
                        name
                    }
                    findUser(id: "${userId}") {
                        username,
                        firstname,
                        lastname,
                    }
                    findUsers(query: "*") {
                        username
                    }
                    findSpace(id: "${spaceId}") {
                        views,
                        roles
                    }
                    findSpaces(query: "*") {
                        name
                    }
                    findDataType(id: "${dataTypeId}") {
                        name
                    }
                    findDataTypes(query: "*") {
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
                    name: 'greeter'
                },
                findRoles: [
                    {
                        name: 'greeter'
                    }
                ],
                findUser: {
                    username: 'hello',
                    firstname: 'hi',
                    lastname: 'hello'
                },
                findUsers: [
                    {
                        username: 'hello'
                    }
                ],
                findSpace: {
                    views: [viewId],
                    roles: [roleId]
                },
                findSpaces: [
                    {
                        name: 'Greetings Space'
                    }
                ],
                findDataType: {
                    name: 'Greeter'
                },
                findDataTypes: [
                    {
                        name: 'Greeter'
                    }
                ],
                findView: {
                    excludes: ['created', 'updated'],
                },
                findViews: [
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
                                created: {
                                    type: 'date'
                                },
                                updated: {
                                    type: 'date'
                                }
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
                    group: 'a',
                    updated: new Date().toISOString(),
                    created: new Date().toISOString()
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
                    group: 'a',
                    updated: new Date().toISOString(),
                    created: new Date().toISOString()
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
                    group: 'a',
                    updated: new Date().toISOString(),
                    created: new Date().toISOString()
                },
            });

            await client.create({
                index,
                type: '_doc',
                id: '4',
                refresh: true,
                body: {
                    id: 4,
                    foo: 'hidden-group',
                    group: 'b',
                    updated: new Date().toISOString(),
                    created: new Date().toISOString()
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
                    sort: '_id:asc',
                    pretty: false
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
                            group: 'a'
                        },
                        {
                            id: 2,
                            foo: 'bar',
                            group: 'a'
                        }
                    ]
                },
                statusCode: 200
            });
        });

        describe('when perserve index is set to true', () => {
            it('should be able to update the space', async () => {
                expect(spaceId).toBeTruthy();

                const uri = formatBaseUri('/data-access');
                const query = `
                    mutation {
                        updateSpace(space: {
                            id: "${spaceId}",
                            search_config: {
                                index: "hello-space",
                                connection: "default",
                                require_query: true,
                                sort_enabled: true
                                preserve_index_name: true
                            }
                        }) {
                            id,
                            search_config {
                               preserve_index_name
                            }
                        }
                    }
                `;

                expect(await request(uri, query)).toEqual({
                    updateSpace: {
                        id: spaceId,
                        search_config: {
                            preserve_index_name: true
                        }
                    }
                });
            });

            it('should be able to search a space with pretty output', async () => {
                expect(spaceId).toBeTruthy();
                expect(apiToken).toBeTruthy();

                const uri = formatBaseUri('greetings');
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
                            group: 'a',
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
