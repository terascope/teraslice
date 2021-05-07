import 'jest-extended';
import { getValidDate } from '@terascope/utils';
import { DateFormat, FieldType, Maybe } from '@terascope/types';
import formatDate from 'date-fns/format';
import {
    Column, dataFrameAdapter, functionConfigRepository, Vector
} from '../../src';

describe('Column (Date Types)', () => {
    describe('when field type is Date', () => {
        let col: Column<string|number>;
        const values: Maybe<any>[] = [
            '2020-09-23T14:54:21.020Z',
            '1941-08-20T07:00:00.000Z',
            '2020-09-23',
            1600875138416,
            null,
            new Date('2019-01-20T12:50:20.000Z'),
        ];

        beforeEach(() => {
            col = Column.fromJSON<string|number>('date', {
                type: FieldType.Date,
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
            expect(col.toJSON()).toEqual([
                '2020-09-23T14:54:21.020Z',
                '1941-08-20T07:00:00.000Z',
                '2020-09-23T00:00:00.000Z',
                '2020-09-23T15:32:18.416Z',
                undefined,
                '2019-01-20T12:50:20.000Z'
            ]);
        });

        it('should be able to get the Vector', () => {
            expect(col.vector).toBeInstanceOf(Vector);
        });

        it('should be able to transform using toString', () => {
            const newCol = dataFrameAdapter(
                functionConfigRepository.toString
            ).column(col);

            expect(newCol.id).not.toBe(col.id);
            expect(newCol.config).toEqual({
                ...col.config,
                type: FieldType.String
            });
            expect(newCol.toJSON()).toEqual([
                '2020-09-23T14:54:21.020Z',
                '1941-08-20T07:00:00.000Z',
                '2020-09-23T00:00:00.000Z',
                '2020-09-23T15:32:18.416Z',
                undefined,
                '2019-01-20T12:50:20.000Z'
            ]);
        });

        it('should be able to transform using toDate(format: "yyyy-MM-dd HH:mm:ss")', () => {
            const format = 'yyyy-MM-dd HH:mm:ss';
            const newCol = dataFrameAdapter(
                functionConfigRepository.toDate,
                { args: { format } }
            ).column(col);

            expect(newCol.id).not.toBe(col.id);
            expect(newCol.config).toEqual({
                ...col.config,
                format,
                type: FieldType.Date
            });
            expect(newCol.toJSON()).toEqual(values.map((value) => {
                if (value == null) return undefined;
                const date = getValidDate(value);
                if (date === false) return undefined;
                return formatDate(date.getTime() + (date.getTimezoneOffset() * 60_000), format);
            }));
        });

        test.todo('should NOT able to transform without using formatDate()');
    });

    describe('when field type is Keyword', () => {
        let col: Column<string>;
        const values: Maybe<string>[] = [
            '2020-09-23',
            undefined,
            '2020-01-20',
        ];

        beforeEach(() => {
            col = Column.fromJSON<string>('date_str', {
                type: FieldType.Keyword,
            }, values);
        });

        it('should be able to transform using toDate(format: "yyyy-MM-dd")', () => {
            const format = 'yyyy-MM-dd';
            const newCol = dataFrameAdapter(
                functionConfigRepository.toDate,
                { args: { format } }
            ).column(col);

            expect(newCol.id).not.toBe(col.id);
            expect(newCol.config).toEqual({
                ...col.config,
                format,
                type: FieldType.Date
            });
            expect(newCol.toJSON()).toEqual([
                '2020-09-23',
                undefined,
                '2020-01-20'
            ]);
        });

        it('should fail to transform toDate using an invalid format', () => {
            expect(() => {
                dataFrameAdapter(
                    functionConfigRepository.toDate,
                    { args: { format: 'M/d/YYYY' } }
                ).column(col);
            }).toThrowError(/Format string contains an unescaped latin alphabet character `Y`/);
        });
    });

    describe('when field type is Keyword (with time)', () => {
        let col: Column<string>;
        const values: Maybe<string>[] = [
            '2018-02-02 00:23:01',
            null,
            '2016-12-12 19:23:02',
        ];

        beforeEach(() => {
            col = Column.fromJSON<string>('date_str', {
                type: FieldType.Keyword,
            }, values);
        });

        it('should be able to transform using toDate(format: "yyyy-MM-dd HH:mm:ss")', () => {
            const format = 'yyyy-MM-dd HH:mm:ss';
            const newCol = dataFrameAdapter(
                functionConfigRepository.toDate,
                { args: { format } }
            ).column(col);

            expect(newCol.id).not.toBe(col.id);
            expect(newCol.config).toEqual({
                ...col.config,
                format,
                type: FieldType.Date
            });
            expect(newCol.toJSON()).toEqual([
                '2018-02-02 07:23:01',
                undefined,
                '2016-12-13 02:23:02',
            ]);
        });

        it('should fail to transform toDate using an invalid format', () => {
            expect(() => {
                dataFrameAdapter(
                    functionConfigRepository.toDate,
                    { args: { format: 'M/d/YYYY' } }
                ).column(col);
            }).toThrowError(/Format string contains an unescaped latin alphabet character `Y`/);
        });
    });

    test.todo('when field type is Keyword (with time and timezone)');

    describe('when field type is Integer (millisecond)', () => {
        let col: Column<number>;
        const values: Maybe<number>[] = [
            1600844405020,
            undefined,
            1579503620931,
        ];

        beforeEach(() => {
            col = Column.fromJSON<number>('unix_time', {
                type: FieldType.Number,
            }, values);
        });

        it('should be able to transform using toDate()', () => {
            const newCol = dataFrameAdapter(functionConfigRepository.toDate)
                .column(col);

            expect(newCol.id).not.toBe(col.id);
            expect(newCol.config).toEqual({
                ...col.config,
                type: FieldType.Date
            });
            expect(newCol.toJSON()).toEqual([
                '2020-09-23T07:00:05.020Z',
                undefined,
                '2020-01-20T07:00:20.931Z'
            ]);
        });

        it('should be able to transform using toDate(format: "milliseconds")', () => {
            const newCol = dataFrameAdapter(
                functionConfigRepository.toDate,
                { args: { format: DateFormat.milliseconds } }
            ).column(col);

            expect(newCol.id).not.toBe(col.id);
            expect(newCol.config).toEqual({
                ...col.config,
                format: DateFormat.milliseconds,
                type: FieldType.Date
            });
            expect(newCol.toJSON()).toEqual(values);
        });

        it('should fail to transform toDate using an invalid format', () => {
            expect(() => {
                dataFrameAdapter(
                    functionConfigRepository.toDate,
                    { args: { format: 'M/d/YYYY' } }
                ).column(col);
            }).toThrowError(/Format string contains an unescaped latin alphabet character `Y`/);
        });

        it('should return valid dates when transform toDate(format: "seconds")', () => {
            const newCol = dataFrameAdapter(
                functionConfigRepository.toDate,
                { args: { format: DateFormat.seconds } }
            ).column(col);

            expect(newCol.toJSON()).toEqual([
                1600844405,
                undefined,
                1579503620,
            ]);
        });
    });

    describe('when field type is Keyword (millisecond)', () => {
        let col: Column<string>;
        const values: Maybe<string>[] = [
            '1600844405020',
            null,
            '1579503620931',
        ];

        beforeEach(() => {
            col = Column.fromJSON<string>('unix_time_str', {
                type: FieldType.Keyword,
            }, values);
        });

        it('should fail when transforming using toDate', () => {
            expect(() => {
                dataFrameAdapter(
                    functionConfigRepository.toDate,
                ).column(col);
            }).toThrowError('Expected value 1600844405020 to be a valid date');
        });

        it('should fail to transform toDate using an invalid format', () => {
            expect(() => {
                dataFrameAdapter(
                    functionConfigRepository.toDate,
                    { args: { format: 'M/d/yyyy' } }
                ).column(col);
            }).toThrowError('Expected value 1600844405020 to be a valid date');
        });
    });

    describe('when field type is Integer (seconds)', () => {
        let col: Column<number>;
        const values: Maybe<number>[] = [
            1600844405,
            undefined,
            1579503621,
        ];

        beforeEach(() => {
            col = Column.fromJSON<number>('unix_time', {
                type: FieldType.Number,
                format: DateFormat.seconds
            }, values);
        });

        it('should be able to transform using toDate(format: "seconds")', () => {
            const newCol = dataFrameAdapter(
                functionConfigRepository.toDate,
                { args: { format: DateFormat.seconds } }
            ).column(col);

            expect(newCol.id).not.toBe(col.id);
            expect(newCol.config).toEqual({
                ...col.config,
                format: DateFormat.seconds,
                type: FieldType.Date
            });
            expect(newCol.toJSON()).toEqual(values);
        });

        it('should fail to transform toDate using an invalid format', () => {
            expect(() => {
                dataFrameAdapter(
                    functionConfigRepository.toDate,
                    { args: { format: 'M/d/YYYY' } }
                ).column(col);
            }).toThrowError(/Format string contains an unescaped latin alphabet character `Y`/);
        });

        it('should return invalid dates when transform toDate(format: "milliseconds")', () => {
            const newCol = dataFrameAdapter(
                functionConfigRepository.toDate,
                { args: { format: DateFormat.milliseconds } }
            ).column(col);

            expect(newCol.toJSON()).toEqual([
                1600844405000,
                undefined,
                1579503621000,
            ]);
        });
    });
});
