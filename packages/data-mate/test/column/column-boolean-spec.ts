import 'jest-fixtures';
import { FieldType, Maybe } from '@terascope/types';
import { toBoolean } from '@terascope/utils';
import {
    ColumnValidator,
    Column, ColumnTransform, Vector
} from '../../src';

describe('Column (Boolean Types)', () => {
    describe(`when field type is ${FieldType.Boolean}`, () => {
        let col: Column<boolean>;
        const values: Maybe<boolean>[] = [
            true,
            false,
            true,
            null,
            false,
        ];
        beforeEach(() => {
            col = Column.fromJSON<boolean>({
                name: 'active',
                config: {
                    type: FieldType.Boolean,
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

        it('should be able to validate the values', () => {
            const newCol = col.validate(ColumnValidator.isBoolean);
            expect(newCol.id).not.toBe(col.id);
            expect([...newCol]).toEqual(values);
        });
    });

    describe(`when field type is ${FieldType.Keyword}`, () => {
        let col: Column<string>;
        const values: Maybe<string>[] = [
            'True',
            'yes',
            'no',
            null,
            'NO',
            'False',
            'NOT_BOOLEAN',
            'WHO'
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

        it('should be able to validate using isBoolean', () => {
            const newCol = col.validate(ColumnValidator.isBoolean);
            expect(newCol.id).not.toBe(col.id);
            expect([...newCol]).toEqual(
                values.map(() => null)
            );
        });

        it('should be able to validate using isBooleanLike', () => {
            const newCol = col.validate(ColumnValidator.isBooleanLike);
            expect(newCol.id).not.toBe(col.id);
            expect([...newCol]).toEqual([
                'True',
                'yes',
                'no',
                null,
                'NO',
                'False',
                null,
                null
            ]);
        });

        it('should be able to transform the column using toBoolean', () => {
            const newCol = col.transform(ColumnTransform.toBoolean);

            expect(newCol.id).not.toBe(col.id);
            expect(newCol.config).toEqual({
                ...col.config,
                type: FieldType.Boolean
            });
            expect([...newCol]).toEqual(values.map((value) => {
                if (value == null) return null;
                return toBoolean(value);
            }));
        });
    });
});
