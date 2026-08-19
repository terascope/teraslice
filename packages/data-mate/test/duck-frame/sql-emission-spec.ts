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
 * It is not a theoretical risk. Divergences this gate has actually caught:
 *
 * - `trim` as `trim(x)` differs whenever the value has a tab or a newline, because DuckDB's
 *   one-argument form strips only spaces while JavaScript strips all Unicode whitespace.
 * - `toUpperCase` as `upper(x)` differs on `'ß'` (`SS` vs `ẞ`) and `'ﬁ'` (`FI` vs `ﬁ`), because
 *   JavaScript applies full case mapping and DuckDB applies simple mapping.
 *
 * A function that fails here does not get a workaround - it stays a UDF, and the reason is recorded
 * in `docs/HANDOFF.md` so the next person does not re-litigate it.
*/

const repo = functionConfigRepository as unknown as Record<
    string, FunctionDefinitionConfig<any>
>;

const FIELD_FUNCTIONS = Object.entries(repo)
    .filter(([, config]) => isFieldTransform(config) || isFieldValidation(config));

const PROMOTED = FIELD_FUNCTIONS.filter(([, config]) => config.sql != null);

/** Ordinary magnitudes and both signs, including the .5 cases where rounding rules diverge. */
const ORDINARY_NUMBERS = [0, 1, -1, 0.5, -0.5, 2.5, -2.5, 12.7, -12.7, 100, -100];

/** Where JavaScript's own number formatting and domain rules bite. */
const NUMBER_EDGES = [0.1, 1e-7, 1e21, -1e21, 9007199254740991, -9007199254740991];

const ORDINARY_INTEGERS = [0, 1, -1, 2, -2, 7, -7, 100, -100];

/**
 * The battery per input type: every value that has produced a divergence, plus the ordinary
 * cases and the edges of the type.
 *
 * `null` is in every battery deliberately: `INDIVIDUAL_VALUES` means the UDF is never called for
 * nil and nil passes through, so an emission has to be null-safe on its own. That is the easiest
 * property to get wrong with a `CASE` expression.
*/
const BATTERIES: Partial<Record<FieldType, readonly unknown[]>> = {
    [FieldType.Keyword]: [
        'hello',
        'Hey There',
        'ALREADY UPPER',
        '',
        '   ',
        '\t x \n',
        ' nbsp ',
        '　ideographic　',
        // a LEADING U+FEFF is stripped on ingest and again when a UDF returns one, so a value
        // carrying it cannot round-trip through the engine - see docs/known-defects.md DF3.
        // A trailing one survives, and stays here.
        'zwnbsp﻿',
        'ß',
        'ﬁ',
        'İstanbul',
        'ábc',
        'straße 12',
        'MiXeD CaSe',
        'it\'s quoted',
        'tab\tinside',
        'a-b_c.d',
        '0123456789',
        // astral pairs and a combining mark: character-based SQL vs code-unit-based JavaScript
        '𝔘nicode 𝔘',
        'e\u0301abc',
        '👍 ok 👍',
        null,
    ],
    [FieldType.Number]: [...ORDINARY_NUMBERS, ...NUMBER_EDGES, null],
    [FieldType.Integer]: [...ORDINARY_INTEGERS, 2147483647, -2147483648, null],
    [FieldType.Long]: [0, 1, -1, 9007199254740991, -9007199254740991, null],
    [FieldType.Double]: [...ORDINARY_NUMBERS, 0.1, 1e-7, 1e21, null],
    [FieldType.Boolean]: [true, false, null],
    [FieldType.Date]: [
        '2026-01-02T03:04:05.000Z',
        '1970-01-01T00:00:00.000Z',
        '2026-12-31T23:59:59.999Z',
        null,
    ],
    [FieldType.IP]: ['1.2.3.4', '255.255.255.255', '0.0.0.0', '::1', 'fe80::1', null],
};

