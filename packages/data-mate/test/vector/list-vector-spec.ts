import 'jest-fixtures';
import {
    bigIntToJSON, isNotNil, times, toString
} from '@terascope/core-utils';
import { FieldType } from '@terascope/types';
import {
    Vector, Builder, WritableData, ListVector
} from '../../src/index.js';

describe('ListVector', () => {
    type Case = [type: FieldType, input: any[], output?: any[]];

    const testCases: Case[] = [
        [
            FieldType.Any,
            [['foo'], 'bar', [undefined], 2, [null, {}], null, undefined],
            [['foo'], ['bar'], [undefined], [2], [undefined, {}], undefined, undefined]
        ],
    ];

    describe.each(testCases)('when field type is %s', (type, input, output) => {
        let vector: ListVector<any>;
        let expected: any[];
        beforeAll(() => {
            const builder = Builder.make(new WritableData(input.length), {
                config: { type, array: true },
            });
            input.forEach((val) => builder.append(val));

            vector = builder.toVector() as ListVector<any>;
            const convert = (val: unknown): unknown => {
                if (Array.isArray(val)) return val.map(convert);
                if (typeof val === 'bigint') {
                    return bigIntToJSON(val);
                }
                if (val == null) return undefined;
                return val;
            };
            expected = (output ?? input).map(convert);
        });

        it('should return the correct output', () => {
            expect(vector.toJSON()).toEqual(expected);
        });

        it('should be able to get each row using getRowIterator without skipNilListValues', () => {
            const fn = (i: number) => Array.from(vector.getRowIterator(i, true));
            expect(times(vector.size, fn)).toEqual(expected.map((val) => {
                if (val == null) return [val];
                return val;
            }));
        });

        it('should be able to get each row using getRowIterator with skipNilListValues', () => {
            const fn = (i: number) => Array.from(vector.getRowIterator(i, true, {
                skipNilListValues: true
            }));
            expect(times(vector.size, fn)).toEqual(expected.map((val) => {
                if (val == null) return [];
                return val.filter((childVal: unknown) => childVal != null);
            }));
        });

        it('should return have the correct size', () => {
            expect(vector.size).toBe(expected.length);
        });

        it('should have the correct distinct values', () => {
            expect(vector.countUnique()).toBe(new Set(
                expected.filter(isNotNil).map(toString)
            ).size);
        });

        it('should have the correct field config', () => {
            expect(vector.config).toEqual({
                type,
                array: true
            });
        });

        it('should be an instance of a Vector', () => {
            expect(vector).toBeInstanceOf(Vector);
        });
    });
});
