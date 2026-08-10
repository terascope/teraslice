import 'jest-extended';
import { FieldType, DataTypeConfig } from '@terascope/types';
import { LATEST_VERSION } from '@terascope/data-types';
import {
    Column,
    DataFrame,
    dataFrameAdapter,
    functionConfigRepository,
} from '../src/index.js';

/**
 * Characterization tests for known defects in the current DataFrame implementation.
 *
 * These tests assert the CORRECT behaviour, so an OPEN defect shows as a FAILING test.
 *
 * FIXED - these tests pass:
 *   D1  multi-key orderBy summed per-field comparisons instead of taking the first
 *       non-zero one, so two keys that disagreed cancelled out and the primary key
 *       was ignored. Fuzzing showed 76% of multi-key sorts returned the wrong order.
 *   D2  compare() left nils to the JS relational operators, making it non-transitive
 *       for strings and treating a nil as 0 for numerics.
 *   D3  reverse() walked UTF-16 code units, splitting surrogate pairs into lone
 *       surrogates. It now segments by grapheme, which also keeps combining marks
 *       attached and leaves ZWJ sequences and flags in order.
 *   D4  numeric coercion checked the whole string with Number() but then parsed it
 *       with parseInt/parseFloat, which stop at the first character they do not
 *       understand: '1e3' -> 1, '0x10' -> 0. Check and parse now share one
 *       implementation, so a value that passes the check converts to the number it
 *       looks like.
 *
 * STILL OPEN - these tests fail, and that is intentional:
 *   D5  date coercion delegates to the JS Date parser, so a bare integer string
 *       becomes a year ('0' -> 2000-01-01) and loose formats read the process
 *       timezone. Only the first half is asserted here - see the D5 block.
 *
 * D5 is a behaviour change rather than a plain bug fix: tightening it would reject
 * input that is accepted today, so production data should be checked first.
 */

/** Deterministic LCG so a failing case is reproducible rather than flaky. */
function lcg(seed: number): () => number {
    let s = seed;
    return () => {
        s = (s * 1103515245 + 12345) & 0x7fffffff;
        return s / 0x7fffffff;
    };
}

