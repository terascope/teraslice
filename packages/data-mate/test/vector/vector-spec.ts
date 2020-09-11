import 'jest-fixtures';
import { FieldType } from '@terascope/types';
import { bigIntToJSON, newBuilder, Vector } from '../../src';

describe('Vector', () => {
    type Case = [type: FieldType, input: any[], output?: any[]];
    const testCases: Case[] = [
        [
            FieldType.Any,
            ['foo', 'bar', 1, 2, null, undefined]
        ],
        [
            FieldType.String,
            ['foo', 'bar', 1, 2, null, undefined],
            ['foo', 'bar', '1', '2', null, undefined]
        ],
        [
            FieldType.Float,
            ['foo', 12.344, '2.01', BigInt(200), 1, 2, null, undefined],
            [Number.NaN, 12.344, 2.01, 200, 1, 2, null, undefined]
        ],
        [
            FieldType.Integer,
            ['foo', 12.344, '2.01', BigInt(200), 1, 2, null, undefined],
            [Number.NaN, 12, 2, 200, 1, 2, null, undefined]
        ],
        [
            FieldType.Long,
            [12.344, '2.01', BigInt(200), 1, null, undefined],
            [BigInt(12), BigInt(2), BigInt(200), BigInt(1), null, undefined]
        ],
        [
            FieldType.Boolean,
            ['foo', 'yes', 'no', true, false, 0, 1, 2, null, undefined],
            [true, true, false, true, false, false, true, true, null, undefined]
        ],
    ];

    describe.each(testCases)('when field type is %s', (type, input, output) => {
        let vector: Vector<any>;
        let expected: any[];
        beforeAll(() => {
            const builder = newBuilder({ type, array: false });
            input.forEach((val) => builder.append(val));
            vector = builder.toVector();
            expected = (output ?? input).map((val) => {
                if (typeof val === 'bigint') {
                    return bigIntToJSON(val);
                }
                if (val === undefined) return null;
                return val;
            });
        });

        it('should return the correct output', () => {
            expect(vector.toJSON()).toEqual(expected);
        });

        it('should return have the correct size', () => {
            expect(vector.size).toBe(expected.length);
        });

        it('should have the correct distinct values', () => {
            expect(vector.distinct()).toBe(new Set(expected).size);
        });

        it('should have the correct field type', () => {
            expect(vector.fieldType).toBe(type);
        });

        it('should be an instance of a Vector', () => {
            expect(vector).toBeInstanceOf(Vector);
        });

        test.todo('should be immutable');
    });

    test.todo('->reduce');
    test.todo('->filter');
});
