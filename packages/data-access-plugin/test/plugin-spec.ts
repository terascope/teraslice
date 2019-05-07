import 'jest-extended';
import got from 'got';
import express from 'express';
import { Server } from 'http';
import { GraphQLClient } from 'graphql-request';
import { TestContext } from '@terascope/job-components';

import { makeClient, cleanupIndexes, deleteIndices, populateIndex } from './helpers/elasticsearch';
import { PluginConfig } from '../src/interfaces';
import ManagerPlugin from '../src/manager';
import SearchPlugin from '../src/search';
import SpacesPlugin from '../src/spaces';

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
            },
            teraserver: {
                shutdown_timeout: 1,
                plugins: [],
            },
            terafoundation: {},
        }
    };

    const manager = new ManagerPlugin(pluginConfig);
    const spaces = new SpacesPlugin(pluginConfig);
    const search = new SearchPlugin(pluginConfig);

    function formatBaseUri(uri: string = ''): string {
        // @ts-ignore because the types aren't set right
        const port = listener.address().port;

        const _uri = uri.replace(/^\//, '');
        return `http://localhost:${port}/api/v2/${_uri}`;
    }

    let reqClient: GraphQLClient;
    let adminUserId: string;

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
            spaces.initialize(),
            search.initialize(),
        ]);

        const adminUser = await manager.manager.createUser({
            user: {
                client_id: 0,
                username: 'admin',
                firstname: 'System',
                lastname: 'Admin',
                email: 'admin@example.com',
                type: 'SUPERADMIN'
            },
            password: 'admin'
        }, false);
        adminUserId = adminUser.id;

        reqClient = new GraphQLClient(formatBaseUri('/data-access'), {
            headers: {
                Authorization: `Basic ${Buffer.from('admin:admin').toString('base64')}`,
            },
        });

        // ORDER MATTERS
        manager.registerRoutes();
        spaces.registerRoutes();
        search.registerRoutes();
    });

    afterAll(async () => {
        await Promise.all([
            manager.shutdown(),
            search.shutdown(),
            spaces.shutdown()
        ]);

        await cleanupIndexes(manager.manager);

        listener && listener.close();
    });

    // let userId: string;
    // let apiToken: string;
    // let newApiToken: string;
    // let roleId: string;
    // let spaceId: string;
    // let viewId: string;
    // let dataTypeId: string;

    // describe('when using the management api', () => {
    //     it('should be able to create a role', async () => {
    //         const query = `
    //             mutation {
    //                 createRole(role: {
    //                     name: "greeter",
    //                     client_id: 1,
    //                 }) {
    //                     id,
    //                     name,
    //                 }
    //             }
    //         `;

    //         const { createRole } = await reqClient.request(query);
    //         roleId = createRole.id;
    //         expect(roleId).toBeTruthy();

    //         expect(createRole).toMatchObject({
    //             name: 'greeter',
    //         });
    //     });

    //     it('should be able to create a data type', async () => {
    //         const query = `
    //             mutation {
    //                 createDataType(dataType: {
    //                     client_id: 1,
    //                     name: "Greeter",
    //                     type_config: {
    //                         created: "date",
    //                         updated: "date"
    //                     }
    //                 }) {
    //                     id,
    //                     name,
    //                     type_config
    //                 }
    //             }
    //         `;

    //         const { createDataType } = await reqClient.request(query);

    //         dataTypeId = createDataType.id;
    //         expect(dataTypeId).toBeTruthy();

    //         expect(createDataType).toMatchObject({
    //             name: 'Greeter',
    //             type_config: {
    //                 created: 'date',
    //                 updated: 'date'
    //             },
    //         });
    //     });

    //     it('should be able to create a view', async () => {
    //         expect(roleId).toBeTruthy();
    //         expect(dataTypeId).toBeTruthy();

    //         const query = `
    //             mutation {
    //                 createView(view: {
    //                     client_id: 1,
    //                     name: "greetings-admin",
    //                     data_type: "${dataTypeId}",
    //                     excludes: ["created", "updated"],
    //                     constraint: "group:a",
    //                     roles: ["${roleId}"]
    //                 }) {
    //                     id,
    //                     name
    //                 }
    //             }
    //         `;

    //         const { createView } = await reqClient.request(query);

    //         viewId = createView.id;
    //         expect(viewId).toBeTruthy();

    //         expect(createView).toMatchObject({
    //             name: 'greetings-admin',
    //         });
    //     });

    //     it('should be able to create a space', async () => {
    //         expect(roleId).toBeTruthy();
    //         expect(dataTypeId).toBeTruthy();
    //         expect(viewId).toBeTruthy();

    //         const query = `
    //             mutation {
    //                 createSpace(space: {
    //                     client_id: 1,
    //                     name: "Greetings Space",
    //                     endpoint: "greetings",
    //                     data_type: "${dataTypeId}",
    //                     roles: ["${roleId}"],
    //                     views: ["${viewId}"],
    //                     search_config: {
    //                         index: "hello-space",
    //                         connection: "other",
    //                         require_query: true,
    //                         sort_enabled: true
    //                     }
    //                 }) {
    //                     id,
    //                     name,
    //                     endpoint,
    //                     search_config {
    //                         index,
    //                         connection,
    //                         require_query,
    //                         sort_enabled
    //                     }
    //                 }
    //             }
    //         `;

    //         const { createSpace } = await reqClient.request(query);

    //         spaceId = createSpace.id;
    //         expect(spaceId).toBeTruthy();

    //         expect(createSpace).toMatchObject({
    //             name: 'Greetings Space',
    //             endpoint: 'greetings',
    //             search_config: {
    //                 require_query: true,
    //                 sort_enabled: true,
    //                 index: 'hello-space',
    //                 connection: 'other'
    //             }
    //         });
    //     });

    //     it('should be able to create a user', async () => {
    //         expect(roleId).toBeTruthy();

    //         const query = `
    //             mutation {
    //                 createUser(user: {
    //                     client_id: 1,
    //                     username: "hello",
    //                     firstname: "hi",
    //                     lastname: "hello",
    //                     email: "hi@example.com",
    //                     role: "${roleId}",
    //                     type: SUPERADMIN
    //                 }, password: "greeting") {
    //                     id,
    //                     username,
    //                     email,
    //                     api_token,
    //                     type
    //                 }
    //             }
    //         `;

    //         const { createUser } = await reqClient.request(query);

    //         userId = createUser.id;
    //         expect(userId).toBeTruthy();
    //         apiToken = createUser.api_token;
    //         expect(apiToken).toBeTruthy();

    //         expect(createUser).toMatchObject({
    //             username: 'hello',
    //             email: 'hi@example.com',
    //             type: 'SUPERADMIN'
    //         });
    //     });

    //     it('should be able to find records', async () => {
    //         expect(userId).toBeTruthy();
    //         expect(spaceId).toBeTruthy();
    //         expect(viewId).toBeTruthy();
    //         expect(dataTypeId).toBeTruthy();

    //         const query = `
    //             query {
    //                 roles(query: "*") {
    //                     client_id,
    //                     id,
    //                     name
    //                 }
    //                 users(query: "*") {
    //                     client_id,
    //                     id,
    //                     username,
    //                     firstname,
    //                     lastname
    //                 }
    //                 spaces(query: "*") {
    //                     client_id,
    //                     id,
    //                     name
    //                 }
    //                 dataTypes(query: "*") {
    //                     client_id,
    //                     id,
    //                     name
    //                 }
    //                 views(query: "*") {
    //                     client_id,
    //                     id,
    //                     name,
    //                     excludes
    //                 }
    //             }
    //         `;

    //         expect(await reqClient.request(query)).toEqual({
    //             roles: [
    //                 {
    //                     client_id: 1,
    //                     id: roleId,
    //                     name: 'greeter',
    //                 }
    //             ],
    //             users: [
    //                 {
    //                     client_id: 0,
    //                     id: adminUserId,
    //                     username: 'admin',
    //                     firstname: 'System',
    //                     lastname: 'Admin',
    //                 },
    //                 {
    //                     client_id: 1,
    //                     id: userId,
    //                     username: 'hello',
    //                     firstname: 'hi',
    //                     lastname: 'hello',
    //                 }
    //             ],
    //             spaces: [
    //                 {
    //                     client_id: 1,
    //                     id: spaceId,
    //                     name: 'Greetings Space'
    //                 }
    //             ],
    //             dataTypes: [
    //                 {
    //                     client_id: 1,
    //                     id: dataTypeId,
    //                     name: 'Greeter'
    //                 }
    //             ],
    //             views: [
    //                 {
    //                     client_id: 1,
    //                     id: viewId,
    //                     name: 'greetings-admin',
    //                     excludes: ['created', 'updated'],
    //                 }
    //             ]
    //         });
    //     });

    //     it('should be able to find relational data', async () => {
    //         expect(userId).toBeTruthy();
    //         expect(spaceId).toBeTruthy();
    //         expect(viewId).toBeTruthy();
    //         expect(dataTypeId).toBeTruthy();

    //         const query = `
    //             query {
    //                 role(id: "${roleId}") {
    //                     spaces {
    //                         id
    //                     },
    //                     users {
    //                         id
    //                     }
    //                 }
    //                 user(id: "${userId}") {
    //                     role {
    //                         id
    //                     }
    //                 }
    //                 space(id: "${spaceId}") {
    //                     data_type {
    //                         id
    //                     },
    //                     views {
    //                         id
    //                     },
    //                     roles {
    //                         id
    //                     }
    //                 }
    //                 dataType(id: "${dataTypeId}") {
    //                     spaces {
    //                         id
    //                     },
    //                     views {
    //                         id
    //                     }
    //                 }
    //                 view(id: "${viewId}") {
    //                     roles {
    //                         id
    //                     }
    //                 }
    //             }
    //         `;

    //         expect(await reqClient.request(query)).toEqual({
    //             role: {
    //                 users: [
    //                     {
    //                         id: userId,
    //                     }
    //                 ],
    //                 spaces: [
    //                     {
    //                         id: spaceId,
    //                     }
    //                 ]
    //             },
    //             user: {
    //                 role: {
    //                     id: roleId
    //                 }
    //             },
    //             space: {
    //                 data_type: {
    //                     id: dataTypeId,
    //                 },
    //                 views: [
    //                     {
    //                         id: viewId,
    //                     }
    //                 ],
    //                 roles: [
    //                     {
    //                         id: roleId
    //                     }
    //                 ]
    //             },
    //             dataType: {
    //                 views: [
    //                     {
    //                         id: viewId
    //                     }
    //                 ],
    //                 spaces: [
    //                     {
    //                         id: spaceId
    //                     }
    //                 ]
    //             },
    //             view: {
    //                 roles: [
    //                     {
    //                         id: roleId
    //                     }
    //                 ]
    //             },
    //         });
    //     });
    // });

    it('should be able to count records', async () => {
        const query = `
            query {
                rolesCount,
                usersCount,
                spacesCount,
                dataTypesCount,
                viewsCount
            }
        `;

        expect(await reqClient.request(query)).toEqual({
            rolesCount: 1,
            usersCount: 2,
            spacesCount: 1,
            dataTypesCount: 1,
            viewsCount: 1,
        });
    });

    // describe('when using the api', () => {
    //     it('should return a 401 if no credentials are used', async () => {
    //         const uri = formatBaseUri();
    //         const result = await got(uri, {
    //             json: true,
    //             throwHttpErrors: false
    //         });
    //         expect(result.statusCode).toEqual(401);
    //     });

    //     it('should be able to authenticate with a api_token', async () => {
    //         expect(apiToken).toBeTruthy();

    //         const uri = formatBaseUri();

    //         const result = await got(uri, {
    //             query: {
    //                 token: apiToken
    //             },
    //             json: true,
    //             throwHttpErrors: false
    //         });

    //         expect(result.statusCode).toEqual(204);
    //     });

    //     it('should be able to update a user\'s password', async () => {
    //         expect(userId).toBeTruthy();

    //         const query = `
    //             mutation {
    //                 updatePassword(id: "${userId}", password: "bananas")
    //                 updateToken(id: "${userId}")
    //             }
    //         `;

    //         const result: any = await reqClient.request(query);
    //         expect(result.updatePassword).toBeTrue();
    //         expect(result.updateToken).not.toBe(apiToken);

    //         newApiToken = result.updateToken;
    //         expect(newApiToken).toBeTruthy();
    //     });

    //     it('should return a 403 when using the outdated apiToken', async () => {
    //         expect(newApiToken).toBeTruthy();
    //         expect(apiToken).toBeTruthy();

    //         const uri = formatBaseUri();
    //         const result = await got(uri, {
    //             query: {
    //                 token: apiToken
    //             },
    //             json: true,
    //             throwHttpErrors: false
    //         });

    //         expect(result.statusCode).toEqual(403);
    //         apiToken = newApiToken;
    //     });
    // });

    // describe('when searching a space', () => {
    //     const index = 'hello-space';

    //     beforeAll(async () => {
    //         await client.indices.delete({
    //             index,
    //             requestTimeout: 1000,
    //             ignoreUnavailable: true,
    //         });

    //         await client.indices.create({
    //             index,
    //             waitForActiveShards: 'all',
    //             body: {
    //                 settings: {
    //                     'index.number_of_shards': 1,
    //                     'index.number_of_replicas': 0
    //                 },
    //                 mappings: {
    //                     hello: {
    //                         _all: {
    //                             enabled: false
    //                         },
    //                         dynamic: false,
    //                         properties: {
    //                             id: {
    //                                 type: 'keyword'
    //                             },
    //                             foo: {
    //                                 type: 'keyword'
    //                             },
    //                             group: {
    //                                 type: 'keyword'
    //                             },
    //                             created: {
    //                                 type: 'date'
    //                             },
    //                             updated: {
    //                                 type: 'date'
    //                             }
    //                         }
    //                     }
    //                 },
    //             }
    //         });

    //         await client.create({
    //             index,
    //             type: 'hello',
    //             id: '1',
    //             refresh: true,
    //             body: {
    //                 id: 1,
    //                 foo: 'bar',
    //                 group: 'a',
    //                 updated: new Date().toISOString(),
    //                 created: new Date().toISOString()
    //             },
    //         });

    //         await client.create({
    //             index,
    //             type: 'hello',
    //             id: '2',
    //             refresh: true,
    //             body: {
    //                 id: 2,
    //                 foo: 'bar',
    //                 group: 'a',
    //                 updated: new Date().toISOString(),
    //                 created: new Date().toISOString()
    //             },
    //         });

    //         await client.create({
    //             index,
    //             type: 'hello',
    //             id: '3',
    //             refresh: true,
    //             body: {
    //                 id: 3,
    //                 foo: 'baz',
    //                 group: 'a',
    //                 updated: new Date().toISOString(),
    //                 created: new Date().toISOString()
    //             },
    //         });

    //         await client.create({
    //             index,
    //             type: 'hello',
    //             id: '4',
    //             refresh: true,
    //             body: {
    //                 id: 4,
    //                 foo: 'hidden-group',
    //                 group: 'b',
    //                 updated: new Date().toISOString(),
    //                 created: new Date().toISOString()
    //             },
    //         });
    //     });

    //     afterAll(async () => {
    //         await client.indices.delete({
    //             index,
    //             requestTimeout: 3000,
    //             ignoreUnavailable: true,
    //         });
    //     });

    //     it('should be able to search a space', async () => {
    //         expect(spaceId).toBeTruthy();
    //         expect(apiToken).toBeTruthy();

    //         const uri = formatBaseUri(spaceId);
    //         const result = await got(uri, {
    //             query: {
    //                 token: apiToken,
    //                 q: 'foo:bar',
    //                 sort: '_id:asc',
    //                 pretty: false
    //             },
    //             json: true,
    //             throwHttpErrors: false
    //         });

    //         expect(result).toMatchObject({
    //             body: {
    //                 info: '2 results found.',
    //                 total: 2,
    //                 returning: 2,
    //                 results: [
    //                     {
    //                         id: 1,
    //                         foo: 'bar',
    //                         group: 'a'
    //                     },
    //                     {
    //                         id: 2,
    //                         foo: 'bar',
    //                         group: 'a'
    //                     }
    //                 ]
    //             },
    //             statusCode: 200
    //         });
    //     });

    //     it('should be able handle a search error', async () => {
    //         expect(spaceId).toBeTruthy();
    //         expect(apiToken).toBeTruthy();

    //         const uri = formatBaseUri(spaceId);
    //         const result = await got(uri, {
    //             query: {
    //                 token: apiToken,
    //                 q: '',
    //                 sort: '_id:asc',
    //                 pretty: false
    //             },
    //             json: true,
    //             throwHttpErrors: false
    //         });

    //         expect(result).toMatchObject({
    //             body: {
    //                 error: 'Invalid q parameter, must not be empty, was given: \"\"',
    //                 debug: {
    //                     message: 'Invalid q parameter, must not be empty, was given: \"\"',
    //                     statusCode: 422
    //                 }
    //             },
    //             statusCode: 422
    //         });
    //     });

    //     describe('when perserve index is set to true', () => {
    //         it('should be able to update the space', async () => {
    //             expect(spaceId).toBeTruthy();

    //             const query = `
    //                 mutation {
    //                     updateSpace(space: {
    //                         id: "${spaceId}",
    //                         search_config: {
    //                             index: "hello-space",
    //                             connection: "default",
    //                             require_query: true,
    //                             sort_enabled: true
    //                             preserve_index_name: true
    //                         }
    //                     }) {
    //                         id,
    //                         search_config {
    //                            preserve_index_name
    //                         }
    //                     }
    //                 }
    //             `;

    //             expect(await reqClient.request(query)).toEqual({
    //                 updateSpace: {
    //                     id: spaceId,
    //                     search_config: {
    //                         preserve_index_name: true
    //                     }
    //                 }
    //             });
    //         });

    //         it('should be able to search a space with pretty output', async () => {
    //             expect(spaceId).toBeTruthy();
    //             expect(apiToken).toBeTruthy();

    //             const uri = formatBaseUri('greetings');
    //             const result = await got(uri, {
    //                 query: {
    //                     token: apiToken,
    //                     q: 'foo:baz',
    //                     pretty: true
    //                 },
    //                 throwHttpErrors: false
    //             });

    //             const expected = JSON.stringify({
    //                 info: '1 results found.',
    //                 total: 1,
    //                 returning: 1,
    //                 results: [
    //                     {
    //                         foo: 'baz',
    //                         id: 3,
    //                         group: 'a',
    //                         _index: index,
    //                     }
    //                 ]
    //             }, null, 2);

    //             expect(result.body).toEqual(expected);
    //             expect(result.statusCode).toEqual(200);
    //         });
    //     });
    // });

    // it('should be able to remove everything', async () => {
    //     expect(userId).toBeTruthy();
    //     expect(roleId).toBeTruthy();
    //     expect(spaceId).toBeTruthy();

    //     const query = `
    //         mutation {
    //             removeSpace(id: "${spaceId}")
    //             removeRole(id: "${roleId}")
    //             removeUser(id: "${userId}")
    //         }
    //     `;

    //     expect(await reqClient.request(query)).toEqual({
    //         removeSpace: true,
    //         removeRole: true,
    //         removeUser: true
    //     });
    // });

    describe('Spaces api', () => {
        const space1 = 'test_space1';
        const space2 = 'test_space2';
        const space3 = 'test_space3';

        const startingDate = new Date();
        const date1 = new Date(startingDate.getTime() + 1000000);
        const date2 = new Date(startingDate.getTime() + 2000000);
        const date3 = new Date(startingDate.getTime() + 3000000);

        // TODO: this needa a better story
        function createTypes(obj: any) {
            const xluceneSpecialTypes = { geo_point: 'geo' };
            const results = [];
            for (const key in obj) {
                const value = obj[key].type;
                const type = xluceneSpecialTypes[value] || value;
                results.push(` ${key}: "${type}" `);
            }
            return results.join(',');
        }

        const space1Properties = {
            ip: { type: 'ip' },
            ipv6: { type: 'ip' },
            url: { type: 'keyword' },
            location: { type: 'geo_point' },
            id: { type: 'keyword' },
            created: { type: 'date' },
            bytes: { type: 'long' },
        };

        const space2Properties = {
            ip: { type: 'ip' },
            url: { type: 'keyword' },
            location: { type: 'geo_point' },
            bytes: { type: 'long' },
            created: { type: 'date' },
            id: { type: 'keyword' },
            bool: { type: 'boolean' }
        };

        const space3Properties = {
            location: { type: 'geo_point' },
            bytes: { type: 'long' },
            wasFound: { type: 'boolean' },
            date: { type: 'date' },
        };

        const space1Data: any[] = [
            {
                ip : '152.223.244.212',
                ipv6 : 'ab88:805e:55db:0750:b143:61ce:e07a:7180',
                url : 'http://hello.com',
                location : '0.05102, -41.82129',
                id : '96669a45-3e2a-4dbe-a34e-3aeb97d1419b',
                created : '2019-04-26T08:00:23.207-07:00',
                bytes : 1234
            },
            {
                ip : '152.113.244.212',
                ipv6 : 'bb88:805e:55db:0750:b143:61ce:e07a:7180',
                url : 'http://other.com',
                location : '81.90873, -98.281',
                id : '68aa96f8-372a-498d-94c4-5d05a407526e',
                created : '2019-04-26T08:07:23.207-07:00',
                bytes : 210
            },
            {
                ip : '152.113.244.200',
                ipv6 : 'cb88:805e:55db:0750:b143:61ce:e07a:7180',
                url : 'http://last.com',
                location : '61.90873, -118.281',
                id : 'a0fa3951-8c12-4ccf-814f-134abaf561ae',
                created : '2019-04-26T04:07:23.207-07:00',
                bytes : 1500
            },
        ];

        const space2Data: any[] = [
            {
                ip : '152.223.244.212',
                url : 'http://google.com',
                location : '0.05102, -41.82129',
                id : '96669a45-3e2a-4dbe-a34e-3aeb97d1419b',
                created : '2019-04-26T08:00:23.207-07:00',
                bytes : 1234,
                bool: true
            },
            {
                ip : '152.113.244.212',
                url : 'http://amazon.com',
                location : '81.90873, -98.281',
                id : '68aa96f8-372a-498d-94c4-5d05a407526e',
                created : '2019-04-26T08:07:23.207-07:00',
                bytes : 210,
                bool: false,
            },
            {
                ip : '152.113.244.200',
                url : 'http://twitter.com',
                location : '61.90873, -118.281',
                id : 'a0fa3951-8c12-4ccf-814f-134abaf561ae',
                created : '2019-04-26T04:07:23.207-07:00',
                bytes : 1500,
                bool: true
            },
        ];

        const space3Data: any[] = [
            {
                location : '0.05102, -41.82129',
                bytes : 1234,
                wasFound: true,
                date: date1.toISOString(),
            },
            {
                location : '81.90873, -98.281',
                bytes : 210,
                wasFound: false,
                date: date2.toISOString(),
            },
            {
                location : '61.90873, -118.281',
                bytes : 1500,
                wasFound: true,
                date: date3.toISOString(),
            },
        ];

        let spaceUrl: string;
        let fullRoleClient: GraphQLClient;
        let limitedRoleClient: GraphQLClient;

        function createGQLClient(token: string) {
            return new GraphQLClient(spaceUrl, {
                headers: {
                    Authorization: `Token ${token}`,
                },
            });
        }

        beforeAll(async () => {

            spaceUrl = formatBaseUri('/spaces');

            await deleteIndices(client, [space1, space2]);

            await Promise.all([
                populateIndex(client, space1, space1Properties, space1Data),
                populateIndex(client, space2, space2Properties, space2Data),
                populateIndex(client, space3, space3Properties, space3Data),
            ]);

            const highRoleQuery = `
                mutation {
                    createRole(role: {
                        name: "high",
                        client_id: 1,
                    }) {
                        id,
                        name,
                    }
                }
            `;

            const lowRoleQuery = `
                mutation {
                    createRole(role: {
                        name: "low",
                        client_id: 1,
                    }) {
                        id,
                        name,
                    }
                }
            `;

            interface CreateRole {
                createRole: {
                    id: string;
                };
            }

            const [
                { createRole: { id:  highRoleId } },
                { createRole: { id: lowRoleId } }
            ] = await Promise.all([
                reqClient.request<CreateRole>(highRoleQuery),
                reqClient.request<CreateRole>(lowRoleQuery),
            ]);

            const user1Query = `
                mutation {
                    createUser(
                        user:{
                            client_id: 1,
                            username:"billy",
                            email:"billy@example.com",
                            firstname:"Billy",
                            lastname:"Joe",
                            role: "${highRoleId}",
                            type: ADMIN,
                        },
                        password: "password"
                    ){
                        id,
                        api_token
                    }
                }
            `;

            const user2Query = `
                mutation {
                    createUser(
                        user:{
                            client_id: 1,
                            username:"jimmy",
                            email:"jimmy@example.com",
                            firstname:"Jimmy",
                            lastname:"Dean",
                            role: "${lowRoleId}",
                            type: USER,
                        },
                        password: "password"
                    ){
                        id,
                        api_token
                    }
                }
            `;

            const dataTypeSpace1 = `
                mutation {
                    createDataType(
                        dataType:{
                            client_id: 1,
                            name: "Data Type 1"
                            type_config: {
                                ${createTypes(space1Properties)}
                            }
                    }){
                        id,
                    }
                }
            `;

            const dataTypeSpace2 = `
                mutation {
                    createDataType(
                        dataType:{
                            client_id: 1,
                            name: "Data Type 2"
                            type_config: {
                                ${createTypes(space2Properties)}
                            }
                    }){
                        id,
                    }
                }
            `;

            const dataTypeSpace3 = `
                mutation {
                    createDataType(
                        dataType:{
                            client_id: 1,
                            name: "Data Type 3"
                            type_config: {
                                ${createTypes(space3Properties)}
                            }
                    }){
                        id,
                    }
                }
            `;

            interface CreateUser {
                createUser: {
                    id: string;
                    api_token: string;
                };
            }

            interface CreateDataType {
                createDataType: {
                    id: string;
                };
            }

            const [
                { createUser: { api_token: token1 } },
                { createUser: { api_token: token2 } },
                { createDataType: { id:  dataType1 } },
                { createDataType: { id:  dataType2 } },
                { createDataType: { id:  dataType3 } },
            ] = await Promise.all([
                reqClient.request<CreateUser>(user1Query),
                reqClient.request<CreateUser>(user2Query),
                reqClient.request<CreateDataType>(dataTypeSpace1),
                reqClient.request<CreateDataType>(dataTypeSpace2),
                reqClient.request<CreateDataType>(dataTypeSpace3),
            ]);

            const view1Query = `
                mutation {
                    createView(
                        view:{
                            client_id: 1,
                            name: "Test View 1",
                            data_type: "${dataType1}",
                            includes: [],
                            excludes: [],
                            roles: ["${highRoleId}", "${lowRoleId}"],
                            constraint:""
                        }
                    ){
                        id
                    }
                }
            `;
              // only "high" role has full access
            const view2Query = `
                mutation {
                    createView(
                        view:{
                            client_id: 1,
                            name: "Test View 2",
                            data_type: "${dataType2}",
                            includes: [],
                            excludes: [],
                            roles: ["${highRoleId}"],
                            constraint:""
                        }
                    ){
                        id
                    }
                }
            `;
            // "low" role has limited access
            const view2BQuery = `
                mutation {
                    createView(
                        view:{
                            client_id: 1,
                            name: "Test View 2B",
                            data_type: "${dataType2}",
                            includes: ["url", "bytes", "bool", "ip"],
                            excludes: [],
                            roles: ["${lowRoleId}"],
                            constraint: "bytes:>=1300"
                        }
                    ){
                        id
                    }
                }
            `;
            // low role has no access
            const view3Query = `
                mutation {
                    createView(
                        view:{
                            client_id: 1,
                            name: "Test View 3",
                            data_type: "${dataType3}",
                            includes: [],
                            excludes: [],
                            roles: ["${highRoleId}"],
                            constraint:""
                        }
                    ){
                        id
                    }
                }
            `;

            interface CreateView {
                createView: {
                    id: string;
                };
            }

            const [
                { createView: { id:  view1ID } },
                { createView: { id:  view2ID } },
                { createView: { id:  view2BID } },
                { createView: { id:  view3ID } },
            ] = await Promise.all([
                reqClient.request<CreateView>(view1Query),
                reqClient.request<CreateView>(view2Query),
                reqClient.request<CreateView>(view2BQuery),
                reqClient.request<CreateView>(view3Query),
            ]);

            const space1Query = `
                mutation {
                    createSpace(
                        space: {
                            client_id: 1,
                            name: "Test Space 1",
                            endpoint: "${space1}",
                            data_type: "${dataType1}",
                            roles: ["${highRoleId}", "${lowRoleId}"],
                            views: ["${view1ID}"],
                            search_config: {
                                index:"${space1}",
                                require_query: true
                            },
                        }
                    ){
                        id
                    }
                }
            `;

            const space2Query = `
                mutation {
                    createSpace(
                        space: {
                            client_id: 1,
                            name: "Test Space 2",
                            endpoint: "${space2}",
                            data_type: "${dataType2}",
                            roles: ["${highRoleId}", "${lowRoleId}"],
                            views: ["${view2ID}", "${view2BID}"],
                            search_config: {
                                index:"${space2}",
                                require_query: true
                            },
                        }
                    ){
                        id
                    }
                }
            `;

            const space3Query = `
                mutation {
                    createSpace(
                        space: {
                            client_id: 1,
                            name: "Test Space 3",
                            endpoint: "${space3}",
                            data_type: "${dataType3}",
                            roles: ["${highRoleId}"],
                            views: ["${view3ID}"],
                            search_config: {
                                index:"${space3}",
                                require_query: true
                            },
                        }
                    ){
                        id
                    }
                }
            `;

            await Promise.all([reqClient.request(space1Query), reqClient.request(space2Query), reqClient.request(space3Query)]);

            fullRoleClient = createGQLClient(token1);
            limitedRoleClient = createGQLClient(token2);
        });

        it('queries against the endpoint without auth will fail', async() => {
            const result = await got(spaceUrl, {
                json: true,
                throwHttpErrors: false
            });
            expect(result.statusCode).toEqual(401);
        });

        it('can query the endpoint', async() => {
            const query1 = `
                query {
                    ${space1}(query: "*", size: 1){
                        bytes
                    }
                }
            `;

            const query2 = `
                query {
                    ${space2}(query: "*", size: 1){
                        bytes,
                        bool
                    }
                }
            `;
            // @ts-ignore
            const [{ [space1]: results1 }, { [space2]: results2 }] = await Promise.all([fullRoleClient.request(query1), limitedRoleClient.request(query2)]);

            expect(results1).toBeArrayOfSize(1);
            expect(results1[0].bytes).toBeDefined();
            expect(results1[0].bool).not.toBeDefined();

            expect(results2).toBeArrayOfSize(1);
            expect(results2[0].bytes).toBeDefined();
            expect(results2[0].bool).toBeDefined();
        });

        it('will throw if no query is provided for top level query', async() => {
            expect.hasAssertions();

            const query = `
                query {
                    ${space1}(size: 1){
                        bytes
                    }
                }
            `;

            try {
                await fullRoleClient.request(query);
            } catch (err) {
                const { response: { status, errors: [{ message }] } } = err;
                expect(message).toEqual('a query must be provided for the root query');
                expect(status).toEqual(200);
            }
        });

        it('can limit fields on endpoint by role', async() => {
            // location is not accessible by this role
            const query = `
                query {
                    ${space2}(query: "*", size: 1){
                        bytes,
                        bool,
                        location
                    }
                }
            `;

            try {
                await limitedRoleClient.request(query);
            } catch (err) {
                const { response: { status } } = err;
                expect(status).toEqual(400);
            }
        });

        it('can prevent access to endpoint by role', async() => {
            expect.hasAssertions();

            const query = `
                query {
                    ${space3}(query: "*", size: 1){
                        bytes,
                        bool
                    }
                }
            `;

            try {
                await limitedRoleClient.request(query);
            } catch (err) {
                const { response: { status } } = err;
                expect(status).toEqual(400);
            }
        });

        it('can add constraints on endpoint by role', async() => {
            // it is constrained to bytes:>=1300
            const query = `
                query {
                    ${space2}(query: "*"){
                        bytes,
                        bool,
                    }
                }
             `;

            const { [space2]: results } = await limitedRoleClient.request(query);

            expect(results).toBeArrayOfSize(1);
            expect(results[0]).toEqual({ bytes: 1500, bool: true });
        });

        it('can limit query on endpoint by role', async() => {
            // created is not allowed to be searched
            const query = `
                query {
                    ${space2}(query: "created:2019-04-26T08:07:23.207-07:00"){
                        bytes,
                        bool,
                    }
                }
            `;
            try {
                await limitedRoleClient.request(query);
            } catch (errorResponse) {
                const { response: { errors: [error], data, status } } = errorResponse;
                // GraphQl rule for resolver errors to be 200
                expect(status).toEqual(200);
                expect(data).toBeNull();
                expect(error.message).toEqual('Field created in query is restricted');
            }
        });

        it('can handle dates/ip/geo queries', async() => {
            const query1 = `
                query {
                    ${space1}(query: "ipv6:ab88:805e:55db:0750:b143:61ce:e07a:7180" , size: 1){
                        bytes
                        url
                    }
                }
            `;

            const query2 = `
                query {
                    ${space2}(query: "created:>=2019-04-26T08:00:00.000-07:00", size: 2){
                        bytes,
                        bool
                    }
                }
            `;

            const query3 = `
                query {
                    ${space2}(query: "location:(_geo_box_top_left_:\\"83.906320,-100.058902\\" _geo_box_bottom_right_:\\"80.813646,-97.758421\\")", size: 2){
                        bytes,
                        location
                    }
                }
            `;

            function getDateTime(date: string) {
                return new Date(date).getTime();
            }

            const finalResults1 = space1Data
                .filter((data) => data.ipv6 === 'ab88:805e:55db:0750:b143:61ce:e07a:7180')
                .map((obj) => ({ bytes: obj.bytes, url: obj.url }));

            const finalResults2 = space2Data
                .filter((data) => getDateTime(data.created) >= getDateTime('2019-04-26T08:00:00.000-07:00'))
                .map((obj) => ({ bytes: obj.bytes, bool: obj.bool }));

            const finalResults3 = space2Data
                .filter((data) => data.location === '81.90873, -98.281')
                .map((obj) => ({ bytes: obj.bytes, location: obj.location }));

            const [
            // @ts-ignore
            { [space1]: results1 },
            // @ts-ignore
            { [space2]: results2 },
             // @ts-ignore
            { [space2]: results3 },
            ] = await Promise.all([
                fullRoleClient.request(query1),
                fullRoleClient.request(query2),
                fullRoleClient.request(query3),
            ]);

            expect(results1).toBeArrayOfSize(1);
            expect(results1).toEqual(finalResults1);

            expect(results2).toBeArrayOfSize(2);
            expect(results2).toEqual(finalResults2);

            expect(results3).toBeArrayOfSize(1);
            expect(results3).toEqual(finalResults3);
        });

        it('can do basic join queries', async() => {
            const query1 = `
                query {
                    ${space1}(query: "bytes:>=1000"){
                        bytes
                        ${space2}(join:["bytes"]){
                            bool
                        }
                    }
                }
            `;

            const results = {
                [space1]: [
                    {
                        bytes: 1234,
                        [space2]: [
                            {
                                bool: true
                            }
                        ]
                    },
                    {
                        bytes: 1500,
                        [space2]: [
                            {
                                bool: true
                            }
                        ]
                    }
                ]
            };

            const queryResults = await fullRoleClient.request(query1);
            expect(queryResults).toEqual(results);
        });

        it('can do joins off different keys', async() => {
            const query1 = `
                query {
                    ${space2}(query: "bytes:>=1000"){
                        bytes
                        bool
                        ${space3}(join:["bool:wasFound"]){
                            wasFound
                            date
                        }
                    }
                }
            `;

            const results = {
                [space2]: [
                    {
                        bytes: 1234,
                        bool: true,
                        [space3]: [
                            {
                                wasFound: true,
                                date: date1.toISOString(),
                            },
                            {
                                wasFound: true,
                                date: date3.toISOString(),
                            }
                        ]
                    },
                    {
                        bytes: 1500,
                        bool: true,
                        [space3]: [
                            {
                                wasFound: true,
                                date: date1.toISOString(),
                            },
                            {
                                wasFound: true,
                                date: date3.toISOString(),
                            }
                        ]
                    }
                ]
            };

            const queryResults = await fullRoleClient.request(query1);
            expect(queryResults).toEqual(results);
        });

        it('will error if secondary space does not have a join', async() => {
            const query = `
                query {
                    ${space1}(query: "bytes:>=1000"){
                        bytes
                        ${space2}(query: "*", size: 1){
                            bool
                        }
                    }
                }
            `;

            try {
                await fullRoleClient.request(query);
            } catch (err) {
                const { response: { status, errors: [{ message }] } } = err;
                expect(message).toEqual('a join must be provided when querying a space against another space');
                expect(status).toEqual(200);
            }
        });

        it('can dedup basic results', async() => {
            const query1 = `
                query {
                    ${space2}(query: "bytes:>=1000"){
                        bool
                    }
                }
            `;

            const results = {
                [space2]: [
                    {
                        bool: true,
                    }
                ]
            };

            const queryResults = await fullRoleClient.request(query1);
            expect(queryResults).toEqual(results);
        });

        it('can dedup joined results', async() => {
            const query1 = `
                query {
                    ${space2}(query: "bytes:>=1000"){
                        bytes
                        bool
                        ${space3}(join:["bool:wasFound"]){
                            wasFound
                        }
                    }
                }
            `;

            const results = {
                [space2]: [
                    {
                        bytes: 1234,
                        bool: true,
                        [space3]: [
                            {
                                wasFound: true,
                            }
                        ]
                    },
                    {
                        bytes: 1500,
                        bool: true,
                        [space3]: [
                            {
                                wasFound: true,
                            }
                        ]
                    }
                ]
            };

            const queryResults = await fullRoleClient.request(query1);
            expect(queryResults).toEqual(results);
        });

        it('can join multiple times', async() => {
            const query1 = `
                query {
                    ${space1}(query: "bytes:>=1000"){
                        bytes,
                        ip,
                        ${space2}(join:["bytes"]) {
                            bool
                            ${space3}(join:["bool:wasFound"]){
                                wasFound,
                                date
                            }
                        }
                    }
                }
            `;

            const results = {
                [space1]: [
                    {
                        bytes: 1234,
                        ip: '152.223.244.212',
                        [space2]: [
                            {
                                bool: true,
                                [space3]: [
                                    {
                                        wasFound: true,
                                        date: date1.toISOString()
                                    },
                                    {
                                        wasFound: true,
                                        date: date3.toISOString()
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        bytes: 1500,
                        ip: '152.113.244.200',
                        [space2]: [
                            {
                                bool: true,
                                [space3]: [
                                    {
                                        wasFound: true,
                                        date: date1.toISOString()
                                    },
                                    {
                                        wasFound: true,
                                        date: date3.toISOString()
                                    }
                                ]
                            }
                        ]
                    }
                ]
            };

            const queryResults = await fullRoleClient.request(query1);
            expect(queryResults).toEqual(results);
        });

        afterAll(async () => {
            await deleteIndices(client, [space1, space2, space3]);
        });
    });
});
