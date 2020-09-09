import 'jest-fixtures';
import { FieldType } from '@terascope/types';
import { cloneDeep } from '@terascope/utils';
import { newVector } from '../../src';

describe('ListVector', () => {
    type Case = [type: FieldType, input: any[], output?: any[]];

    const testCases: Case[] = [
        [
            FieldType.Any,
            [['foo'], 'bar', [undefined], 2, [null, {}], null, undefined],
            [['foo'], ['bar'], [undefined], [2], [null, {}], null, undefined]
        ],
    ];

    describe.each(testCases)('when field type is %s', (type, input, output) => {
        it('should return the correct output', () => {
            const vector = newVector({ type, array: true }, cloneDeep(input));
            expect(vector.toJSON()).toEqual(
                output ?? input
            );
        });
    });
});
