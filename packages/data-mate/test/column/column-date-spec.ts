import 'jest-fixtures';
import { DateFormat, FieldType, Maybe } from '@terascope/types';
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
            expect(col.size).toEqual(values.length);
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
                return new Date(val).toISOString();
            });
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

        it('should be able to transform using formatDate(format: "pP")', () => {
            const newCol = col.transform(ColumnTransform.formatDate, {
                format: 'Pp'
            });

            expect(newCol.id).not.toBe(col.id);
            expect(newCol.config).toEqual({
                ...col.config,
                format: 'Pp',
                type: FieldType.Date
            });
            expect(newCol.toJSON()).toEqual(values.map((value) => {
                if (value == null) return null;
                const date = getValidDate(value);
                if (date === false) return false;
                return formatDate(date, 'Pp');
            }));
        });

        test.todo('should NOT able to transform without using formatDate()');
    });

    describe(`when field type is ${FieldType.Keyword}`, () => {
        let col: Column<string>;
        const values: Maybe<string>[] = [
            '2020-09-23',
            null,
            '2020-01-20',
        ];

        beforeEach(() => {
            col = Column.fromJSON<string>({
                name: 'date_str',
                config: {
                    type: FieldType.Keyword,
                },
            }, values);
        });

        it('should be able to transform using toDate(format: "yyyy-MM-dd")', () => {
            const newCol = col.transform(ColumnTransform.toDate, {
                format: 'yyyy-MM-dd'
            });

            expect(newCol.id).not.toBe(col.id);
            expect(newCol.config).toEqual({
                ...col.config,
                format: 'yyyy-MM-dd',
                type: FieldType.Date
            });
            expect(newCol.toJSON()).toEqual(values);
        });

        it('should fail to transform toDate using an invalid format', () => {
            expect(() => {
                col.transform(ColumnTransform.toDate, {
                    format: 'M/d/yyyy'
                });
            }).toThrowError(/Expected value .* to be a date string with format/);
        });
    });

    describe(`when field type is ${FieldType.Keyword} (with time)`, () => {
        let col: Column<string>;
        const values: Maybe<string>[] = [
            '2018-02-02 00:23:01',
            null,
            '2016-12-12 19:23:02',
        ];

        beforeEach(() => {
            col = Column.fromJSON<string>({
                name: 'date_str',
                config: {
                    type: FieldType.Keyword,
                },
            }, values);
        });

        it('should be able to transform using toDate(format: "yyyy-MM-dd HH:mm:ss")', () => {
            const newCol = col.transform(ColumnTransform.toDate, {
                format: 'yyyy-MM-dd HH:mm:ss'
            });

            expect(newCol.id).not.toBe(col.id);
            expect(newCol.config).toEqual({
                ...col.config,
                format: 'yyyy-MM-dd HH:mm:ss',
                type: FieldType.Date
            });
            expect(newCol.toJSON()).toEqual([
                '2018-02-02 00:23:01',
                null,
                '2016-12-12 19:23:02',
            ]);
        });

        it('should fail to transform toDate using an invalid format', () => {
            expect(() => {
                col.transform(ColumnTransform.toDate, {
                    format: 'M/d/yyyy'
                });
            }).toThrowError(/Expected value .* to be a date string with format/);
        });
    });

    describe(`when field type is ${FieldType.Keyword} (with time and timezone)`, () => {
        let col: Column<string>;
        const values: Maybe<string>[] = [
            '2018-02-02 00:23:0 -08:00',
            null,
            '2016-12-12 19:23:02 +02:00',
        ];

        beforeEach(() => {
            col = Column.fromJSON<string>({
                name: 'date_str',
                config: {
                    type: FieldType.Keyword,
                },
            }, values);
        });

        it('should be able to transform using toDate', () => {
            const newCol = col.transform(ColumnTransform.toDate, {
                format: 'yyyy-MM-dd HH:mm:ss xxx'
            });

            expect(newCol.id).not.toBe(col.id);
            expect(newCol.config).toEqual({
                ...col.config,
                format: 'yyyy-MM-dd HH:mm:ss xxx',
                type: FieldType.Date
            });
            expect(newCol.toJSON()).toEqual(values);
        });

        it('should fail to transform toDate using an invalid format', () => {
            expect(() => {
                col.transform(ColumnTransform.toDate, {
                    format: 'M/d/yyyy'
                });
            }).toThrowError(/Expected value .* to be a date string with format/);
        });
    });

    describe(`when field type is ${FieldType.Integer} (millisecond)`, () => {
        let col: Column<number>;
        const values: Maybe<number>[] = [
            1600844405020,
            null,
            1579503620931,
        ];

        beforeEach(() => {
            col = Column.fromJSON<number>({
                name: 'unix_time',
                config: {
                    type: FieldType.Number,
                },
            }, values);
        });

        it('should be able to transform using toDate()', () => {
            const newCol = col.transform(ColumnTransform.toDate);

            expect(newCol.id).not.toBe(col.id);
            expect(newCol.config).toEqual({
                ...col.config,
                format: DateFormat.epoch_millis,
                type: FieldType.Date
            });
            expect(newCol.toJSON()).toEqual(values);
        });

        it('should be able to transform using toDate(format: "milliseconds")', () => {
            const newCol = col.transform(ColumnTransform.toDate, {
                format: DateFormat.milliseconds
            });

            expect(newCol.id).not.toBe(col.id);
            expect(newCol.config).toEqual({
                ...col.config,
                format: DateFormat.epoch_millis,
                type: FieldType.Date
            });
            expect(newCol.toJSON()).toEqual(values);
        });

        it('should fail to transform toDate using an invalid format', () => {
            expect(() => {
                col.transform(ColumnTransform.toDate, {
                    format: 'M/d/yyyy'
                });
            }).toThrowError('Expected string values when using toDate({ format })');
        });

        it('should return invalid dates when transform toDate(format: "seconds")', () => {
            const newCol = col.transform(ColumnTransform.toDate, {
                format: DateFormat.seconds
            });

            expect(newCol.toJSON()).toEqual([
                1600844405020,
                null,
                1579503620931,
            ]);
        });
    });

    describe(`when field type is ${FieldType.Keyword} (millisecond)`, () => {
        let col: Column<string>;
        const values: Maybe<string>[] = [
            '1600844405020',
            null,
            '1579503620931',
        ];

        beforeEach(() => {
            col = Column.fromJSON<string>({
                name: 'unix_time_str',
                config: {
                    type: FieldType.Keyword,
                },
            }, values);
        });

        it('should fail when transforming using toDate', () => {
            expect(() => {
                col.transform(ColumnTransform.toDate);
            }).toThrowError('Expected value 1600844405020 to be a valid date');
        });

        it('should fail to transform toDate using an invalid format', () => {
            expect(() => {
                col.transform(ColumnTransform.toDate, {
                    format: 'M/d/yyyy'
                });
            }).toThrowError('Expected value 1600844405020 to be a date string with format M/d/yyyy');
        });
    });

    describe(`when field type is ${FieldType.Integer} (seconds)`, () => {
        let col: Column<number>;
        const values: Maybe<number>[] = [
            1600844405,
            null,
            1579503621,
        ];

        beforeEach(() => {
            col = Column.fromJSON<number>({
                name: 'unix_time',
                config: {
                    type: FieldType.Number,
                },
            }, values);
        });

        it('should be able to transform using toDate(format: "seconds")', () => {
            const newCol = col.transform(ColumnTransform.toDate, {
                format: DateFormat.seconds
            });

            expect(newCol.id).not.toBe(col.id);
            expect(newCol.config).toEqual({
                ...col.config,
                format: DateFormat.epoch,
                type: FieldType.Date
            });
            expect(newCol.toJSON()).toEqual(values);
        });

        it('should fail to transform toDate using an invalid format', () => {
            expect(() => {
                col.transform(ColumnTransform.toDate, {
                    format: 'M/d/yyyy'
                });
            }).toThrowError('Expected string values when using toDate({ format })');
        });

        it('should return invalid dates when transform toDate(format: "milliseconds")', () => {
            const newCol = col.transform(ColumnTransform.toDate, {
                format: DateFormat.milliseconds
            });

            expect(newCol.toJSON()).toEqual([
                1600844405,
                null,
                1579503621,
            ]);
        });
    });
});