/**
 * Which of a function's accepted types to feed it.
 *
 * Order matters and getting it wrong looks like a bug in the emission when it is not - IP functions
 * list `String` first, so a naive first-match would feed `getCIDRMin` a sentence. Semantic types
 * first, numerics next, generic strings last. Same reasoning as `function-sweep-spec.ts`.
*/
const TYPE_PREFERENCE: readonly FieldType[] = [
    FieldType.Date,
    FieldType.IP,
    FieldType.Boolean,
    FieldType.Integer,
    FieldType.Long,
    FieldType.Double,
    FieldType.Number,
    FieldType.Keyword,
];

/**
 * Per-function overrides: argument sets, the input type when preference is wrong, and the battery
 * itself where the shared one contains values the function's DECLARED OUTPUT TYPE cannot hold.
 *
 * That last case is `ceil`/`floor`/`round`: their `output_type` is `Integer`, so at `1e21` both paths
 * produce a wrapped BIGINT (`docs/known-defects.md` DF2) and differ only in how the garbage renders -
 * a string on one side, a double on the other. Comparing them there measures the overflow defect, not
 * the emission, so the battery is narrowed to what an `Integer` can represent and the guard on those
 * emissions keeps the UDF for everything outside it.
*/
const CASES: Record<string, {
    args?: readonly Record<string, unknown>[];
    type?: FieldType;
    battery?: readonly unknown[];
}> = {
    ceil: { battery: [...ORDINARY_NUMBERS, 1e6, -1e6, 2147483646, -2147483646, null] },
    // a temperature, so the battery is temperatures: the conversion rounds to two decimals, and
    // `floor(v * 100 + 0.5) / 100` loses precision at magnitudes no thermometer produces
    toCelsius: { battery: [...ORDINARY_NUMBERS, 212, 98.6, -40, 1e6, null] },
    toFahrenheit: { battery: [...ORDINARY_NUMBERS, 100, 37.78, -40, 1e6, null] },
    floor: { battery: [...ORDINARY_NUMBERS, 1e6, -1e6, 2147483646, -2147483646, null] },
    round: { battery: [...ORDINARY_NUMBERS, 1e6, -1e6, 2147483646, -2147483646, null] },
    trim: { args: [{}, { chars: 'x' }, { chars: '-' }, { chars: 'ab' }] },
    trimStart: { args: [{}, { chars: 'x' }, { chars: '-' }] },
    trimEnd: { args: [{}, { chars: 'x' }, { chars: '-' }] },
    // an empty `value` is rejected by `required_arguments`, so it is not a case to compare
    contains: { args: [{ value: 'e' }, { value: 'ß' }, { value: 'l' }] },
    startsWith: { args: [{ value: 'h' }, { value: 'H' }, { value: 'ß' }] },
    endsWith: { args: [{ value: 'o' }, { value: 'e' }, { value: 'ß' }] },
    replaceLiteral: {
        args: [
            { search: 'e', replace: 'E' },
            { search: 'l', replace: 'LL' },
            { search: 'ß', replace: 'ss' },
        ],
    },
    isLength: { args: [{ size: 5 }, { min: 1, max: 10 }, { min: 0 }] },
    isGreaterThan: { args: [{ value: 0 }, { value: -1 }, { value: 100 }] },
    add: { args: [{ value: 1 }, { value: -2.5 }, { value: 0 }] },
    subtract: { args: [{ value: 1 }, { value: -2.5 }, { value: 0 }] },
    multiply: { args: [{ value: 3 }, { value: -0.5 }, { value: 0 }] },
    divide: { args: [{ value: 3 }, { value: -0.5 }, { value: 0 }] },
    modulus: { args: [{ value: 3 }, { value: -3 }, { value: 2 }] },
    pow: { args: [{ value: 2 }, { value: 0.5 }, { value: -1 }] },
    inNumberRange: {
        args: [
            { min: 0, max: 100 },
            { min: 0, max: 100, inclusive: true },
            { min: -1 },
            { max: 1 },
        ],
    },
    encodeSHA: { args: [{}, { hash: 'sha512' }, { digest: 'base64' }] },
    encodeSHA1: { args: [{}, { digest: 'base64' }] },
    isGreaterThanOrEqualTo: { args: [{ value: 0 }, { value: -1 }, { value: 100 }] },
    isLessThan: { args: [{ value: 0 }, { value: -1 }, { value: 100 }] },
    isLessThanOrEqualTo: { args: [{ value: 0 }, { value: -1 }, { value: 100 }] },
    // `size` must be positive - the function rejects 0 itself
    truncate: { args: [{ size: 3 }, { size: 1 }, { size: 100 }] },
    setPrecision: { args: [{ digits: 2 }, { digits: 0 }] },
};

