import 'jest-fixtures';
import { FieldType, Maybe } from '@terascope/types';
import { Column } from '../../src';

describe('Column', () => {
    describe(`when field type is ${FieldType.Keyword}`, () => {
        let col: Column<string>;
        const values: Maybe<string>[] = [
            'Batman',
            'Robin',
            'Superman',
            null,
            'Spiderman',
        ];
        beforeEach(() => {
            col = new Column<string>('name', {
                type: FieldType.Keyword,
            }, values);
        });

        it('should have the values (but not the same reference)', () => {
            // @ts-expect-error (it is protected)
            const internal = col._values;
            expect(internal).not.toBe(values);
            expect(internal).toEqual(values);
        });

        it('should have the correct length', () => {
            expect(col.length).toEqual(values.length);
        });

        it('should be able to iterate over the values', () => {
            expect([...col]).toEqual(values);
        });
    });
});
