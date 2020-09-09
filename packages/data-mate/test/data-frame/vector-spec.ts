import 'jest-fixtures';
import { FieldType } from '@terascope/types';
import { cloneDeep } from '@terascope/utils';
import { newVector } from '../../src';

describe('Vector', () => {
    type Case = [type: FieldType, input: any[], output?: any[]];
    const testCases: Case[] = [
        [
            FieldType.Any,
            ['foo', 'bar', 1, 2, null, undefined]
        ],
    ];

    describe.each(testCases)('when field type is %s', (type, input, output) => {
        it('should return the correct output', () => {
            const vector = newVector({ type }, cloneDeep(input));
            expect(vector.toJSON()).toEqual(
                output ?? input
            );
        });
    });
});