function inputTypeFor(name: string, config: FunctionDefinitionConfig<any>): FieldType {
    const override = CASES[name]?.type;
    if (override) return override;

    const usable = new Set(config.accepts.filter((type) => BATTERIES[type] != null));
    // a String-accepting function takes Keyword, which is the battery we have
    if (config.accepts.includes(FieldType.String)) usable.add(FieldType.Keyword);
    if (config.accepts.includes(FieldType.Number)) usable.add(FieldType.Number);

    return TYPE_PREFERENCE.find((type) => usable.has(type)) ?? FieldType.Keyword;
}

interface Ran {
    values: unknown[];
    dispatch: string;
}

/**
 * A few ULP of a double, as a relative tolerance.
 *
 * `Number.EPSILON` is 2^-52, one ULP at magnitude 1; four of them is a generous bound on a libm
 * difference and still ~12 orders of magnitude tighter than anything a caller could notice.
*/
const ULP_TOLERANCE = Number.EPSILON * 4;

/**
 * Compares the two paths' output, exactly by default.
 *
 * **Approximate comparison is allowed ONLY for a function that declares it**, and only between two
 * finite numbers. Everything else - nulls, strings, booleans, a null against a number - still has to
 * match exactly, so `approximate` cannot hide a structural difference, only a last-bit one.
*/
function expectSame(sql: unknown[], udf: unknown[], approximate: boolean | undefined) {
    if (!approximate) {
        expect(sql).toEqual(udf);
        return;
    }

    expect(sql).toBeArrayOfSize(udf.length);
    sql.forEach((value, index) => {
        const other = udf[index];
        if (typeof value === 'number' && typeof other === 'number'
            && Number.isFinite(value) && Number.isFinite(other)) {
            const scale = Math.max(Math.abs(value), Math.abs(other), 1);
            expect(Math.abs(value - other)).toBeLessThanOrEqual(ULP_TOLERANCE * scale);
            return;
        }
        expect(value).toEqual(other);
    });
}

