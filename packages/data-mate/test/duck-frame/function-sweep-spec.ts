import 'jest-extended';
import { FieldType, DataTypeConfig, DataTypeFields } from '@terascope/types';
import { DuckFrame, closeDuckDatabase } from '../../src/duck-frame/DuckFrame.js';
import { duckFrameAdapter } from '../../src/adapters/duck-frame-adapter/index.js';
import { functionConfigRepository } from '../../src/function-configs/index.js';
import {
    FunctionDefinitionConfig, isFieldTransform, isFieldValidation,
} from '../../src/function-configs/interfaces.js';

const repo = functionConfigRepository as unknown as Record<
    string, FunctionDefinitionConfig<any>
>;

/** Every field-level function - the ones spaces exposes as GraphQL directives. */
const FIELD_FUNCTIONS = Object.entries(repo)
    .filter(([, config]) => isFieldTransform(config) || isFieldValidation(config))
    .map(([name, config]) => ({ name, config }));

/** A sample value for each input type we try. */
const SAMPLE: Partial<Record<FieldType, unknown>> = {
    [FieldType.String]: 'Some Value',
    [FieldType.Keyword]: 'Some Value',
    [FieldType.Text]: 'Some Value',
    // 0.5, not 12.5: acos/asin/atanh are only defined on [-1, 1] and return NaN (-> null)
    // outside it, which is correct behaviour but makes the sweep look like it found a bug.
    [FieldType.Number]: 0.5,
    [FieldType.Integer]: 12,
    [FieldType.Float]: 0.5,
    [FieldType.Double]: 0.5,
    [FieldType.Long]: 12,
    [FieldType.Short]: 12,
    [FieldType.Byte]: 12,
    [FieldType.Boolean]: true,
    [FieldType.Date]: '2026-01-02T03:04:05.000Z',
    [FieldType.IP]: '1.2.3.4',
    [FieldType.IPRange]: '1.2.3.0/24',
    [FieldType.GeoPoint]: '22.5,-90.5',
    [FieldType.Object]: { a: 1 },
    [FieldType.Any]: 'anything',
};

/**
 * Preference order for choosing which of a function's `accepts` types to feed it.
 *
 * Order matters a lot, and getting it wrong looks like an adapter bug when it is not:
 * - IP/CIDR functions list `String` first, so first-match feeds `getCIDRMin` `'Some Value'`
 * - date functions list `Number` before `Date`, so preferring "specific" feeds `toDate` `12.5`
 *
 * In both cases the FUNCTION correctly rejects the value. Semantic types come first, then
 * numerics, then the generic string types last.
 */
const TYPE_PREFERENCE: readonly FieldType[] = [
    FieldType.Date,
    FieldType.IPRange,
    FieldType.IP,
    FieldType.GeoPoint,
    FieldType.Boolean,
    FieldType.Integer,
    FieldType.Long,
    FieldType.Short,
    FieldType.Byte,
    FieldType.Float,
    FieldType.Double,
    FieldType.Number,
    FieldType.Object,
    FieldType.Keyword,
    FieldType.String,
    FieldType.Text,
    FieldType.Any,
];

/** The input type to try: the most preferred of its `accepts` we have a sample for. */
function inputTypeFor(config: FunctionDefinitionConfig<any>): FieldType | undefined {
    if (!config.accepts.length) return FieldType.Keyword;

    const usable = new Set(config.accepts.filter((type) => SAMPLE[type] != null));
    return TYPE_PREFERENCE.find((type) => usable.has(type)) ?? [...usable][0];
}

type Outcome
    = | { kind: 'ran'; value: unknown }
        | { kind: 'needs_args' }
        | { kind: 'unmapped_type'; message: string }
        | { kind: 'no_sample' }
    /**
     * The FUNCTION rejected the value - its own validation fired inside SQL. Not an adapter
     * problem, and a meaningful positive: real field semantics are running in the query.
     *
     * It does mean a throwing transform **aborts the whole query**, since the error propagates
     * out of the UDF. That matches `DataFrame`, where a transform also throws and nothing
     * catches it - so parity holds - but it is exactly the failure policy recorded as DEFERRED
     * (flag-and-continue vs fail the batch).
    */
        | { kind: 'rejected_input'; message: string }
        | { kind: 'failed'; message: string };

