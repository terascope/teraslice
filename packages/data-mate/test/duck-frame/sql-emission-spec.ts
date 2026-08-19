import 'jest-extended';
import { FieldType, DataTypeConfig } from '@terascope/types';
import { DuckFrame, closeDuckDatabase } from '../../src/duck-frame/DuckFrame.js';
import { duckFrameAdapter } from '../../src/adapters/duck-frame-adapter/index.js';
import { functionConfigRepository } from '../../src/function-configs/index.js';
import {
    FunctionDefinitionConfig, isFieldTransform, isFieldValidation,
} from '../../src/function-configs/interfaces.js';

/**
 * **The promotion gate for `sql` emissions.**
 *
 * A function may declare a `sql` emission so the query runs it natively instead of calling a
 * JavaScript UDF once per value. That is worth 18x-125x, and it is also a chance to silently
 * change every answer the function has ever given - so nothing is promoted by inspection. This
 * runs the SAME function BOTH ways over the same values and requires them to agree exactly.
 *
 * It is not a theoretical risk. The two most obvious candidates in the catalogue both failed a
 * naive emission:
 *
 * - `trim` as `trim(x)` differs whenever the value has a tab or a newline, because DuckDB's
 *   one-argument form strips only spaces while JavaScript strips all Unicode whitespace.
 * - `toUpperCase` as `upper(x)` differs on `'ß'` (`SS` vs `ẞ`) and `'ﬁ'` (`FI` vs `ﬁ`), because
 *   JavaScript applies full case mapping and DuckDB applies simple mapping.
 *
 * Both are handled now - the first with an explicit character set, the second with an ASCII guard
 * and a UDF fallback - and this spec is what says so.
*/

const repo = functionConfigRepository as unknown as Record<
    string, FunctionDefinitionConfig<any>
>;

const FIELD_FUNCTIONS = Object.entries(repo)
    .filter(([, config]) => isFieldTransform(config) || isFieldValidation(config));

const PROMOTED = FIELD_FUNCTIONS.filter(([, config]) => config.sql != null);

/**
 * The battery. Every value that has ever produced a divergence, plus the ordinary cases.
 *
 * `null` is in here deliberately: `INDIVIDUAL_VALUES` means the UDF is never called for nil and nil
 * passes through, so a SQL emission has to be null-safe on its own. That is the easiest property to
 * get wrong with a `CASE` expression.
*/
const STRINGS: readonly (string | null)[] = [
    'hello',
    'Hey There',
    'ALREADY UPPER',
    '',
    '   ',
    '\t x \n',
    ' nbsp ',
    '　ideographic　',
    '﻿zwnbsp﻿',
    'ß',
    'ﬁ',
    'İstanbul',
    'ábc',
    'straße 12',
    'MiXeD CaSe',
    'it\'s quoted',
    'tab\tinside',
    null,
];

/** Argument sets to try per function, keyed by name. An empty object means "the defaults". */
const ARGS_BY_FUNCTION: Record<string, readonly Record<string, unknown>[]> = {
    trim: [{}, { chars: 'x' }, { chars: '-' }, { chars: 'ab' }],
    trimStart: [{}, { chars: 'x' }, { chars: '-' }],
    trimEnd: [{}, { chars: 'x' }, { chars: '-' }],
};

interface Ran {
    values: unknown[];
    dispatch: string;
}

/**
 * Runs one function over the battery, either way, and returns what came out.
 *
 * A single frame per call, and the projection is forced by draining `rows()`, so what is compared
 * is the values a caller would actually receive rather than the SQL text.
*/
async function run(
    name: string,
    config: FunctionDefinitionConfig<any>,
    args: Record<string, unknown>,
    preferSql: boolean,
    { array }: { array?: boolean } = {}
): Promise<Ran> {
    const fieldConfig = { type: FieldType.Keyword, ...(array ? { array: true } : {}) };
    const dtConfig: DataTypeConfig = { version: 1, fields: { field: fieldConfig } };

    const result = await duckFrameAdapter(config, {
        field: 'field',
        inputConfig: { field_config: fieldConfig },
        args,
        preferSql,
    });

    // one record per battery value, or one record whose array IS the battery
    const records = array
        ? [{ field: STRINGS.filter((value) => value != null) }]
        : STRINGS.map((value) => ({ field: value }));

    const frame = await DuckFrame.fromRecords(
        dtConfig,
        records,
        { name: `sqlemit_${name}_${preferSql ? 'sql' : 'udf'}_${array ? 'arr' : 'one'}` }
    );

    try {
        const projected = frame.select(
            { field: result.expression },
            { version: 1, fields: { field: result.outputConfig.field_config } }
        );
        const values: unknown[] = [];
        for await (const row of projected.rows()) values.push(row.field);
        return { values, dispatch: result.dispatch };
    } finally {
        await frame.destroy();
    }
}