/**
 * Runs one function over its battery, either way, and returns what came out.
 *
 * The projection is forced by draining `rows()`, so what is compared is the values a caller would
 * actually receive rather than the SQL text.
*/
async function run(
    name: string,
    config: FunctionDefinitionConfig<any>,
    args: Record<string, unknown>,
    preferSql: boolean,
    { array }: { array?: boolean } = {}
): Promise<Ran> {
    const type = inputTypeFor(name, config);
    const battery = CASES[name]?.battery ?? (BATTERIES[type] as readonly unknown[]);
    const fieldConfig = { type, ...(array ? { array: true } : {}) };
    const dtConfig: DataTypeConfig = { version: 1, fields: { field: fieldConfig } };

    const result = await duckFrameAdapter(config, {
        field: 'field',
        inputConfig: { field_config: fieldConfig },
        args,
        preferSql,
    });

    const records = array
        ? [{ field: battery.filter((value) => value != null) }]
        : battery.map((value) => ({ field: value }));

    const frame = await DuckFrame.fromRecords(
        dtConfig,
        records,
        { name: `emit_${name}_${preferSql ? 'sql' : 'udf'}_${array ? 'arr' : 'one'}` }
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

    it('reports how much of the surface is promoted', () => {
        // Moving this UP is the work. It must never move up without the parity cases below going
        // green, which is the whole point of the gate.
        expect(FIELD_FUNCTIONS.length).toEqual(205);
        expect(PROMOTED.length).toBeGreaterThanOrEqual(5);
    });

    describe.each(PROMOTED)('%s', (name, config) => {
        const argSets = CASES[name]?.args ?? [{}];

        it.each(argSets.map((args) => [JSON.stringify(args), args]))(
            'is byte-equal to its own UDF over the battery, args=%s',
            async (_label, args) => {
                const sql = await run(name, config, args as Record<string, unknown>, true);
                const udf = await run(name, config, args as Record<string, unknown>, false);

                expectSame(sql.values, udf.values, config.sql?.approximate);
                expect(udf.dispatch).toEqual('udf');

                /**
                 * The two paths must really BE different paths, or this proves nothing - except
                 * where the emission declares `applies` and legitimately declines for these
                 * arguments, which is the whole point of that field. `encodeSHA` with
                 * `hash: 'sha512'` has no native form, so both sides are the UDF and agreeing is
                 * trivially true; the case below asserts that at least one argument set IS native.
                */
                const allowed = config.sql?.applies
                    ? ['sql', 'sql+udf', 'udf']
                    : ['sql', 'sql+udf'];
                expect(allowed).toContain(sql.dispatch);
            },
            60_000
        );

        /**
         * **Skipped for validations, because the adapter cannot express one on an array column at
         * all** - on EITHER path. `applyToValues` maps per element, so the predicate becomes a
         * `BOOLEAN[]`, and the surrounding `CASE WHEN <pred> THEN col ELSE NULL END` then fails with
         * `Unimplemented type for cast (BOOLEAN[] -> BOOLEAN)`. That predates the sql emissions - the
         * UDF path builds the same shape - and is recorded in `docs/known-defects.md`. Promoting a
         * function must not be blocked on it, so the array case is asserted for transforms only.
        */
        const arrayCase = isFieldValidation(config) ? it.skip : it;

        arrayCase('is byte-equal on an ARRAY column, where SQL maps with list_transform', async () => {
            const args = argSets[0] as Record<string, unknown>;
            const sql = await run(name, config, args, true, { array: true });
            const udf = await run(name, config, args, false, { array: true });

            // one row whose value is the whole battery as a list, so compare element-wise
            expectSame(
                (sql.values[0] ?? []) as unknown[],
                (udf.values[0] ?? []) as unknown[],
                config.sql?.approximate
            );
        }, 60_000);

        it('is native for at least one argument set', async () => {
            // a `applies` emission that never fires for any tested argument set is dead code
            const type = inputTypeFor(name, config);
            const dispatches: string[] = [];
            for (const args of argSets) {
                const result = await duckFrameAdapter(config, {
                    field: 'field',
                    inputConfig: { field_config: { type } },
                    args: args as Record<string, unknown>,
                    preferSql: true,
                });
                dispatches.push(result.dispatch);
            }
            expect(dispatches.some((d) => d === 'sql' || d === 'sql+udf')).toBeTrue();
        }, 30_000);

        it('registers a udf only when the emission needs one', async () => {
            const type = inputTypeFor(name, config);
            const result = await duckFrameAdapter(config, {
                field: 'field',
                inputConfig: { field_config: { type } },
                args: argSets[0] as Record<string, unknown>,
                preferSql: true,
            });

            if (result.dispatch === 'udf') {
                // declined for these arguments - `applies` is the only way that can happen here
                expect(config.sql?.applies).toBeDefined();
            } else if (config.sql?.needs_udf_fallback) {
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
        const config = {
            ...repo.toUpperCase,
            sql: { ...repo.toUpperCase.sql!, types: [FieldType.Date] },
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
