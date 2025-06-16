import 'jest-extended';
import { FieldType } from '@terascope/types';
import { coerceToGeoBoundary, coerceToNumberType } from '../src/type-coercion.js';

describe('type-coercion', () => {
    describe('coerceToNumberType', () => {
        const numberTypes = [
            FieldType.Float,
            FieldType.Number,
            FieldType.Double,
            FieldType.Integer,
            FieldType.Byte,
            FieldType.Short,
            FieldType.Long
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
            ...numberTypes.flatMap((type): ValidTestCases => [
                [type, Number.NaN, Number.NaN],
                [type, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY],
                [type, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY],
            ]),
            [FieldType.Long, BigInt(12e12), BigInt(12e12)],
            [FieldType.Long, '120000', BigInt(120000)],
            [FieldType.Integer, BigInt(246071665871), 246071665871],
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
