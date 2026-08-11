import 'jest-extended';
import { FieldType } from '@terascope/types';
import { coerceToGeoBoundary, coerceToNumberType } from '../src/builder/type-coercion.js';

describe('type-coercion', () => {
    describe('coerceToNumberType', () => {
        const numberTypes = [
            FieldType.Float,
            FieldType.Number,
            FieldType.Double,
            FieldType.Integer,
            FieldType.Byte,
            FieldType.Short,
            FieldType.Long,
            FieldType.Vector
        ];
        type ValidTestCases = [type: FieldType, input: unknown, output: number | bigint][];
        const validTestCases: ValidTestCases = [
            [FieldType.Float, 12.3, 12.3],
            [FieldType.Float, 12, 12],
            [FieldType.Float, '12.3', 12.3],
            [FieldType.Integer, '12.3', 12],
            [FieldType.Byte, '12.3', 12],
            [FieldType.Short, '12.3', 12],
            [FieldType.Integer, BigInt(120), 120],
            [FieldType.Vector, '12.3', 12.3],
            ...numberTypes.flatMap((type): ValidTestCases => [
                [type, Number.NaN, Number.NaN],
                [type, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY],
                [type, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY],
            ]),
            [FieldType.Long, BigInt(12e12), BigInt(12e12)],
            [FieldType.Long, '120000', BigInt(120000)],
            [FieldType.Integer, BigInt(246071665871), 246071665871],
            // the whole value is parsed, not just the digits it starts with.
            // These used to truncate: '1e3' became 1 and '0x10' became 0
            [FieldType.Integer, '1e3', 1000],
            [FieldType.Integer, '-1e3', -1000],
            [FieldType.Integer, '0x10', 16],
            [FieldType.Integer, '0b11', 3],
            [FieldType.Integer, '0o17', 15],
            [FieldType.Integer, '1,000', 1000],
            [FieldType.Integer, '1_000', 1000],
            [FieldType.Float, '1e3', 1000],
            [FieldType.Float, '1e-3', 0.001],
            [FieldType.Float, '0x10', 16],
            [FieldType.Float, '1,000', 1000],
            [FieldType.Number, '1e3', 1000],
        ];
        describe.each(validTestCases)('when given valid values for field type %s', (type, input, output) => {
            it(`should convert ${input} to ${output}`, () => {
                expect(coerceToNumberType(type)(input)).toEqual(output);
            });
        });

        const invalidTestCases: [type: FieldType, input: unknown][] = [
            [FieldType.Float, 'not-a-number'],
            [FieldType.Integer, 'not-a-number'],
            [FieldType.Byte, 100203300023],
            [FieldType.Integer, Number.MAX_SAFE_INTEGER + 1],
            [FieldType.Integer, Number.MAX_SAFE_INTEGER + 1],
            [FieldType.Short, 32_767 + 1],
            [FieldType.Short, -32_768 - 1],
            [FieldType.Byte, -128 - 1],
            [FieldType.Byte, 127 + 1],
            // parses to a number too large to be a safe integer, so it is
            // rejected rather than silently truncated to 2
            [FieldType.Integer, '2e21'],
            // out of range once the whole value is parsed. These used to be
            // accepted, as the byte 1 and the short 1
            [FieldType.Byte, '1e3'],
            [FieldType.Short, '1e5'],
        ];
        describe.each(invalidTestCases)('when given invalid values for field type %s', (type, input) => {
            it(`should fail to convert ${input}`, () => {
                expect(() => coerceToNumberType(type)(input)).toThrow();
            });
        });
    });

    describe('coerceToGeoBoundary', () => {
        const validCases = [
            [
                [{ lat: 12, lon: 13 }, { lat: 13, lon: 14 }],
                [{ lat: 12, lon: 13 }, { lat: 13, lon: 14 }]
            ],
            [
                ['12,13', '13,14'],
                [{ lat: 12, lon: 13 }, { lat: 13, lon: 14 }]
            ],
        ];

        test.each(validCases)('should process the valid input of %p', (input, output) => {
            expect(coerceToGeoBoundary(input)).toStrictEqual(output);
        });

        const inValidCases: (unknown[])[] = [
            [{ lat: 12, lon: 13 }],
            [[{ lat: 12, lon: 13 }]],
            [[{ lat: 12, lon: 13 }, { lat: 13, lon: 14 }, { lat: 14, lon: 15 }]],
            [{ foo: 'bar' }],
        ];

        test.each(inValidCases)('should fail to process the invalid input of %p', (input) => {
            expect(() => coerceToGeoBoundary(input)).toThrow(TypeError);
        });
    });
});

/**
 * STILL OPEN - date coercion delegates to the JS Date parser.
 *
 * Left commented out deliberately: the tests below assert the CORRECT behaviour,
 * so they fail against the current implementation. Fixing this is a behaviour
 * change - it would reject input that is accepted today - so production data
 * needs checking first. Do not "fix" it by weakening these assertions.
 *
 * Non-ISO input falls through to `new Date(value)`. Two consequences:
 *
 *   1. A bare integer string becomes a YEAR. '0' -> 2000-01-01, '1' -> 2001-01-01,
 *      '99' -> 1999-01-01. In real data those are far more likely to be a count, a
 *      flag or an epoch than a date, and they are accepted silently.
 *   2. Locale-shaped formats read the process timezone, so the same input stores a
 *      different instant on differently-configured hosts.
 *
 * Only (1) is written up below. (2) cannot be observed under jest: the VM context
 * caches the timezone at startup, so changing process.env.TZ mid-run has no effect
 * (verified - even `new Date()` ignores it). Reproduce (2) outside jest with:
 *
 *   TZ=UTC            node -e "...Column.fromJSON('d',{type:'Date'},['Mar 10 2024'])"
 *   TZ=America/Denver node -e "...same..."
 *
 * which yield 2024-03-10T00:00:00.000Z and 2024-03-10T07:00:00.000Z respectively.
 *
 * describe('coerceToType (Date)', () => {
 *     function coerceDate(value: string): unknown {
 *         return Column.fromJSON('d', { type: FieldType.Date }, [value]).toJSON()[0];
 *     }
 *
 *     it.each([
 *         ['0', '2000-01-01T00:00:00.000Z'],
 *         ['1', '2001-01-01T00:00:00.000Z'],
 *         ['99', '1999-01-01T00:00:00.000Z'],
 *     ])(
 *         'should not silently read the bare integer %p as the year %p',
 *         (input, jsDateResult) => {
 *             // `new Date(input)` produces jsDateResult; coercion should not inherit it
 *             expect(coerceDate(input)).not.toEqual(jsDateResult);
 *         },
 *     );
 * });
 */
