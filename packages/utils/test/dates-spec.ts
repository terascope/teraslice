import 'jest-extended';
import { DateFormat, ISO8601DateSegment } from '@terascope/types';
import {
    isISO8601,
    parseDateValue,
    formatDateValue,
    trimISODateSegment,
    getTimeBetween
} from '../src/dates';

describe('date utils', () => {
    describe('isISO8601', () => {
        test.each([
            ['1970/10/10 01:20:15', false],
            ['1970-10-10 01:20:15', true],
            ['1970-10-1001:20:15', false],
            ['1970-10-10T01:20:15', true],
            ['2001-01-01T01:00:00.000Z', true],
            [102390933, false],
        ])('should handle %p and return %p', (input, expected) => {
            expect(isISO8601(input)).toBe(expected);
        });
    });

    describe('trimISODateSegment', () => {
        test.each([
            ['1970-10-10T01:20:15.000Z', ISO8601DateSegment.hourly, '1970-10-10T01:00:00.000Z'],
            ['1970-10-10T01:20:15.000Z', ISO8601DateSegment.daily, '1970-10-10T00:00:00.000Z'],
            ['1970-10-10T01:20:15.000Z', ISO8601DateSegment.monthly, '1970-10-01T00:00:00.000Z'],
            ['1970-10-10T01:20:15.000Z', ISO8601DateSegment.yearly, '1970-01-01T00:00:00.000Z'],
        ])('should handle %p (segment %p) and return %p', (input, segment, expected) => {
            expect(new Date(trimISODateSegment(segment)(input)).toISOString()).toBe(expected);
        });

        it('should throw if given a non ISO 8601 date', () => {
            expect(() => {
                trimISODateSegment(ISO8601DateSegment.hourly)('example');
            }).toThrowError('Expected example (String) to be in a standard date format');
        });
    });

    describe('parseDateValue', () => {
        const referenceDate = new Date();
        test.each([
            ['1970-10-10', 'yyyy-MM-dd', 24364800000],
            ['2001-01-01T01:00:00.000Z', DateFormat.iso_8601, 978310800000],
            [102390933, DateFormat.epoch, 102390933000],
            [BigInt(102390933), DateFormat.epoch, 102390933000],
            [-102390933, DateFormat.seconds, -102390933000],
        ])('should handle %p and return %p', (input, format, expected) => {
            expect(parseDateValue(input, format, referenceDate)).toBe(expected);
        });
    });

    describe('formatDateValue', () => {
        test.each([
            [24364800000, 'yyyy-MM-dd', '1970-10-10'],
            [978310800000, DateFormat.iso_8601, '2001-01-01T01:00:00.000Z'],
            [102390933000, DateFormat.epoch, 102390933],
            [-102390933000, DateFormat.seconds, -102390933],
            [102390933000, DateFormat.milliseconds, 102390933000],
            [-102390933000, DateFormat.epoch_millis, -102390933000],
        ])('should handle %p and return %p', (input, format, expected) => {
            expect(formatDateValue(input, format)).toBe(expected);
            expect(formatDateValue(new Date(input), format)).toBe(expected);
        });
    });

    describe('getTimeBetween', () => {
        test.each([
            ['2021-05-10T10:00:00.000Z', '2021-05-10T09:00:00.000Z', 'milliseconds', 3600000],
            ['2021-05-10T10:00:00.000Z', '2021-05-10T11:00:00.074Z', 'milliseconds', -3600074],
            ['2021-05-10T10:00:00.000Z', '2021-05-10T08:01:02.022Z', 'seconds', 7137],
            ['2021-05-10T10:00:00.000Z', '2021-05-10T11:01:33.192Z', 'seconds', -3693],
            ['2021-05-10T10:00:00.000Z', '2021-05-10T09:00:00.000Z', 'minutes', 60],
            ['2021-05-10T10:00:00.000Z', '2021-05-10T09:00:30.000Z', 'minutes', 59],
            ['2021-05-10T10:00:00.000Z', '2021-05-10T02:01:33.192Z', 'hours', 7],
            ['2021-05-10T10:00:00.000Z', '2021-05-05T11:01:33.192Z', 'days', 4],
            ['2021-05-10T10:00:00.000Z', '2021-05-03T11:01:33.192Z', 'calendarDays', 7],
            ['2021-05-10T10:00:00.000Z', '2021-05-03T11:01:33.192Z', 'businessDays', 5],
            ['2021-05-10T10:00:00.000Z', '2021-05-01T11:01:33.192Z', 'weeks', 1],
            ['2021-05-10T10:00:00.000Z', '2021-04-10T11:01:33.192Z', 'calendarWeeks', 5],
            ['2021-05-10T10:00:00.000Z', '2021-04-09T11:01:33.192Z', 'months', 1],
            ['2021-05-10T10:00:00.000Z', '2021-02-02T11:01:33.192Z', 'calendarMonths', 3],
            ['2021-05-10T10:00:00.000Z', '2021-01-10T11:01:33.192Z', 'quarters', 1],
            ['2021-05-10T10:00:00.000Z', '2020-01-10T11:01:33.192Z', 'calendarQuarters', 5],
            ['2021-05-10T10:00:00.000Z', '2020-05-09T11:01:33.192Z', 'years', 1],
            ['2021-05-10T10:00:00.000Z', '2019-05-10T11:01:33.192Z', 'calendarYears', 2],
            ['2021-05-10T10:00:00.000Z', '2019-05-10T11:01:33.192Z', 'calendarISOWeekYears', 2],
            ['2021-05-10T10:00:00.000Z', '2019-05-10T11:01:33.192Z', 'isoWeekYears', 1],
            ['2021-05-10T10:00:00.000Z', '2010-01-09T11:01:33.192Z', 'isoDuration', 'P11Y4M0DT22H58M26S']
        ])('should return duration between %p and %p, in %p as %p', (input, start, format, expected) => {
            const args: { start: any, format: any } = { start, format };

            expect(getTimeBetween(input, args)).toBe(expected);
        });

        test.each([
            ['2021-05-10T10:00:00.000Z', '2021-05-10T11:00:00.074Z', 'milliseconds', 3600074],
            ['2021-05-10T10:00:00.000Z', '2021-05-10T11:01:33.192Z', 'seconds', 3693],
            ['2021-05-10T10:00:00.000Z', '2021-05-10T11:01:00.000Z', 'minutes', 61],
            ['2021-05-10T10:00:00.000Z', '2021-05-10T17:01:33.192Z', 'hours', 7],
            ['2021-05-10T10:00:00.000Z', '2021-05-05T11:01:33.192Z', 'days', -4],
            ['2021-05-10T10:00:00.000Z', '2021-05-17T11:01:33.192Z', 'calendarDays', 7],
            ['2021-05-10T10:00:00.000Z', '2021-05-16T11:01:33.192Z', 'businessDays', 5],
            ['2021-05-10T10:00:00.000Z', '2021-05-30T11:01:33.192Z', 'weeks', 2],
            ['2021-05-10T10:00:00.000Z', '2021-06-10T11:01:33.192Z', 'calendarWeeks', 4],
            ['2021-05-10T10:00:00.000Z', '2021-07-02T11:01:33.192Z', 'calendarMonths', 2],
            ['2021-05-10T10:00:00.000Z', '2021-09-10T11:01:33.192Z', 'quarters', 1],
            ['2021-05-10T10:00:00.000Z', '2022-01-10T11:01:33.192Z', 'calendarQuarters', 3],
            ['2021-05-10T10:00:00.000Z', '2021-04-09T11:01:33.192Z', 'months', -1],
            ['2021-05-10T10:00:00.000Z', '2022-08-18T11:01:33.192Z', 'years', 1],
            ['2021-05-10T10:00:00.000Z', '2024-05-10T11:01:33.192Z', 'calendarYears', 3],
            ['2021-05-10T10:00:00.000Z', '2028-05-10T11:01:33.192Z', 'calendarISOWeekYears', 7],
            ['2021-05-10T10:00:00.000Z', '2024-05-10T11:01:33.192Z', 'isoWeekYears', 3],
            ['2021-05-10T10:00:00.000Z', '2023-01-09T18:19:23.132Z', 'isoDuration', 'P1Y7M30DT8H19M23S']
        ])('should return duration between %p and %p, in %p as %p', (input, end, format, expected) => {
            const args: { end: any, format: any } = { end, format };

            expect(getTimeBetween(input, args)).toBe(expected);
        });

        test.each([
            [1620764444501, 1620764444511, 'milliseconds', 10],
            [1620764444501, 1715472000000, 'years', 3],
            [1620764444501, '2028-05-10T11:01:33.192Z', 'milliseconds', 220804848691],
            [1620764444501, '2028-05-10', 'milliseconds', 220765155499],
            [1620764444501, '05/10/2028', 'milliseconds', 220790355499],
        ])('should return duration between %p and %p, in %p as %p', (input, end, format, expected) => {
            const args: { end: any, format: any } = { end, format };

            expect(getTimeBetween(input, args)).toBe(expected);
        });

        it('should throw if end and start are missing', () => {
            expect(() => { getTimeBetween('2021-05-10T10:00:00.000Z', { format: 'seconds' }); })
                .toThrowError('Must provide a start or an end argument');
        });
    });
});
