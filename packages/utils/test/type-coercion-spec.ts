import 'jest-extended';
import { FieldType } from '@terascope/types';
import {
    coerceToNumberType
} from '../src/type-coercion';

describe('type-coercion', () => {
    describe('coerceToNumberType', () => {
        const numberTypes = [
            FieldType.Float, FieldType.Number,
            FieldType.Double, FieldType.Integer,
            FieldType.Byte, FieldType.Short,
            FieldType.Long
        ];
        type ValidTestCases = [type: FieldType, input: unknown, output: number|bigint][];
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
            [FieldType.Integer, -(2 ** 31) - 1],
            [FieldType.Integer, 2 ** 31],
        ];
        describe.each(invalidTestCases)('when given invalid values for field type %s', (type, input) => {
            it(`should fail to convert ${input}`, () => {
                expect(() => coerceToNumberType(type)(input)).toThrowError();
            });
        });
    });
});
