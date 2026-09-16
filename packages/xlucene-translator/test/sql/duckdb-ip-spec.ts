import 'jest-extended';
import { FieldType } from '@terascope/types';
import { DataType, LATEST_VERSION } from '@terascope/data-types';
import { QueryAccess } from '../../src/query-access/index.js';
import { DuckTestDB } from './duckdb-helpers.js';

/**
 * The IP queries from `test/query/ip-spec.ts`, with the SAME expectations, run against
 * DuckDB.
 *
 * **They only agree because both sides compare ADDRESSES rather than text.** Elasticsearch's
 * `ip` type normalises, so `::0.0.0.1` and `::1` are the same address and both match; a
 * string comparison would find one of them and quietly answer differently. That is the whole
 * reason these emissions go through `INET` instead of `=`.
*/
describe('ip searches (duckdb)', () => {
    const table = 'ip_search';
    let db: DuckTestDB;

    const dataType = new DataType({
        version: LATEST_VERSION,
        fields: {
            id: { type: FieldType.Keyword },
            ip: { type: FieldType.IP },
            ipRange: { type: FieldType.IPRange },
        }
    });

    const searchData = [
        { id: '1', ip: '192.168.1.1', ipRange: '192.168.1.0/29' },
        { id: '2', ip: '192.168.1.4', ipRange: '192.168.2.0/32' },
        // a deprecated ipv4-masked ipv6 format, which has found a bug before
        { id: '3', ip: '::0.0.0.1', ipRange: '::1/128' },
        { id: '4', ip: '::1', ipRange: '172.16.0.0/12' },
        { id: '5', ip: '2001:0db8:0123:4567:89ab:cdef:1234:5678', ipRange: '2001:0db8:0123:4567:89ab:cdef:1234:0/112' },
        { id: '6', ip: '8.8.8.8', ipRange: '8.8.8.0/24' },
        { id: '7', ip: '192.168.2.1', ipRange: '8.8.2.0/23' },
        { id: '8', ip: '8.8.1.12', ipRange: '192.168.2.0/32' },
        { id: '9', ip: '2001:0db8:0123:4567:89ab:cdef:1234:0001', ipRange: '2001:0db8:0123:4567:89ab:cdef:1234:0000/113' },
    ];

    const access = new QueryAccess({
        prevent_prefix_wildcard: true,
        allow_empty_queries: true,
        type_config: dataType.toXlucene(),
        filterNilVariables: true,
        variables: undefined
    });

    async function search(query: string, variables?: Record<string, any>): Promise<string[]> {
        const sql = await access.restrictSQLQuery(query, { variables, params: { table } });
        const rows = await db.run(sql);
        return rows.map((row) => row.id as string);
    }

    beforeAll(async () => {
        db = await DuckTestDB.create();
        await db.createTable(table, dataType, searchData);
    });

    afterAll(async () => {
        await db.close();
    });

    it('can match ipv4 addresses', async () => {
        await expect(search('ip:192.168.2.1')).resolves.toEqual(['7']);
    });

    it('can match ipv6 addresses', async () => {
        await expect(search('ip:2001:0db8:0123:4567:89ab:cdef:1234:5678')).resolves.toEqual(['5']);
    });

    /** `::0.0.0.1` and `::1` are the same 128-bit address, so both records match. */
    it('handles masked ipv4 addresses', async () => {
        await expect(search('ip:"::0.0.0.1"')).resolves.toEqual(['3', '4']);
    });

    it('takes CIDR notation on an ip field and matches what is inside the block', async () => {
        await expect(search('ip:"192.168.1.0/29"')).resolves.toEqual(['1', '2']);
    });

    it('does not match an address outside the block', async () => {
        await expect(search('ip:"8.8.8.0/24"')).resolves.toEqual(['6']);
    });

    /** The column holds the BLOCK here, so the containment runs the other way round. */
    it('takes an ip on an ip_range field and matches the block containing it', async () => {
        await expect(search('ipRange:"::0.0.0.1"')).resolves.toEqual(['3']);
    });

    it('takes an ip on an ip_range field through a variable', async () => {
        await expect(search('ipRange:$ip', { ip: '::0.0.0.1' })).resolves.toEqual(['3']);
    });

    /**
     * A CIDR against an `ip_range` field is an OVERLAP of two blocks, not a containment -
     * record 9's `/113` is a strict subset of the queried `/112` and still matches.
    */
    it('takes CIDR notation on an ip_range field and matches overlapping blocks', async () => {
        await expect(search('ipRange:"2001:0db8:0123:4567:89ab:cdef:1234:0/112"')).resolves.toEqual(['5', '9']);
    });

    /**
     * **An open-ended range is where a raw `INET` comparison would answer differently.**
     *
     * DuckDB orders `INET` by (family, address), so every IPv4 address sorts before every
     * IPv6 one and this query would return the IPv6 records regardless of their value.
     * Elasticsearch orders by the 128-bit value with IPv4 mapped into IPv6, where
     * `2001:db8::...` IS greater than `::ffff:192.168.2.0` and `::1` is not - which is the
     * answer asserted here, and the reason the emission maps before it compares.
    */
    it('can range over ip addresses', async () => {
        await expect(search('ip:["192.168.1.0" TO "192.168.1.255"]')).resolves.toEqual(['1', '2']);
        await expect(search('ip:>="192.168.2.0"')).resolves.toEqual(['5', '7', '9']);
        await expect(search('ip:<"::1"')).resolves.toEqual([]);
    });

    /** The mapped form is the same address, so either spelling finds the record. */
    it('finds an ipv4 address written in its mapped ipv6 form', async () => {
        await expect(search('ip:"::ffff:8.8.8.8"')).resolves.toEqual(['6']);
        await expect(search('ip:"::ffff:8.8.0.0/112"')).resolves.toEqual(['6', '8']);
    });

    it('can combine an ip query with a negation', async () => {
        await expect(search('ip:"8.8.0.0/16" AND NOT ip:8.8.8.8')).resolves.toEqual(['8']);
    });

    it('rejects a malformed address before it reaches the engine', async () => {
        await expect(search('ip:"not-an-ip"')).toReject();
    });
});
