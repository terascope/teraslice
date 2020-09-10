import 'jest-fixtures';
import { FieldType, Maybe } from '@terascope/types';
import { Column, Vector } from '../../src';

describe('Column', () => {
    describe(`when field type is ${FieldType.Keyword}`, () => {
        let col: Column<string>;
        const values: Maybe<string>[] = [
            'Batman',
            'Robin',
            'Superman',
            null,
            'SpiderMan',
        ];
        beforeEach(() => {
            col = new Column<string>({
                name: 'name',
                config: {
                    type: FieldType.Keyword,
                },
                values
            });
        });

        it('should have the correct size', () => {
            expect(col.size).toEqual(values.length);
        });

        it('should be able to iterate over the values', () => {
            expect([...col]).toEqual(values);
            expect(col.toJSON()).toEqual(values);
        });

        it('should be able to get the Vector', () => {
            expect(col.vector).toBeInstanceOf(Vector);
        });
    });
});