async function trySweep(
    name: string, config: FunctionDefinitionConfig<any>
): Promise<Outcome> {
    // Functions with required arguments need values we cannot invent generically; the adapter
    // handles args, but a sweep cannot guess a valid regex/format/timezone per function.
    if (config.required_arguments?.length) return { kind: 'needs_args' };

    const type = inputTypeFor(config);
    if (type == null) return { kind: 'no_sample' };

    const fields: DataTypeFields = { field: { type } };
    const dtConfig: DataTypeConfig = { version: 1, fields };

    try {
        const result = await duckFrameAdapter(config, {
            field: 'field',
            inputConfig: { field_config: { type } },
        });

        const frame = await DuckFrame.fromRecords(
            dtConfig, [{ field: SAMPLE[type] }], { name: `fn_${name}` }
        );
        try {
            const projected = frame.select(
                { field: result.expression },
                { version: 1, fields: { field: result.outputConfig.field_config } }
            );
            const rows: Record<string, unknown>[] = [];
            for await (const row of projected.rows()) rows.push(row);
            return { kind: 'ran', value: rows[0]?.field };
        } finally {
            await frame.destroy();
        }
    } catch (err: any) {
        const message = String(err?.message ?? err);
        if (/no DuckDB type object mapping|cannot be a scalar function/.test(message)) {
            return { kind: 'unmapped_type', message };
        }
        // the function's own validation, or an argument requirement it declares by hand
        // rather than through `required_arguments`
        if (/must be a valid|was expected|Invalid geo point|must either specify|Expected an expr|Invalid arguments|standard date format|to be a valid date|Could not convert|Expected \(x, y\)|mapped to an IPv6|Could not determine/
            .test(message)) {
            return { kind: 'rejected_input', message };
        }
        return { kind: 'failed', message };
    }
}

describe('every field function through duckFrameAdapter', () => {
    const outcomes = new Map<string, Outcome>();

    beforeAll(async () => {
        for (const { name, config } of FIELD_FUNCTIONS) {
            outcomes.set(name, await trySweep(name, config));
        }
    }, 300_000);

    afterAll(async () => {
        await closeDuckDatabase();
    });

    it('covers the whole field-function surface', () => {
        // if this number moves, a function was added or removed - the GraphQL directive
        // surface changed, which is a public API change
        expect(FIELD_FUNCTIONS.length).toEqual(205);
        expect(outcomes.size).toEqual(FIELD_FUNCTIONS.length);
    });

    it('never fails for an UNEXPECTED reason', () => {
        // Every failure must be one of the known, explained categories. A new kind of failure
        // is a real gotcha and should be understood before it is added here.
        const unexpected = [...outcomes.entries()]
            .filter(([, o]) => o.kind === 'failed')
            .map(([name, o]) => `${name}: ${(o as any).message}`);

        expect(unexpected).toEqual([]);
    });

    it('reports the state of the surface', () => {
        const byKind = [...outcomes.values()].reduce<Record<string, number>>((acc, o) => {
            acc[o.kind] = (acc[o.kind] ?? 0) + 1;
            return acc;
        }, {});

        // A snapshot of where the port stands. Moving these numbers UP for `ran` is progress;
        // moving them down is a regression.
        expect(byKind).toEqual({
            // ran end-to-end: adapter -> UDF -> SQL -> rows(), with a real value out
            ran: 140,
            // declare required_arguments a sweep cannot invent (a regex, format, timezone...)
            needs_args: 48,
            // the FUNCTION rejected the sample this harness chose - see `rejected_input`
            rejected_input: 9,
            // result type is a STRUCT (GeoPoint/Object) or JSON, which cannot yet be a UDF
            // return type: the binding exports no JSON constant and STRUCTs need a
            // runtime-built type. See `duckDBTypeObject`.
            unmapped_type: 8,
        });

        // **ZERO adapter failures across all 205 field functions.** Every non-`ran` outcome is
        // either an argument the sweep cannot guess or the function's own validation firing.
        expect(byKind.failed ?? 0).toEqual(0);
    });

    it('produces a non-null result for every TRANSFORM that ran', () => {
        // A transform that runs but nulls a perfectly good value is doing the wrong thing -
        // that is how the null-skip and the missing value-conversion showed up.
        //
        // Validations are excluded on purpose: they null by design when the predicate is false,
        // and plenty legitimately are - `isMonday` on a Friday, `isFuture` on a past date.
        // Domain-limited: no single numeric sample satisfies every inverse-trig domain at
        // once - acos/asin/atanh need [-1, 1] while acosh needs [1, inf). Out of domain they
        // return NaN, which becomes null. Correct, not a defect.
        const DOMAIN_LIMITED = new Set(['acosh']);

        const nulled = [...outcomes.entries()]
            .filter(([name, o]) => o.kind === 'ran'
                && (o as any).value == null
                && isFieldTransform(repo[name])
                && !DOMAIN_LIMITED.has(name))
            .map(([name]) => name);

        expect(nulled).toEqual([]);
    });

    it('shows a throwing transform aborts the query, as it does in DataFrame', () => {
        // The `rejected_input` cases prove real field semantics run inside SQL - including the
        // throw. Nothing catches it, so one bad value kills the whole query. That MATCHES
        // DataFrame (transforms throw there too and `mapVectorEachValue` has no try/catch), so
        // parity holds - but it is the failure policy recorded as DEFERRED in docs/HANDOFF.md:
        // flag-and-continue versus failing the batch.
        const rejected = [...outcomes.entries()]
            .filter(([, o]) => o.kind === 'rejected_input')
            .map(([name]) => name);

        expect(rejected).not.toBeEmpty();
    });
});