describe('sql emissions on the function configs', () => {
    afterAll(async () => {
        await closeDuckDatabase();
    });

    it('lists exactly the functions that are promoted', () => {
        // A descriptor added without a passing case below would show up here first. Moving this
        // list UP is the point of the work; it must never move up without the parity cases.
        expect(PROMOTED.map(([name]) => name).sort()).toEqual([
            'toLowerCase', 'toUpperCase', 'trim', 'trimEnd', 'trimStart',
        ]);
    });

    describe.each(PROMOTED)('%s', (name, config) => {
        const argSets = ARGS_BY_FUNCTION[name] ?? [{}];

        it.each(argSets.map((args) => [JSON.stringify(args), args]))(
            'is byte-equal to its own UDF over the battery, args=%s',
            async (_label, args) => {
                const sql = await run(name, config, args as Record<string, unknown>, true);
                const udf = await run(name, config, args as Record<string, unknown>, false);

                expect(sql.values).toEqual(udf.values);
                // and the two paths really were different paths - otherwise this proves nothing
                expect(udf.dispatch).toEqual('udf');
                expect(['sql', 'sql+udf']).toContain(sql.dispatch);
            },
            60_000
        );

        it('is byte-equal on an ARRAY column, where SQL maps with list_transform', async () => {
            const args = argSets[0] as Record<string, unknown>;
            const sql = await run(name, config, args, true, { array: true });
            const udf = await run(name, config, args, false, { array: true });

            expect(sql.values).toEqual(udf.values);
        }, 60_000);

        it('registers NO udf when the emission does not need one', async () => {
            const result = await duckFrameAdapter(config, {
                field: 'field',
                inputConfig: { field_config: { type: FieldType.Keyword } },
                args: argSets[0] as Record<string, unknown>,
                preferSql: true,
            });

            if (config.sql?.needs_udf_fallback) {
                expect(result.dispatch).toEqual('sql+udf');
                expect(result.functionName).toBeString();
            } else {
                // the whole point: no JS boundary at all, so there is nothing to marshal
                expect(result.dispatch).toEqual('sql');
                expect(result.functionName).toBeUndefined();
            }
        });
    });

    it('falls back to the UDF for a type the emission does not claim', async () => {
        // `types` narrows an emission to the accepted types it is correct for. Nothing declares a
        // narrower set yet, so this asserts the mechanism rather than a current case.
        const config = {
            ...repo.toUpperCase,
            sql: { ...repo.toUpperCase.sql!, types: [FieldType.Text] },
        } as FunctionDefinitionConfig<any>;

        const result = await duckFrameAdapter(config, {
            field: 'field',
            inputConfig: { field_config: { type: FieldType.Keyword } },
            preferSql: true,
        });

        expect(result.dispatch).toEqual('udf');
    });

    it('throws at plan time if an emission calls ctx.udf without declaring the fallback', async () => {
        const config = {
            ...repo.trim,
            sql: {
                expression: ({ value, udf }: any) => `${udf(value)}`,
            },
        } as FunctionDefinitionConfig<any>;

        // loud, and at plan time - the alternative is SQL referencing a function that was never
        // registered, which fails later and further from its cause
        await expect(duckFrameAdapter(config, {
            field: 'field',
            inputConfig: { field_config: { type: FieldType.Keyword } },
            preferSql: true,
        })).rejects.toThrow(/needs_udf_fallback/);
    });
});
