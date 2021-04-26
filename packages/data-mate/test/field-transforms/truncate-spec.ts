import 'jest-extended';
import { FieldType } from '@terascope/types';
import {
    functionConfigRepository, FunctionDefinitionType,
    ProcessMode, Column, dateFrameAdapter
} from '../../src';

const truncateConfig = functionConfigRepository.truncate;

describe('truncateConfig', () => {
    it('has proper configuration', () => {
        expect(truncateConfig).toBeDefined();
        expect(truncateConfig).toHaveProperty('name', 'truncate');
        expect(truncateConfig).toHaveProperty('type', FunctionDefinitionType.FIELD_TRANSFORM);
        expect(truncateConfig).toHaveProperty('process_mode', ProcessMode.INDIVIDUAL_VALUES);
        expect(truncateConfig).toHaveProperty('description');
        expect(truncateConfig).toHaveProperty('accepts', [FieldType.String]);
        expect(truncateConfig).toHaveProperty('create');
        expect(truncateConfig.create).toBeFunction();
    });

    it('can transform values', () => {
        const values = ['HELLO there', 'billy', 'Hey There'];
        const expected = ['HEL', 'bil', 'Hey'];

        const truncate = truncateConfig.create({ size: 3 });

        values.forEach((val, ind) => {
            expect(truncate(val)).toEqual(expected[ind]);
        });
    });

    describe('can work with dataFrameAdapter', () => {
        const field = 'someField';
        const values = ['hello', 'world', null, 'chilly', 'hi'];

        let col: Column<string>;

        beforeEach(() => {
            col = Column.fromJSON<string>(field, {
                type: FieldType.String
            }, values);
        });

        it('can shorten strings', () => {
            const args = { size: 3 };
            const api = dateFrameAdapter(truncateConfig, { args });
            const newCol = api.column(col);

            expect(newCol.toJSON()).toEqual([
                'hel',
                'wor',
                undefined,
                'chi',
                'hi',
            ]);
        });

        it('should throw if improper args are given', () => {
            expect(() => dateFrameAdapter(truncateConfig, { })).toThrowError(
                'No arguments were provided but truncate requires size to be set'
            );

            expect(() => dateFrameAdapter(truncateConfig, { args: { size: 'ha' as unknown as number } })).toThrowError(
                'Invalid argument value set at key size, expected String to be compatible with type Number'
            );

            expect(() => dateFrameAdapter(truncateConfig, { args: { size: -1231 } })).toThrowError(
                'Invalid parameter size, expected a positive integer, got -1231'
            );
        });
    });
});
