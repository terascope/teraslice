import { type Client, ElasticsearchTestHelpers, getClientMetadata } from '@terascope/opensearch-client';
import { FieldType, type ClientMetadata } from '@terascope/types';
import { DataType, LATEST_VERSION } from '@terascope/data-types';
import { QueryAccess } from '../src/query-access/index.js';

const { makeClient, populateIndex, cleanupIndex } = ElasticsearchTestHelpers;

describe('ip searches', () => {
    const index = 'ip_search_';
    let client: Client;
    let clientMetadata: ClientMetadata | undefined;

    const dataType = new DataType({
        version: LATEST_VERSION,
        fields: {
            ip: { type: FieldType.IP },
            ipRange: { type: FieldType.IPRange },
            num: { type: FieldType.Number }
        }
    });

    const searchData = [
        { ip: '192.168.1.1', ipRange: '192.168.1.0/29', num: 1 },
        { ip: '192.168.1.4', ipRange: '192.168.2.0/32', num: 2 },
        // this ip below is a deprecated ipv4 masked ipv6 format, needs to be tested, bug found
        { ip: '::0.0.0.1', ipRange: '::1/128', num: 3 },
        { ip: '::1', ipRange: '172.16.0.0/12', num: 4 },
        { ip: '2001:0db8:0123:4567:89ab:cdef:1234:5678', ipRange: '2001:0db8:0123:4567:89ab:cdef:1234:0/112', num: 5 },
        { ip: '8.8.8.8', ipRange: '8.8.8.0/24', num: 6 },
        { ip: '192.168.2.1', ipRange: '8.8.2.0/23', num: 7 },
        { ip: '8.8.1.12', ipRange: '192.168.2.0/32', num: 8 },
        { ip: '2001:0db8:0123:4567:89ab:cdef:1234:0001', ipRange: '2001:0db8:0123:4567:89ab:cdef:1234:0000/113', num: 9 },
    ];

    const access = new QueryAccess(
        {
            prevent_prefix_wildcard: true,
            allow_empty_queries: true,
            type_config: dataType.toXlucene(),
            filterNilVariables: true,
            variables: undefined
        }
    );

    beforeAll(async () => {
        client = await makeClient();
        clientMetadata = getClientMetadata(client);

        await populateIndex(client, index, dataType, searchData);
    });

    afterAll(async () => {
        await cleanupIndex(client, index);
    });

    it('can match ipv4 addresses', async () => {
        const searchParams = await access.restrictSearchQuery(
            'ip:192.168.2.1',
            { ...clientMetadata }
        );

        const response = await client.search(searchParams);

        const results = response.hits.hits.map((record) => record._source);

        expect(results.length).toEqual(1);
        expect(results).toMatchObject([
            { ip: '192.168.2.1', ipRange: '8.8.2.0/23', num: 7 },
        ]);
    });

    it('can match ipv6 addresses', async () => {
        const searchParams = await access.restrictSearchQuery(
            'ip:2001:0db8:0123:4567:89ab:cdef:1234:5678',
            { ...clientMetadata }
        );

        const response = await client.search(searchParams);

        const results = response.hits.hits.map((record) => record._source);

        expect(results.length).toEqual(1);
        expect(results).toMatchObject([
            { ip: '2001:0db8:0123:4567:89ab:cdef:1234:5678', ipRange: '2001:0db8:0123:4567:89ab:cdef:1234:0/112', num: 5 },
        ]);
    });

    it('should be able to handle masked ipv4 addresses', async () => {
        const searchParams = await access.restrictSearchQuery(
            'ip:"::0.0.0.1"',
            { ...clientMetadata }
        );

        const response = await client.search(searchParams);

        const results = response.hits.hits.map((record) => record._source);

        expect(results.length).toEqual(2);
        expect(results).toMatchObject([
            { ip: '::0.0.0.1', ipRange: '::1/128', num: 3 },
            { ip: '::1', ipRange: '172.16.0.0/12', num: 4 },
        ]);
    });

    it('ip field should be able to take CIDR notation and match appropriately', async () => {
        const searchParams = await access.restrictSearchQuery(
            'ip:"192.168.1.0/29"',
            { ...clientMetadata }
        );

        const response = await client.search(searchParams);

        const results = response.hits.hits.map((record) => record._source);

        expect(results.length).toEqual(2);
        expect(results).toMatchObject([
            { ip: '192.168.1.1', ipRange: '192.168.1.0/29', num: 1 },
            { ip: '192.168.1.4', ipRange: '192.168.2.0/32', num: 2 },
        ]);
    });

    it('ip range field should be able to take CIDR notation and match appropriately', async () => {
        const searchParams = await access.restrictSearchQuery(
            'ipRange:"2001:0db8:0123:4567:89ab:cdef:1234:0/112"',
            { ...clientMetadata }
        );

        const response = await client.search(searchParams);

        const results = response.hits.hits.map((record) => record._source);

        expect(results.length).toEqual(2);
        expect(results).toMatchObject([
            { ip: '2001:0db8:0123:4567:89ab:cdef:1234:5678', ipRange: '2001:0db8:0123:4567:89ab:cdef:1234:0/112', num: 5 },
            { ip: '2001:0db8:0123:4567:89ab:cdef:1234:0001', ipRange: '2001:0db8:0123:4567:89ab:cdef:1234:0000/113', num: 9 },
        ]);
    });

    it('ip range field should be able to take an ip and match appropriately', async () => {
        // this ip is a deprecated ipv4 masked ipv6 format, needs to be tested, was bug found
        const searchParams = await access.restrictSearchQuery(
            'ipRange:"::0.0.0.1"',
            { ...clientMetadata }
        );

        const response = await client.search(searchParams);

        const results = response.hits.hits.map((record) => record._source);

        expect(results.length).toEqual(1);
        expect(results).toMatchObject([
            { ip: '::0.0.0.1', ipRange: '::1/128', num: 3 },
        ]);
    });

    it('ip range field should be able to take an ip and match appropriately with variables', async () => {
        // this ip is a deprecated ipv4 masked ipv6 format, needs to be tested, was bug found
        const searchParams = await access.restrictSearchQuery(
            'ipRange:$ip',
            {
                ...clientMetadata,
                variables: { ip: '::0.0.0.1' },
            }
        );

        const response = await client.search(searchParams);

        const results = response.hits.hits.map((record) => record._source);

        expect(results.length).toEqual(1);
        expect(results).toMatchObject([
            { ip: '::0.0.0.1', ipRange: '::1/128', num: 3 },
        ]);
    });
});
