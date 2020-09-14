import 'jest-fixtures';
import { FieldType, Maybe } from '@terascope/types';
import {
    Column, Vector
} from '../src';

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
            col = Column.fromJSON<string>({
                name: 'name',
                config: {
                    type: FieldType.Keyword,
                },
            }, values);
        });

        it('should have the correct size', () => {
            expect(col.count()).toEqual(values.length);
        });

        it('should have the same id when forked with the same vector', () => {
            expect(col.fork().id).toEqual(col.id);
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

        test.todo('should be immutable');
        test.todo('->map');
        test.todo('->reduce');
        test.todo('->filter');
        test.todo('->transform');
    });
});
