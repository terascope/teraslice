import 'jest-extended';
import { FieldType, DataTypeConfig, DataTypeFieldConfig } from '@terascope/types';
import {
    TealFrame, closeDuckDatabase, tealFrameAdapter, dataFrameAdapter, DataFrame,
    functionConfigRepository, FunctionDefinitionConfig
} from '../../src/index.js';

/**
 * DF7 and DF4: the UDF layer could not bind a LIST, STRUCT, JSON or GEOMETRY parameter or a LIST
 * result, so every geo function, the array reducers, `split`, `parseJSON`, `lookup`, `toGeoPoint`
 * and `toGeoJSON` had no UDF at all. Each case here runs the function with `preferSql: false`, so
 * the UDF is the ONLY path, and requires the same output `DataFrame` produces.
*/

const repo = functionConfigRepository as Record<string, FunctionDefinitionConfig<any>>;

const SQUARE = {
    type: 'Polygon',
    coordinates: [[[0, 0], [0, 10], [10, 10], [10, 0], [0, 0]]],
};

const CONFIG: DataTypeConfig = {
    version: 1,
    fields: {
        point: { type: FieldType.GeoPoint },
        shape: { type: FieldType.GeoJSON },
        numbers: { type: FieldType.Number, array: true },
        words: { type: FieldType.Keyword, array: true },
        text: { type: FieldType.Keyword },
        code: { type: FieldType.Keyword },
        json: { type: FieldType.Keyword },
        location: { type: FieldType.Keyword },
        anything: { type: FieldType.Any },
    },
};

const RECORDS = [
    {
        point: { lat: 5, lon: 5 },
        shape: SQUARE,
        numbers: [1, 2, 3.5],
        words: ['a', 'b'],
        text: 'x-y-z',
        code: 'US',
        json: '{"a":1,"b":[true,null,"s"]}',
        location: '60, 40',
        anything: { nested: { n: 1 }, list: [1, 'two'] },
    },
    {
        point: { lat: 50, lon: 50 },
        shape: { type: 'Point', coordinates: [1, 2] },
        numbers: [10],
        words: ['only'],
        text: 'single',
        code: 'CA',
        json: '[1,2,3]',
        location: '-10.5, 20.25',
        anything: 'a string',
    },
    {
        point: null,
        shape: null,
        numbers: null,
        words: null,
        text: null,
        code: null,
        json: null,
        location: null,
        anything: null,
    },
];

const fields = CONFIG.fields as Record<string, DataTypeFieldConfig>;

/**
 * `DataFrame.toJSON()` leaves a missing value `undefined` where `rows()` gives `null` - the same
 * absence, spelled two ways - so the comparison is on the value, not the spelling.
*/
function nullable(values: readonly unknown[]): unknown[] {
    return values.map((value) => {
        if (value === undefined) return null;
        return Array.isArray(value) ? nullable(value) : value;
    });
}

async function collect(frame: TealFrame): Promise<Record<string, unknown>[]> {
    const out: Record<string, unknown>[] = [];
    for await (const row of frame.rows()) out.push(row);
    return out;
}

