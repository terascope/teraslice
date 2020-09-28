import 'jest-fixtures';
import { FieldType, Maybe } from '@terascope/types';
import {
    ColumnValidator,
    Column, ColumnTransform, Vector
} from '../../src';

describe('Column (String Types)', () => {
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
            col = Column.fromJSON<string>('name', {
                type: FieldType.Keyword,
            }, values);
        });

        it('should have the correct size', () => {
            expect(col.size).toEqual(values.length);
        });

        it('should have the same id when forked with the same vector', () => {
            expect(col.fork(col.vector).id).toEqual(col.id);
        });

        it('should NOT have the same id when forked with a different vector', () => {
            const vector = col.vector.slice(0, 2);
            expect(col.fork(vector).id).not.toEqual(col.id);
        });

        it('should be able to iterate over the values', () => {
            expect([...col]).toEqual(values);
            expect(col.toJSON()).toEqual(values);
        });

        it('should be able to get the Vector', () => {
            expect(col.vector).toBeInstanceOf(Vector);
        });

        it('should be able to validate using isURL', () => {
            const newCol = col.validate(ColumnValidator.isURL);
            expect(newCol.id).not.toBe(col.id);
            expect(newCol.toJSON()).toEqual(values.map(() => null));
        });

        it('should be able to transform using toUpperCase', () => {
            const newCol = col.transform(ColumnTransform.toUpperCase);

            expect(newCol.id).not.toBe(col.id);
            expect(newCol.config).toEqual(col.config);
            expect(newCol.toJSON()).toEqual(values.map((value) => {
                if (typeof value === 'string') return value.toUpperCase();
                return null;
            }));
        });

        it('should be able to transform using toLowerCase', () => {
            const newCol = col.transform(ColumnTransform.toLowerCase);

            expect(newCol.id).not.toBe(col.id);
            expect(newCol.config).toEqual(col.config);
            expect(newCol.toJSON()).toEqual(values.map((value) => {
                if (typeof value === 'string') return value.toLowerCase();
                return null;
            }));
        });

        test.todo('should be immutable');
    });
});
