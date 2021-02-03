import 'jest-fixtures';
import { bigIntToJSON, isNotNil, toString } from '@terascope/utils';
import { FieldType } from '@terascope/types';
import {
    Vector, Builder, WritableData
} from '../../src';

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
        let vector: Vector<any>;
        let expected: any[];
        beforeAll(() => {
            const builder = Builder.make(new WritableData(input.length), {
                config: { type, array: true },
            });
            input.forEach((val) => builder.append(val));

            vector = builder.toVector();
            expected = (output ?? input).map((val) => {
                if (typeof val === 'bigint') {
                    return bigIntToJSON(val);
                }
                if (val == null) return undefined;
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
