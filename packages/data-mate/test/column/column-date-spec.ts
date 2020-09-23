import 'jest-fixtures';
import { FieldType, Maybe } from '@terascope/types';
import formatDate from 'date-fns/format';
import { getValidDate } from '@terascope/utils';
import {
    Column, ColumnTransform, DateValue, Vector
} from '../../src';

describe('Column (Date Types)', () => {
    describe(`when field type is ${FieldType.Date}`, () => {
        let col: Column<DateValue>;
        const values: Maybe<any>[] = [
            '2020-09-23T14:54:21.020Z',
            '2020-09-23',
            1600875138416,
            null,
            new Date('2019-01-20T12:50:20.000Z'),
        ];

        beforeEach(() => {
            col = Column.fromJSON<DateValue>({
                name: 'date',
                config: {
                    type: FieldType.Date,
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
            const vals = values.map((val) => {
                if (val == null) return null;
                return new Date(val).getTime();
            });
            expect([...col]).toEqual(vals);

            expect(col.toJSON()).toEqual(vals);
        });

        it('should be able to get the Vector', () => {
            expect(col.vector).toBeInstanceOf(Vector);
        });

        it('should be able to transform using toString', () => {
            const newCol = col.transform(ColumnTransform.toString);

            expect(newCol.id).not.toBe(col.id);
            expect(newCol.config).toEqual({
                ...col.config,
                type: FieldType.String
            });
            expect(newCol.toJSON()).toEqual(values.map((value) => {
                if (value == null) return null;
                return new Date(value).toISOString();
            }));
        });

        it('should be able to transform using formatDate', () => {
            const newCol = col.transform(ColumnTransform.formatDate, {
                format: 'Pp'
            });

            expect(newCol.id).not.toBe(col.id);
            expect(newCol.config).toEqual({
                ...col.config,
                type: FieldType.Keyword
            });
            expect(newCol.toJSON()).toEqual(values.map((value) => {
                if (value == null) return null;
                const date = getValidDate(value);
                if (date === false) return false;
                return formatDate(date, 'Pp');
            }));
        });
    });
});
