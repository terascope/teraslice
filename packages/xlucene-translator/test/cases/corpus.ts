import { FieldType } from '@terascope/types';
import { DataType, LATEST_VERSION } from '@terascope/data-types';

/**
 * The records every parity case is answered from.
 *
 * **The missing values are the point of it.** A query that only ever sees populated fields
 * cannot tell a correct `NOT` from one that silently drops rows, and it cannot tell a range
 * that excludes an absent value from one that includes it - which are the two places SQL
 * and Elasticsearch disagree by default. So `07` and `11` have no `name`, `08` and `11` have
 * no `count`, `09` and `11` have no `active`, `10` and `11` have no `created`, and `11` has
 * nothing at all but its id.
 *
 * The rest is chosen so that boundaries are hit exactly: `count` lands on 20, 30 and 40 with
 * two records each, so `[20 TO 40]`, `{20 TO 40}` and both mixed spellings all answer
 * differently; `created` does the same with dates; and the addresses straddle IPv4 and IPv6
 * so that anything ordering by family rather than by value gives itself away.
*/
export const dataType = new DataType({
    version: LATEST_VERSION,
    fields: {
        id: { type: FieldType.Keyword },
        name: { type: FieldType.Keyword },
        count: { type: FieldType.Integer },
        active: { type: FieldType.Boolean },
        created: { type: FieldType.Date },
        ip: { type: FieldType.IP },
        net: { type: FieldType.IPRange },
    }
});

export const typeConfig = dataType.toXlucene();

export const records: readonly Record<string, any>[] = [
    {
        id: '01',
        name: 'alpha',
        count: 10,
        active: true,
        created: '2020-01-01T00:00:00.000Z',
        ip: '10.0.0.1',
        net: '10.0.0.0/30'
    },
    {
        id: '02',
        name: 'beta',
        count: 20,
        active: false,
        created: '2020-06-15T00:00:00.000Z',
        ip: '10.0.0.9',
        net: '10.0.0.8/30'
    },
    {
        id: '03',
        name: 'gamma',
        count: 30,
        active: true,
        created: '2021-01-01T00:00:00.000Z',
        ip: '192.168.1.1',
        net: '192.168.1.0/24'
    },
    {
        id: '04',
        name: 'alpha',
        count: 40,
        active: false,
        created: '2021-06-15T00:00:00.000Z',
        ip: '172.16.5.5',
        net: '172.16.0.0/12'
    },
    {
        id: '05',
        name: 'delta',
        count: 50,
        active: true,
        created: '2022-01-01T00:00:00.000Z',
        ip: '::1',
        net: '::1/128'
    },
    {
        id: '06',
        name: 'beta',
        count: 10,
        active: true,
        created: '2022-06-15T00:00:00.000Z',
        ip: '2001:db8::1',
        net: '2001:db8::/32'
    },
    // no name
    {
        id: '07',
        count: 20,
        active: false,
        created: '2023-01-01T00:00:00.000Z',
        ip: '8.8.8.8',
        net: '8.8.8.0/24'
    },
    // no count
    {
        id: '08',
        name: 'epsilon',
        active: true,
        created: '2023-06-15T00:00:00.000Z',
        ip: '8.8.4.4',
        net: '8.8.4.0/24'
    },
    // no active
    {
        id: '09',
        name: 'alpha',
        count: 30,
        created: '2024-01-01T00:00:00.000Z',
        ip: '10.0.0.17',
        net: '10.0.0.16/30'
    },
    // no created
    {
        id: '10',
        name: 'zeta',
        count: 40,
        active: false,
        ip: '192.168.2.1',
        net: '192.168.2.0/24'
    },
    // nothing at all
    { id: '11' },
    {
        id: '12',
        name: 'alpha',
        count: 50,
        active: true,
        created: '2020-01-01T00:00:00.000Z',
        ip: '10.0.0.1',
        net: '10.0.0.0/30'
    },
];

/** Every id, for the cases whose answer is "all of them". */
export const allIds: readonly string[] = records.map(({ id }) => id as string);

/** Every id but these, which is how most negations are written. */
export function allExcept(...ids: string[]): string[] {
    return allIds.filter((id) => !ids.includes(id));
}
