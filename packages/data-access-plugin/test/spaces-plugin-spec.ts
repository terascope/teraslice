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
import { LATEST_VERSION } from '@terascope/data-types';

describe('Spaces API', () => {
    const client = makeClient();

    const app = express();
    let listener: Server;

    const context = new TestContext('space-plugin-spec', {
        clients: [
            {
                type: 'elasticsearch',
                endpoint: 'default',
                create: () => {
                    return { client };
                },
            },
        ],
    });

    const pluginConfig: PluginConfig = {
        elasticsearch: client,
        url_base: '',
        app,
        context,
        logger: context.logger,
        server_config: {
            data_access: {
                namespace: 'test_da_space_pl',
            },
            teraserver: {
                shutdown_timeout: 1,
                plugins: [],
            },
            terafoundation: {},
        },
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

    const space1 = 'test_space1';
    const space2 = 'test_space2';
    const space3 = 'test_space3';

    const startingDate = new Date();
    const date1 = new Date(startingDate.getTime() + 1000000);
    const date2 = new Date(startingDate.getTime() + 2000000);
    const date3 = new Date(startingDate.getTime() + 3000000);

    function createTypes(obj: any) {
        const results = [];
        for (const key in obj) {
            results.push(`${key}: { type: ${obj[key].type} },`);
        }

        return `
            fields: {
                ${results.join('\n')}
            },
            version: ${LATEST_VERSION}
        `;
    }

    const space1Properties = {
        ip: { type: 'IP' },
        ipv6: { type: 'IP' },
        url: { type: 'Keyword' },
        location: { type: 'Geo' },
        id: { type: 'Keyword' },
        created: { type: 'Date' },
        bytes: { type: 'Long' },
    };

    const space2Properties = {
        ip: { type: 'IP' },
        url: { type: 'Keyword' },
        location: { type: 'Geo' },
        bytes: { type: 'Long' },
        created: { type: 'Date' },
        id: { type: 'Keyword' },
        bool: { type: 'Boolean' },
    };

    const space3Properties = {
        location: { type: 'Geo' },
        bytes: { type: 'Long' },
        wasFound: { type: 'Boolean' },
        date: { type: 'Date' },
    };

    const space1Data: any[] = [
        {
            ip: '152.223.244.212',
            ipv6: 'ab88:805e:55db:0750:b143:61ce:e07a:7180',
            url: 'http://hello.com',
            location: {
                lat: '0.05102',
                lon: '-41.82129',
            },
            id: '96669a45-3e2a-4dbe-a34e-3aeb97d1419b',
            created: '2019-04-26T08:00:23.207-07:00',
            bytes: 1234,
        },
        {
            ip: '152.113.244.212',
            ipv6: 'bb88:805e:55db:0750:b143:61ce:e07a:7180',
            url: 'http://other.com',
            location: {
                lat: '81.90873',
                lon: '-98.281',
            },
            id: '68aa96f8-372a-498d-94c4-5d05a407526e',
            created: '2019-04-26T08:07:23.207-07:00',
            bytes: 210,
        },
        {
            ip: '152.113.244.200',
            ipv6: 'cb88:805e:55db:0750:b143:61ce:e07a:7180',
            url: 'http://last.com',
            location: {
                lat: '61.90873',
                lon: '-118.281',
            },
            id: 'a0fa3951-8c12-4ccf-814f-134abaf561ae',
            created: '2019-04-26T04:07:23.207-07:00',
            bytes: 1500,
        },
    ];

    const space2Data: any[] = [
        {
            ip: '152.223.244.212',
            url: 'http://google.com',
            location: {
                lat: '0.05102',
                lon: '-41.82129',
            },
            id: '96669a45-3e2a-4dbe-a34e-3aeb97d1419b',
            created: '2019-04-26T08:00:23.207-07:00',
            bytes: 1234,
            bool: true,
        },
        {
            ip: '152.113.244.212',
            url: 'http://amazon.com',
            location: {
                lat: '81.90873',
                lon: '-98.281',
            },
            id: '68aa96f8-372a-498d-94c4-5d05a407526e',
            created: '2019-04-26T08:07:23.207-07:00',
            bytes: 210,
            bool: false,
        },
        {
            ip: '152.113.244.200',
            url: 'http://twitter.com',
            location: {
                lat: '61.90873',
                lon: '-118.281',
            },
            id: 'a0fa3951-8c12-4ccf-814f-134abaf561ae',
            created: '2019-04-26T04:07:23.207-07:00',
            bytes: 1500,
            bool: true,
        },
    ];

    const space3Data: any[] = [
        {
            location: {
                lat: '0.05102',
                lon: '-41.82129',
            },
            bytes: 1234,
            wasFound: true,
            date: date1.toISOString(),
        },
        {
            location: {
                lat: '81.90873',
                lon: '-98.281',
            },
            bytes: 210,
            wasFound: false,
            date: date2.toISOString(),
        },
        {
            location: {
                lat: '61.90873',
                lon: '-118.281',
            },
            bytes: 1500,
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
            })(),
        ]);

        await Promise.all([manager.initialize(), spaces.initialize(), search.initialize()]);

        const { api_token: adminToken } = await manager.manager.createUser(
            {
                user: {
                    client_id: 0,
                    username: 'admin',
                    firstname: 'System',
                    lastname: 'Admin',
                    email: 'admin@example.com',
                    type: 'SUPERADMIN',
                },
                password: 'admin',
            },
            false
        );

        reqClient = new GraphQLClient(formatBaseUri('/data-access'), {
            headers: {
                Authorization: `Token ${adminToken}`,
            },
        });

        // ORDER MATTERS
        manager.registerRoutes();
        spaces.registerRoutes();
        search.registerRoutes();

        spaceUrl = formatBaseUri('/spaces');

        await deleteIndices(client, [space1, space2, space3]);

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

        const req1 = reqClient.request<CreateRole>(highRoleQuery);
        const req2 = reqClient.request<CreateRole>(lowRoleQuery);
        const [
            {
                createRole: { id: highRoleId },
            },
            {
                createRole: { id: lowRoleId },
            },
        ] = await Promise.all([req1, req2]);

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
                        name: "Data Type 1",
                        config: {
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
                        name: "Data Type 2",
                        config: {
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
                        name: "Data Type 3",
                        config: {
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
            {
                createUser: { api_token: token1 },
            },
            {
                createUser: { api_token: token2 },
            },
            {
                createDataType: { id: dataType1 },
            },
            {
                createDataType: { id: dataType2 },
            },
            {
                createDataType: { id: dataType3 },
            },
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
            {
                createView: { id: view1ID },
            },
            {
                createView: { id: view2ID },
            },
            {
                createView: { id: view2BID },
            },
            {
                createView: { id: view3ID },
            },
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
                        type: SEARCH,
                        name: "Test Space 1",
                        endpoint: "${space1}",
                        data_type: "${dataType1}",
                        roles: ["${highRoleId}", "${lowRoleId}"],
                        views: ["${view1ID}"],
                        config: {
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
                        type: SEARCH,
                        name: "Test Space 2",
                        endpoint: "${space2}",
                        data_type: "${dataType2}",
                        roles: ["${highRoleId}", "${lowRoleId}"],
                        views: ["${view2ID}", "${view2BID}"],
                        config: {
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
                        type: SEARCH,
                        name: "Test Space 3",
                        endpoint: "${space3}",
                        data_type: "${dataType3}",
                        roles: ["${highRoleId}"],
                        views: ["${view3ID}"],
                        config: {
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

    afterAll(async () => {
        await Promise.all([manager.shutdown(), search.shutdown(), spaces.shutdown()]);

        await cleanupIndexes(manager.manager);
        await deleteIndices(client, [space1, space2, space3]);

        listener && listener.close();
    });

    it('queries against the endpoint without auth will fail', async () => {
        const result = await got(spaceUrl, {
            json: true,
            throwHttpErrors: false,
        });
        expect(result.statusCode).toEqual(401);
    });

    it('can query the endpoint', async () => {
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
        const [{ [space1]: results1 }, { [space2]: results2 }] = await Promise.all([
            fullRoleClient.request(query1),
            limitedRoleClient.request(query2),
        ]);

        expect(results1).toBeArrayOfSize(1);
        expect(results1[0].bytes).toBeDefined();
        expect(results1[0].bool).not.toBeDefined();

        expect(results2).toBeArrayOfSize(1);
        expect(results2[0].bytes).toBeDefined();
        expect(results2[0].bool).toBeDefined();
    });

    it('will throw if no query is provided for top level query', async () => {
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
            const {
                response: {
                    status,
                    errors: [{ message }],
                },
            } = err;
            expect(message).toEqual('Invalid request, expected query to nested');
            expect(status).toEqual(200);
        }
    });

    it('can limit fields on endpoint by role', async () => {
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
            const {
                response: { status },
            } = err;
            expect(status).toEqual(400);
        }
    });

    it('can prevent access to endpoint by role', async () => {
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
            const {
                response: { status },
            } = err;
            expect(status).toEqual(400);
        }
    });

    it('can add constraints on endpoint by role', async () => {
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

    it('can limit query on endpoint by role', async () => {
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
            const {
                response: {
                    errors: [error],
                    data,
                    status,
                },
            } = errorResponse;
            // GraphQl rule for resolver errors to be 200
            expect(status).toEqual(200);
            expect(data).toBeNull();
            expect(error.message).toEqual('Field created in query is restricted');
        }
    });

    it('can handle dates/ip/geo queries', async () => {
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

        const locationQuery = 'location:(_geo_box_top_left_:\\"83.906320,-100.058902\\" _geo_box_bottom_right_:\\"80.813646,-97.758421\\")';
        const query3 = `
            query {
                ${space2}(query: "${locationQuery}", size: 2){
                    bytes,
                    location {
                        lat,
                        lon
                    }
                }
            }
        `;

        function getDateTime(date: string) {
            return new Date(date).getTime();
        }

        const finalResults1 = space1Data
            .filter(data => data.ipv6 === 'ab88:805e:55db:0750:b143:61ce:e07a:7180')
            .map(obj => ({ bytes: obj.bytes, url: obj.url }));

        const finalResults2 = space2Data
            .filter(data => getDateTime(data.created) >= getDateTime('2019-04-26T08:00:00.000-07:00'))
            .map(obj => ({ bytes: obj.bytes, bool: obj.bool }));

        const finalResults3 = space2Data
            .filter(data => data.location.lat === '81.90873')
            .map(obj => ({ bytes: obj.bytes, location: obj.location }));

        const [
            // @ts-ignore
            { [space1]: results1 },
            // @ts-ignore
            { [space2]: results2 },
            // @ts-ignore
            { [space2]: results3 },
        ] = await Promise.all([fullRoleClient.request(query1), fullRoleClient.request(query2), fullRoleClient.request(query3)]);

        expect(results1).toBeArrayOfSize(1);
        expect(results1).toEqual(finalResults1);

        expect(results2).toBeArrayOfSize(2);
        expect(results2).toEqual(finalResults2);

        expect(results3).toBeArrayOfSize(1);
        expect(results3).toEqual(finalResults3);
    });

    it('can do basic join queries', async () => {
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
                            bool: true,
                        },
                    ],
                },
                {
                    bytes: 1500,
                    [space2]: [
                        {
                            bool: true,
                        },
                    ],
                },
            ],
        };

        const queryResults = await fullRoleClient.request(query1);
        expect(queryResults).toEqual(results);
    });

    it('can do joins off different keys', async () => {
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
                        },
                    ],
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
                        },
                    ],
                },
            ],
        };

        const queryResults = await fullRoleClient.request(query1);
        expect(queryResults).toEqual(results);
    });

    it('can do joins off of itself', async () => {
        const query1 = `
                query {
                    ${space2}(query: "bytes:>=1000"){
                        bytes
                        ${space2}(join:["bytes"]){
                            bool,
                            url
                        }
                    }
                }
            `;

        const results = {
            [space2]: [
                {
                    bytes: 1234,
                    [space2]: [
                        {
                            bool: true,
                            url: 'http://google.com',
                        },
                    ],
                },
                {
                    bytes: 1500,
                    [space2]: [
                        {
                            bool: true,
                            url: 'http://twitter.com',
                        },
                    ],
                },
            ],
        };

        const queryResults = await fullRoleClient.request(query1);
        expect(queryResults).toEqual(results);
    });

    it('can combine join and query properly', async () => {
        const query1 = `
                query {
                    ${space1}(query: "bytes:>=1000"){
                        bytes
                        ${space2}(join:["bytes"], query: "bytes:>=1200 OR bool:false"){
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
                            bool: true,
                        },
                    ],
                },
                {
                    bytes: 1500,
                    [space2]: [
                        {
                            bool: true,
                        },
                    ],
                },
            ],
        };

        const queryResults = await fullRoleClient.request(query1);
        expect(queryResults).toEqual(results);
    });

    it('will error if secondary space does not have a join', async () => {
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
            const {
                response: {
                    status,
                    errors: [{ message }],
                },
            } = err;
            expect(message).toEqual('Invalid query, expected join when querying against another space');
            expect(status).toEqual(200);
        }
    });

    it('can dedup basic results', async () => {
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
                },
            ],
        };

        const queryResults = await fullRoleClient.request(query1);
        expect(queryResults).toEqual(results);
    });

    it('can dedup joined results', async () => {
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
                        },
                    ],
                },
                {
                    bytes: 1500,
                    bool: true,
                    [space3]: [
                        {
                            wasFound: true,
                        },
                    ],
                },
            ],
        };

        const queryResults = await fullRoleClient.request(query1);
        expect(queryResults).toEqual(results);
    });

    it('can join multiple times', async () => {
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
                                    date: date1.toISOString(),
                                },
                                {
                                    wasFound: true,
                                    date: date3.toISOString(),
                                },
                            ],
                        },
                    ],
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
                                    date: date1.toISOString(),
                                },
                                {
                                    wasFound: true,
                                    date: date3.toISOString(),
                                },
                            ],
                        },
                    ],
                },
            ],
        };

        const queryResults = await fullRoleClient.request(query1);
        expect(queryResults).toEqual(results);
    });
});
