import 'jest-extended';
import { FieldType } from '@terascope/types';
import {
    functionConfigRepository, FunctionDefinitionType, ProcessMode,
    Column, dataFrameAdapter,
} from '../../../src';

const reverseConfig = functionConfigRepository.reverse;

describe('reverseConfig', () => {
    it('has proper configuration', () => {
        expect(reverseConfig).toBeDefined();
        expect(reverseConfig).toHaveProperty('name', 'reverse');
        expect(reverseConfig).toHaveProperty('type', FunctionDefinitionType.FIELD_TRANSFORM);
        expect(reverseConfig).toHaveProperty('process_mode', ProcessMode.INDIVIDUAL_VALUES);
        expect(reverseConfig).toHaveProperty('description');
        expect(reverseConfig).toHaveProperty('accepts', [FieldType.String]);
        expect(reverseConfig).toHaveProperty('create');
        expect(reverseConfig.create).toBeFunction();
    });

    it('can transform values', () => {
        const values = ['hello', 'billy', 'Hey There'];
        const expected = ['olleh', 'yllib', 'erehT yeH'];

        const reverse = reverseConfig.create({});

        values.forEach((val, ind) => {
            expect(reverse(val)).toEqual(expected[ind]);
        });
    });

    describe('can work with dataFrameAdapter', () => {
        const values = [
            'hello',
            'world',
            undefined,
            'more words',
            'oob'
        ];

        it('can transform the string values', () => {
            const col = Column.fromJSON('field', {
                type: FieldType.String
            }, values);

            const api = dataFrameAdapter(reverseConfig);
            const newCol = api.column(col);

            expect(newCol.toJSON()).toEqual([
                'olleh',
                'dlrow',
                undefined,
                'sdrow erom',
                'boo',
            ]);
        });

        it('should throw if not given strings', () => {
            const col = Column.fromJSON('field', {
                type: FieldType.Number
            }, [12, 34234, undefined, 1324234234]);

            const api = dataFrameAdapter(reverseConfig);
            expect(() => api.column(col)).toThrowError('Incompatible with field type Float, must be String');
        });
    });
});
