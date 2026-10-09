import 'jest-extended';
import { FieldType, DataTypeConfig } from '@terascope/types';
import { TealFrame, closeDuckDatabase } from '../../src/teal-frame/index.js';
import { tealFrameAdapter } from '../../src/adapters/teal-frame-adapter/index.js';
import { dataFrameAdapter } from '../../src/adapters/index.js';
import { DataFrame } from '../../src/data-frame/index.js';
import { functionConfigRepository } from '../../src/function-configs/index.js';
import { FunctionDefinitionConfig } from '../../src/function-configs/interfaces.js';

/**
 * `lookup`'s SQL emission against `DataFrame`, on every column kind it claims.
 *
 * core-utils' `lookup` is `table[key]`, so the cases are JavaScript's property-access rules: a
 * number key is its `String()`, a non-canonical key (`"01"`, `"1.50"`) never matches, an integer
 * column matches past 2^53, and an INHERITED name (`toString`, `constructor`, `__proto__`) is found
 * on every object - which the emission hands to the UDF.
*/

const repo = functionConfigRepository as Record<string, FunctionDefinitionConfig<any>>;

const OBJECT_TABLE = {
    key1: 'value1',
    8910: 1112,
    1.5: { nested: [1, 'two'] },
    '01': 'never',
    '1.50': 'never',
    NaN: 'not a number',
    Infinity: 'big',
    '9007199254740993': 'past 2^53',
    toString: 'own toString',
    empty: null,
};
const ARRAY_TABLE = ['zero', { one: 1 }, null, 3];

const COLUMNS: readonly [string, FieldType, readonly unknown[]][] = [
    ['keyword',
        FieldType.Keyword,
        [
            'key1', '8910', '1.5', '01', 'toString', 'constructor', '__proto__', 'empty', 'missing', null,
        ]],
    ['double', FieldType.Number, [8910, 1.5, 1, 0, -0, NaN, Infinity, 2.5, null]],
    ['integer', FieldType.Integer, [8910, 1, 0, 3, 7, null]],
    ['long', FieldType.Long, ['9007199254740993', '8910', '1', null]],
];

/** `DataFrame`'s answer, except where DEF-BIGINT makes it wrong - see the test below. */
function expectedFor(type: FieldType, table: unknown, expected: readonly unknown[]): unknown[] {
    if (type !== FieldType.Long || table !== OBJECT_TABLE) return [...expected];
    return expected.map((value, index) => (index === 0 ? 'past 2^53' : value));
}

function plain(values: readonly unknown[]): unknown[] {
    return JSON.parse(JSON.stringify(values, (_k, v) => (v === undefined ? null : v)));
}

describe('lookup as SQL', () => {
    afterAll(async () => {
        await closeDuckDatabase();
    });

    describe.each(COLUMNS)('on a %s column', (name, type, battery) => {
        const config: DataTypeConfig = { version: 1, fields: { v: { type } } };
        const records = battery.map((v) => ({ v }));
        let frame: TealFrame;

        beforeAll(async () => {
            frame = await TealFrame.fromRecords(config, records, { name: `lookup_${name}` });
        });

        afterAll(async () => {
            await frame.destroy();
        });

        const tables: [string, unknown][] = [['an object table', OBJECT_TABLE]];
        if (type !== FieldType.Keyword) tables.push(['an array table', ARRAY_TABLE]);

        it.each(tables)('matches DataFrame with %s, as SQL', async (_label, table) => {
            const result = await tealFrameAdapter(repo.lookup, {
                field: 'v', inputConfig: { field_config: { type } }, args: { in: table },
            });
            const values: unknown[] = [];
            for await (const row of frame.select({ v: result.expression }, {
                config: { version: 1, fields: { v: result.outputConfig.field_config } },
            }).rows()) values.push(row.v);

            const expected = dataFrameAdapter(repo.lookup, { args: { in: table } })
                .column(DataFrame.fromJSON<Record<string, any>>(config, records).getColumnOrThrow('v'))
                .toJSON();

            expect(result.dispatch).toEqual('sql+udf');
            expect(plain(values)).toEqual(plain(expectedFor(type, table, expected)));
        });
    });

    /**
     * Past 2^53 TealFrame is EXACT and `DataFrame` is not: `DataFrame` stores the Long
     * `9007199254740993` as `...994` (DEF-BIGINT, #4555 - its parser adds 1, only its output path
     * takes it back), so its `lookup` misses the key. TealFrame stores the value exactly (DF15) and
     * finds it - on the SQL path and the UDF path alike.
    */
    it('finds a Long key past 2^53 exactly, on both paths', async () => {
        const config: DataTypeConfig = { version: 1, fields: { v: { type: FieldType.Long } } };
        const frame = await TealFrame.fromRecords(config, [{ v: '9007199254740993' }], { name: 'lookup_wide' });
        try {
            for (const preferSql of [true, false]) {
                const result = await tealFrameAdapter(repo.lookup, {
                    field: 'v',
                    inputConfig: { field_config: { type: FieldType.Long } },
                    args: { in: OBJECT_TABLE },
                    preferSql,
                });
                const values: unknown[] = [];
                for await (const row of frame.select({ v: result.expression }, {
                    config: { version: 1, fields: { v: result.outputConfig.field_config } },
                }).rows()) values.push(row.v);
                expect(values).toEqual(['past 2^53']);
            }
        } finally {
            await frame.destroy();
        }
    });

    it('leaves a string table to the UDF', async () => {
        const result = await tealFrameAdapter(repo.lookup, {
            field: 'v',
            inputConfig: { field_config: { type: FieldType.Keyword } },
            args: { in: '1:foo\n2:bar' },
        });
        expect(result.dispatch).toEqual('udf');
    });
});
