import { FieldType } from '@terascope/types';
import { DataType, LATEST_VERSION } from '@terascope/data-types';
import type { QueryCase } from './interfaces.js';

/**
 * Records for the cases where what a field holds decides the match: lists, escaped wildcard
 * characters, dates written to less than a millisecond, and a query with no field next to a
 * geo field.
 *
 * `tags`, `counts` and `ips` are lists. Elasticsearch indexes each value of a list on its
 * own, so a query matches a record when any one value matches, and an empty list is the
 * same as a missing field. `03` has empty lists and `06` has nothing but its id.
 *
 * `name` holds the literal characters `*` and `?` in `01` and `07`.
 *
 * `created` puts records at the edges of 2020-01-15: its first and last millisecond
 * (`01`, `03`), the next day's first (`04`), and three inside 12:00 (`02`, `05`, `07`).
*/
export const valuesDataType = new DataType({
    version: LATEST_VERSION,
    fields: {
        id: { type: FieldType.Keyword },
        name: { type: FieldType.Keyword },
        tags: { type: FieldType.Keyword, array: true },
        counts: { type: FieldType.Integer, array: true },
        ips: { type: FieldType.IP, array: true },
        created: { type: FieldType.Date },
        location: { type: FieldType.GeoPoint },
    }
});

export const valuesTypeConfig = valuesDataType.toXlucene();

export const valuesRecords: readonly Record<string, any>[] = [
    {
        id: '01',
        name: 'Yak*',
        tags: ['Emu', 'Yak'],
        counts: [1, 5, 9],
        ips: ['10.0.0.1', '192.168.1.1'],
        created: '2020-01-15T00:00:00.000Z',
        location: { lat: 40.7, lon: -74 },
    },
    {
        id: '02',
        name: 'Yak',
        tags: ['Yak'],
        counts: [2],
        ips: ['10.0.0.9'],
        created: '2020-01-15T12:30:45.000Z',
        location: { lat: 51.5, lon: -0.12 },
    },
    {
        id: '03',
        name: 'emu',
        tags: [],
        counts: [],
        ips: [],
        created: '2020-01-15T23:59:59.999Z',
    },
    {
        id: '04',
        name: 'Eel',
        tags: ['Emu'],
        counts: [10, 20],
        created: '2020-01-16T00:00:00.000Z',
    },
    {
        id: '05',
        tags: ['emu', 'EMU'],
        counts: [5],
        ips: ['2001:db8::1'],
        created: '2020-01-15T12:00:00.000Z',
    },
    { id: '06' },
    {
        id: '07',
        name: 'Yak?',
        tags: ['a b', 'c'],
        counts: [30, 31],
        created: '2020-01-15T12:30:00.000Z',
    },
];

/** A list matches when any one of its values does, and an empty list is missing. */
export const listCases: readonly QueryCase[] = [
    ['a term on a list', 'tags:Emu', ['01', '04']],
    ['a term on a list, in its case', 'tags:emu', ['05']],
    ['a quoted term on a list', 'tags:"a b"', ['07']],
    ['either of two values of a list', 'tags:(Emu OR c)', ['01', '04', '07']],
    ['two values of one list', 'tags:Emu AND tags:Yak', ['01']],
    ['a negated term on a list', 'NOT tags:Emu', ['02', '03', '05', '06', '07']],
    ['a list with values', '_exists_:tags', ['01', '02', '04', '05', '07']],
    ['an empty list, which is missing', 'NOT _exists_:tags', ['03', '06']],
    ['a wildcard on a list', 'tags:E*', ['01', '04', '05']],
    ['a regexp on a list', 'tags:/E.u/', ['01', '04']],
    ['a number in a list', 'counts:5', ['01', '05']],
    ['a range on a list', 'counts:>9', ['04', '07']],
    ['a bounded range on a list', 'counts:[3 TO 6]', ['01', '05']],
    ['an empty number list, which is missing', 'NOT _exists_:counts', ['03', '06']],
    ['an address in a list', 'ips:"192.168.1.1"', ['01']],
    ['a CIDR block on an address list', 'ips:"10.0.0.0/24"', ['01', '02']],
    ['an IPv6 address in a list', 'ips:"2001:db8::1"', ['05']],
];

/** `\*` and `\?` are the characters themselves, not wildcards. */
export const escapedWildcardCases: readonly QueryCase[] = [
    ['an escaped *', 'name:Yak\\*', ['01']],
    ['an escaped ?', 'name:Yak\\?', ['07']],
    ['an escaped * after a wildcard', 'name:Y?k\\*', ['01']],
];

/**
 * A date term written to the day, minute or second matches that whole unit, as Elasticsearch
 * rounds it, in the term's own offset. A month is not rounded (`2020-01` is its first
 * millisecond), and neither is a time with any fraction of a second.
*/
export const datePrecisionCases: readonly QueryCase[] = [
    ['a day', 'created:2020-01-15', ['01', '02', '03', '05', '07']],
    // the parser turns a time to the hour into its first millisecond before either engine sees it
    ['an hour, which the parser makes a time', 'created:"2020-01-15T12"', ['05']],
    ['a minute', 'created:"2020-01-15T12:30"', ['02', '07']],
    ['a minute in UTC', 'created:"2020-01-15T12:30Z"', ['02', '07']],
    ['a second', 'created:"2020-01-15T12:30:45"', ['02']],
    ['a millisecond', 'created:"2020-01-15T12:30:45.000Z"', ['02']],
    ['a fraction of a second', 'created:"2020-01-15T12:30:45.5"', []],
    ['a minute in another offset', 'created:"2020-01-15T17:30+05:00"', ['02', '07']],
    ['a month, which is its first millisecond', 'created:2020-01', []],
    ['the next day', 'created:2020-01-16', ['04']],
    ['a negated day', 'NOT created:2020-01-15', ['04', '06']],
];

/** A query with no field is not compared to a geo field, which cannot hold a word. */
export const fieldlessCases: readonly QueryCase[] = [
    ['a word with a geo field in the type config', 'Emu', ['01', '04']],
];