describe('DataFrame known defects', () => {
    describe('D1: multi-key orderBy sums per-field comparisons', () => {
    // Vector.getSortedIndices reduces with `acc + (dir === 'asc' ? res : -res)`.
    // Two keys that disagree cancel to 0, the comparator reports "equal", and the
    // first key is ignored.
        const config: DataTypeConfig = {
            version: LATEST_VERSION,
            fields: {
                a: { type: FieldType.Keyword },
                b: { type: FieldType.Integer },
            },
        };

        it('should order by the first key when a later key disagrees', () => {
            // 'x' < 'y' so x1 must come first, regardless of what b says.
            const frame = DataFrame.fromJSON<{ a: string; b: number }>(config, [
                { a: 'y', b: 2 },
                { a: 'x', b: 1 },
            ]);

            const actual = frame
                .orderBy('a:asc', 'b:desc')
                .toJSON()
                .map((r) => `${r.a}${r.b}`);

            expect(actual).toEqual(['x1', 'y2']);
        });

        it('should sort every random frame the same as a reference comparator', () => {
            const rnd = lcg(12345);
            const numericConfig: DataTypeConfig = {
                version: LATEST_VERSION,
                fields: {
                    a: { type: FieldType.Integer },
                    b: { type: FieldType.Integer },
                },
            };

            const failures: { input: string; actual: string; expected: string }[]
                = [];

            for (let trial = 0; trial < 200; trial++) {
                const size = 3 + Math.floor(rnd() * 12);
                const rows = Array.from({ length: size }, () => ({
                    a: Math.floor(rnd() * 3),
                    b: Math.floor(rnd() * 3),
                }));

                const actual = DataFrame.fromJSON<{ a: number; b: number }>(
                    numericConfig,
                    rows,
                )
                    .orderBy('a:asc', 'b:desc')
                    .toJSON()
                    .map((r) => `${r.a}${r.b}`);

                // first non-zero key wins
                const expected = [...rows]
                    .sort((x, y) => x.a - y.a || y.b - x.b)
                    .map((r) => `${r.a}${r.b}`);

                if (actual.join(' ') !== expected.join(' ')) {
                    failures.push({
                        input: rows.map((r) => `${r.a}${r.b}`).join(' '),
                        actual: actual.join(' '),
                        expected: expected.join(' '),
                    });
                }
            }

            expect(failures).toEqual([]);
        });
    });

    describe('D2: null values corrupt ordering of non-null values', () => {
    // Vector.compare maps nullish to `null`. For strings both `null < 'a'` and
    // `null > 'a'` are false, so compare returns 0 - null is "equal" to every string.
    // A non-transitive comparator does not merely misplace nulls, it misorders
    // real values.
        const config: DataTypeConfig = {
            version: LATEST_VERSION,
            fields: { s: { type: FieldType.Keyword } },
        };

        it('should not report null as equal to every string', () => {
            const vector = Column.fromJSON<string>('s', { type: FieldType.Keyword }, [
                'a',
            ]).vector;

            // If null is equal to both 'a' and 'z' while 'a' < 'z', the comparator is
            // non-transitive and Array.prototype.sort may produce any ordering.
            const nullVsA = vector.compare(null, 'a');
            const nullVsZ = vector.compare(null, 'z');
            const aVsZ = vector.compare('a', 'z');

            expect([nullVsA === 0, nullVsZ === 0, aVsZ === 0]).not.toEqual([
                true,
                true,
                false,
            ]);
        });

        it('should keep non-null values ordered when nulls are present', () => {
            const rnd = lcg(999);
            const letters = 'abcdefghijklmnopqrst'.split('');
            const rows = Array.from({ length: 64 }, () => ({
                s: rnd() < 0.25 ? null : letters[Math.floor(rnd() * letters.length)],
            }));

            const sorted = DataFrame.fromJSON<{ s: string | null }>(config, rows)
                .orderBy('s:asc')
                .toJSON()
                .map((r) => r.s)
                .filter((s): s is string => s != null);

            expect(sorted).toEqual([...sorted].sort());
        });

        it('should sort a nil to one end, not into the middle of the range', () => {
            // null maps to `null`, and `null < 5` evaluates as `0 < 5`, so a nil sorts as the
            // NUMBER ZERO. That is invisible when the values are all negative (nil lands last)
            // or all positive (nil lands first) - it only shows when the range spans zero,
            // where the nil is sorted into the middle as if it were 0.
            const numericConfig: DataTypeConfig = {
                version: LATEST_VERSION,
                fields: { n: { type: FieldType.Integer } },
            };

            const sorted = DataFrame.fromJSON<{ n: number | null }>(numericConfig, [
                { n: -10 },
                { n: null },
                { n: 5 },
                { n: -1 },
                { n: 20 },
            ])
                .orderBy('n:asc')
                .toJSON()
                .map((r) => r.n);

            const nilIndex = sorted.findIndex((n) => n == null);

            // a nil belongs at one end or the other, never between two real values
            expect([0, sorted.length - 1]).toContain(nilIndex);
        });
    });

    describe('D3: reverse() must reverse by grapheme', () => {
    // Reversing UTF-16 code units splits surrogate pairs into lone surrogates.
    // Reversing code POINTS fixes that but is still wrong: it detaches combining
    // marks and reorders ZWJ sequences and regional-indicator flags. Only grapheme
    // segmentation is correct, so the cases below deliberately cover all three.
        const LONE_SURROGATE
            = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/;

        function reverseValues(values: string[]): unknown[] {
            const column = Column.fromJSON<string>(
                's',
                { type: FieldType.Keyword },
                values,
            );
            return dataFrameAdapter(functionConfigRepository.reverse, { field: 's' })
                .column(column)
                .toJSON();
        }

        it('should keep surrogate pairs intact', () => {
            expect(reverseValues(['abc', '\u{1F600}x', 'a\u{1F600}b'])).toEqual([
                'cba',
                'x\u{1F600}',
                'b\u{1F600}a',
            ]);
        });

        it('should keep a combining mark attached to its base character', () => {
            // 'e' + U+0301 COMBINING ACUTE, written as an escape so an editor cannot
            // silently normalise it to the precomposed single-code-point form.
            const decomposed = 'e\u0301abc';
            expect(decomposed).toHaveLength(5);

            expect(reverseValues([decomposed])).toEqual(['cbae\u0301']);
        });

        it('should not reorder ZWJ sequences or regional-indicator flags', () => {
            // A ZWJ family and a two-codepoint flag are each ONE grapheme.
            const family = '\u{1F468}\u{200D}\u{1F469}\u{200D}\u{1F467}';
            const flag = '\u{1F1FA}\u{1F1F8}ab';

            expect(reverseValues([family, flag])).toEqual([family, 'ba\u{1F1FA}\u{1F1F8}']);
        });

        it('should never produce a lone surrogate', () => {
            const results = reverseValues([
                '\u{1F600}x',
                'a\u{1F600}b',
                '\u{1F468}x',
                '\u{1F468}\u{200D}\u{1F469}\u{200D}\u{1F467}',
                '\u{1F1FA}\u{1F1F8}ab',
            ]);
            const corrupted = results.filter(
                (value) => typeof value === 'string' && LONE_SURROGATE.test(value),
            );

            expect(corrupted).toEqual([]);
        });
    });

    describe('D4: integer coercion truncates at the first non-digit', () => {
    // Coercion used to parse leading digits and stop, rather than parsing the value
    // as a number: '1e3' became 1 instead of 1000, and '0x10' became 0 instead of 16.
    // The root cause is in @terascope/core-utils - see numbers.ts _parseNumberLike.
        function coerceInteger(value: string): unknown {
            return Column.fromJSON('n', { type: FieldType.Integer }, [
                value,
            ]).toJSON()[0];
        }

        it.each([
            ['1e3', 1000],
            ['0x10', 16],
            ['0b11', 3],
            ['0o17', 15],
            ['1,000', 1000],
        ])('should coerce %p to %p', (input, expected) => {
            expect(coerceInteger(input as string)).toEqual(expected);
        });
    });

    describe('D5: date coercion delegates to the JS Date parser', () => {
    // Non-ISO input falls through to `new Date(value)`. Two consequences:
    //
    //   1. A bare integer string becomes a YEAR. '0' -> 2000-01-01, '1' -> 2001-01-01,
    //      '99' -> 1999-01-01. In real data those are far more likely to be a count, a
    //      flag or an epoch than a date, and they are accepted silently.
    //   2. Locale-shaped formats read the process timezone, so the same input stores a
    //      different instant on differently-configured hosts.
    //
    // Only (1) is asserted here. (2) cannot be observed under jest: the VM context
    // caches the timezone at startup, so changing process.env.TZ mid-run has no effect
    // (verified - even `new Date()` ignores it). Reproduce (2) outside jest with:
    //
    //   TZ=UTC            node -e "...Column.fromJSON('d',{type:'Date'},['Mar 10 2024'])"
    //   TZ=America/Denver node -e "...same..."
    //
    // which yield 2024-03-10T00:00:00.000Z and 2024-03-10T07:00:00.000Z respectively.
        function coerceDate(value: string): unknown {
            return Column.fromJSON('d', { type: FieldType.Date }, [
                value,
            ]).toJSON()[0];
        }

        it.each([
            ['0', '2000-01-01T00:00:00.000Z'],
            ['1', '2001-01-01T00:00:00.000Z'],
            ['99', '1999-01-01T00:00:00.000Z'],
        ])(
            'should not silently read the bare integer %p as the year %p',
            (input, jsDateResult) => {
                // `new Date(input)` produces jsDateResult; coercion should not inherit that.
                expect(coerceDate(input)).not.toEqual(jsDateResult);
            },
        );
    });
});
