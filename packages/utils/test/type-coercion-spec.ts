import 'jest-extended';
import { FieldType } from '@terascope/types';
import {
    coerceToNumberType
} from '../src/type-coercion';

describe('type-coercion', () => {
    describe('coerceToNumberType', () => {
        const validTestCases: [type: FieldType, input: unknown, output: number][] = [
            [FieldType.Float, 12.3, 12.3],
            [FieldType.Float, '12.3', 12.3],
            [FieldType.Float, Number.NaN, Number.NaN],
            [FieldType.Float, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY],
            [FieldType.Float, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY],
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
        ];
        describe.each(invalidTestCases)('when given invalid values for field type %s', (type, input) => {
            it(`should fail to convert ${input}`, () => {
                expect(() => coerceToNumberType(type)(input)).toThrowError();
            });
        });
    });
});