describe('UDF parameter and result types (DF4, DF7)', () => {
    let frame: TealFrame;
    let dataFrame: DataFrame<Record<string, any>>;

    beforeAll(async () => {
        frame = await TealFrame.fromRecords(CONFIG, RECORDS, { name: 'udf_types_src' });
        dataFrame = DataFrame.fromJSON<Record<string, any>>(CONFIG, RECORDS);
    });

    afterAll(async () => {
        await frame.destroy();
        await closeDuckDatabase();
    });

    /** The function on `field` through the UDF alone, and what `DataFrame` gives for the same. */
    async function bothWays(fnName: string, field: string, args?: Record<string, unknown>) {
        const result = await tealFrameAdapter(repo[fnName], {
            field,
            inputConfig: { field_config: fields[field] },
            args,
            preferSql: false,
        });
        const rows = await collect(frame.select({ [field]: result.expression }, {
            config: { version: 1, fields: { [field]: result.outputConfig.field_config } },
        }));

        const expected = nullable(dataFrameAdapter(repo[fnName], { args })
            .column(dataFrame.getColumnOrThrow(field))
            .toJSON());

        return { result, actual: rows.map((row) => row[field]), expected };
    }

    it.each([
        // a STRUCT parameter
        ['isGeoPoint', 'point', undefined],
        ['inGeoBoundingBox', 'point', { top_left: '10, 0', bottom_right: '0, 10' }],
        ['geoPointWithinRange', 'point', { point: '5, 5', distance: '100km' }],
        // a GEOMETRY parameter
        ['isGeoJSON', 'shape', undefined],
        ['isGeoShapePolygon', 'shape', undefined],
        ['geoContainsPoint', 'shape', { point: '5, 5' }],
        // a LIST parameter, folded whole
        ['addValues', 'numbers', undefined],
        ['maxValues', 'numbers', undefined],
        ['join', 'words', { delimiter: '-' }],
        // a LIST result
        ['split', 'text', { delimiter: '-' }],
        // a STRUCT result
        ['toGeoPoint', 'location', undefined],
        // a JSON result
        ['parseJSON', 'json', undefined],
        ['lookup', 'code', { in: { US: 'United States', CA: { name: 'Canada' } } }],
        // a JSON parameter
        ['toJSON', 'anything', undefined],
    ])('%s on %s runs as a UDF and matches DataFrame', async (fnName, field, args) => {
        const { result, actual, expected } = await bothWays(fnName, field, args);

        expect(result.dispatch).toEqual('udf');
        expect(actual).toEqual(expected);
    });

    it('toGeoJSON returns a GEOMETRY from a UDF', async () => {
        const result = await tealFrameAdapter(repo.toGeoJSON, {
            field: 'location',
            inputConfig: { field_config: fields.location },
            preferSql: false,
        });
        const rows = await collect(frame.select({ location: result.expression }, {
            config: { version: 1, fields: { location: result.outputConfig.field_config } },
        }));
        const expected = nullable(dataFrameAdapter(repo.toGeoJSON)
            .column(dataFrame.getColumnOrThrow('location'))
            .toJSON());

        expect(result.dispatch).toEqual('udf');
        expect(rows.map((row) => row.location)).toEqual(expected);
    });

    /** DF20: a JSON column came out of `rows()` as its text. */
    it('yields Any and untyped Object columns as values, not JSON text', async () => {
        const config: DataTypeConfig = {
            version: 1,
            fields: { any: { type: FieldType.Any }, obj: { type: FieldType.Object } },
        };
        const records = [
            { any: { x: 1, y: [1, 'two'] }, obj: { k: 'v', n: { m: true } } },
            { any: 'str', obj: null },
            { any: 5, obj: {} },
        ];
        const jsonFrame = await TealFrame.fromRecords(config, records, { name: 'udf_types_json' });
        try {
            expect(await collect(jsonFrame)).toEqual(
                DataFrame.fromJSON(config, records).toJSON()
                    .map((row) => ({
                        any: row.any ?? null,
                        obj: row.obj ?? null,
                    }))
            );
        } finally {
            await jsonFrame.destroy();
        }
    });

    /**
     * `cast` is `ProcessMode.NONE`, which `DataFrame` runs by copying each value into a Builder for
     * the NEW type - and the Builder coerces. Returning the column untouched left `'21.223'` in a
     * column whose config said Integer.
    */
    describe('cast', () => {
        const castConfig: DataTypeConfig = {
            version: 1,
            fields: {
                num: { type: FieldType.Keyword },
                obj: { type: FieldType.Object },
                'obj.foo': { type: FieldType.Keyword },
            },
        };
        const castRecords = [
            { num: '21.223', obj: { foo: '21.23' } },
            { num: '-4', obj: { foo: '7' } },
            { num: null, obj: null },
        ];
        let castFrame: TealFrame;
        let castDataFrame: DataFrame<Record<string, any>>;

        beforeAll(async () => {
            castFrame = await TealFrame.fromRecords(castConfig, castRecords, { name: 'udf_cast_src' });
            castDataFrame = DataFrame.fromJSON<Record<string, any>>(castConfig, castRecords);
        });

        afterAll(async () => {
            await castFrame.destroy();
        });

        it.each([
            ['num', { type: FieldType.Integer }],
            ['num', { type: FieldType.Integer, array: true }],
            ['num', { type: FieldType.Number }],
            ['obj', { type: FieldType.Object, child_config: { foo: { type: FieldType.Integer } } }],
        ])('casts %s to %j as DataFrame does', async (field, args) => {
            const castFields = castConfig.fields as Record<string, DataTypeFieldConfig>;
            const inputConfig = field === 'obj'
                ? { field_config: castFields.obj, child_config: { foo: castFields['obj.foo'] } }
                : { field_config: castFields[field] };

            const result = await tealFrameAdapter(repo.cast, { field, inputConfig, args });
            const outputFields = {
                [field]: result.outputConfig.field_config,
                ...Object.fromEntries(Object.entries(result.outputConfig.child_config ?? {})
                    .map(([name, config]) => [`${field}.${name}`, config])),
            };
            const rows = await collect(castFrame.select({ [field]: result.expression }, {
                config: { version: 1, fields: outputFields },
            }));
            const expected = nullable(dataFrameAdapter(repo.cast, { args })
                .column(castDataFrame.getColumnOrThrow(field))
                .toJSON());

            expect(result.dispatch).toEqual('udf');
            expect(rows.map((row) => row[field])).toEqual(expected);
        });

        it('copies the column when only metadata changes', async () => {
            const result = await tealFrameAdapter(repo.cast, {
                field: 'num',
                inputConfig: { field_config: { type: FieldType.Keyword } },
                args: { type: FieldType.Keyword, description: 'renamed' },
            });

            expect(result.dispatch).toEqual('none');
            expect(result.outputConfig.field_config.description).toEqual('renamed');
        });
    });

    /**
     * Every `DataFrame` Builder's `_valueFrom` is `coerceToType(outputConfig)`, so a transform's
     * result is COERCED into its declared output type. The UDF handed it to DuckDB raw, so a result
     * that disagreed with its `output_type` failed as `A string was expected` (DF2, DF5, DF11).
    */
    describe('result coercion into the declared output type', () => {
        const coerceConfig: DataTypeConfig = {
            version: 1,
            fields: {
                int: { type: FieldType.Integer },
                big: { type: FieldType.Number },
                ip: { type: FieldType.IP },
            },
        };
        const coerceRecords = [
            { int: 5, big: 1.5, ip: '2001:db8::ff00:42:8329' },
            { int: -12, big: 1e21, ip: '1.2.3.4' },
            { int: null, big: null, ip: null },
        ];
        let coerceFrame: TealFrame;
        let coerceDataFrame: DataFrame<Record<string, any>>;

        beforeAll(async () => {
            coerceFrame = await TealFrame.fromRecords(coerceConfig, coerceRecords, { name: 'udf_coerce_src' });
            coerceDataFrame = DataFrame.fromJSON<Record<string, any>>(coerceConfig, coerceRecords);
        });

        afterAll(async () => {
            await coerceFrame.destroy();
        });

        /** The values, or the fact that it threw - both sides must agree on which. */
        async function outcome(run: () => Promise<unknown[]> | unknown[]) {
            try {
                return { values: await run() };
            } catch {
                return { threw: true };
            }
        }

        it.each([
            ['setDefault', 'int', { value: 0 }],
            ['toJSON', 'int', undefined],
            ['ceil', 'big', undefined],
            ['floor', 'big', undefined],
            ['round', 'big', undefined],
        ])('%s on %s matches DataFrame', async (fnName, field, args) => {
            const coerceFields = coerceConfig.fields as Record<string, DataTypeFieldConfig>;
            const actual = await outcome(async () => {
                const result = await tealFrameAdapter(repo[fnName], {
                    field,
                    inputConfig: { field_config: coerceFields[field] },
                    args,
                    preferSql: false,
                });
                const rows = await collect(coerceFrame.select({ [field]: result.expression }, {
                    config: { version: 1, fields: { [field]: result.outputConfig.field_config } },
                }));
                return rows.map((row) => row[field]);
            });
            const expected = await outcome(() => nullable(dataFrameAdapter(repo[fnName], { args })
                .column(coerceDataFrame.getColumnOrThrow(field))
                .toJSON()));

            expect(actual).toEqual(expected);
        });

        /**
         * Exact, where `DataFrame` is one too LOW: its output path subtracts 1 from every bigint
         * past 2^53 (DEF-BIGINT, #4555). TealFrame stays exact there deliberately (DF15).
         * Before the result coercion the UDF path was ALSO one low - a raw bigint result met the
         * value converter's `-1` with no `+1` to cancel it, DF15's bug on the result side.
        */
        it('ipToInt on an IPv6 address is EXACT past 2^53', async () => {
            const result = await tealFrameAdapter(repo.ipToInt, {
                field: 'ip',
                inputConfig: { field_config: { type: FieldType.IP } },
                preferSql: false,
            });
            const rows = await collect(coerceFrame.select({ ip: result.expression }, {
                config: { version: 1, fields: { ip: result.outputConfig.field_config } },
            }));

            // int(ipaddress.ip_address('2001:db8::ff00:42:8329'))
            expect(rows.map((row) => row.ip)).toEqual([
                '42540766411282592856904265327123268393', 16909060, null,
            ]);
        });
    });

    /**
     * DF1: under `INDIVIDUAL_VALUES` the predicate is mapped over the list, so it is a
     * `BOOLEAN[]`, and wrapping it as `CASE WHEN <pred> THEN col ...` failed with `Unimplemented
     * type for cast (BOOLEAN[] -> BOOLEAN)` - on BOTH paths, so every validation on an array field
     * broke the query.
    */
    describe('a validation on an ARRAY column', () => {
        const arrayConfig: DataTypeConfig = {
            version: 1,
            fields: { words: { type: FieldType.Keyword, array: true } },
        };
        const arrayRecords = [
            { words: ['hello', 'sky', 'tree'] },
            { words: ['dry', 'gym'] },
            { words: ['1.2.3.4', 'nope', null] },
            { words: [] },
            { words: null },
        ];
        let arrayFrame: TealFrame;
        let arrayDataFrame: DataFrame<Record<string, any>>;

        beforeAll(async () => {
            arrayFrame = await TealFrame.fromRecords(arrayConfig, arrayRecords, { name: 'udf_array_validation' });
            arrayDataFrame = DataFrame.fromJSON<Record<string, any>>(arrayConfig, arrayRecords);
        });

        afterAll(async () => {
            await arrayFrame.destroy();
        });

        describe.each([true, false])('preferSql: %s', (preferSql) => {
            it.each([
                ['contains', { value: 'e' }],
                ['isIP', undefined],
                ['isLength', { size: 3 }],
            ])('%s matches DataFrame', async (fnName, args) => {
                const result = await tealFrameAdapter(repo[fnName], {
                    field: 'words',
                    inputConfig: { field_config: { type: FieldType.Keyword, array: true } },
                    args,
                    preferSql,
                });
                const rows = await collect(arrayFrame.select({ words: result.expression }, {
                    config: { version: 1, fields: { words: result.outputConfig.field_config } },
                }));
                const expected = nullable(dataFrameAdapter(repo[fnName], { args })
                    .column(arrayDataFrame.getColumnOrThrow('words'))
                    .toJSON());

                expect(rows.map((row) => row.words)).toEqual(expected);
            });
        });
    });
});
