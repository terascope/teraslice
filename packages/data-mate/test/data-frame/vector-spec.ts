import 'jest-fixtures';
import { FieldType } from '@terascope/types';
import { cloneDeep } from '@terascope/utils';
import { bigIntToJSON, newVector } from '../../src';

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
    ];

    describe.each(testCases)('when field type is %s', (type, input, output) => {
        it('should return the correct output', () => {
            const vector = newVector({ type }, cloneDeep(input));
            expect(vector.toJSON()).toEqual(
                (output ?? input).map((val) => {
                    if (typeof val === 'bigint') {
                        return bigIntToJSON(val);
                    }
                    return val;
                })
            );
        });
    });
});
