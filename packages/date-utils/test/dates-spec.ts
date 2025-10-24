import 'jest-extended';
import { DateFormat, ISO8601DateSegment, DateTuple } from '@terascope/types';
import {
    isISO8601,
    toISO8601,
    parseDateValue,
    formatDateValue,
    trimISODateSegment,
    getTimeBetween,
    setTimezone,
    isBefore,
    isAfter,
    isBetween,
    getTimezoneOffset,
    getTimezoneOffsetFP,
    setMilliseconds,
    setSeconds,
    setMinutes,
    setHours,
    setDate,
    setMonth,
    setYear,
    getMilliseconds,
    getSeconds,
    getMinutes,
    getHours,
    getDate,
    getMonth,
    getYear,
    getUTCMinutes,
    getUTCHours,
    getUTCDate,
    getUTCMonth,
    getUTCYear,
    addToDate,
    subtractFromDate,
    toTimeZone,
} from '../src/index.js';

describe('date utils', () => {
    describe('isISO8601', () => {
        test.each([
            ['1970/10/10 01:20:15', false],
            ['1970-10-10 01:20:15', true],
            ['1970-10-1001:20:15', false],
            ['1970-10-10T01:20:15', true],
            ['2001-01-01T01:00:00.000Z', true],
            ['2001-01-01T01:00:00.000+03:00', true],
            [102390933, false],
        ])('should handle %p and return %p', (input, expected) => {
            expect(isISO8601(input)).toBe(expected);
        });
    });

    describe('toISO8601', () => {
        test.each([
            [978310800000, '2001-01-01T01:00:00.000Z'],
            [[978310800000, 3 * 60], '2001-01-01T04:00:00.000+03:00'],
        ])('should handle %p and return %p', (input, expected) => {
            expect(toISO8601(input)).toEqual(expected);
        });
    });

    describe('toTimeZone', () => {
        test.each([
            ['2001-03-19T10:36:44.450Z', 'Africa/Ndjamena', [984998204450, 60]],
            [new Date('2001-03-19T10:36:44.450Z'), 'Africa/Ndjamena', [984998204450, 60]],
            [new Date('2001-03-19T10:36:44.450Z').getTime(), 'Africa/Ndjamena', [984998204450, 60]],
            ['2023-08-22T15:41:50.172Z', 'America/Phoenix', [1692718910172, -420]],
            ['2023-08-22T15:41:50.172Z', 'America/New_York', [1692718910172, -240]],
            ['2023-11-22T15:41:50.172Z', 'America/New_York', [1700667710172, -300]],
            ['2023-11-22T15:41:50.172Z', 'America/Phoenix', [1700667710172, -420]],
        ])('should handle %p with timezone %p and return %p', (input, timezone, expected) => {
            expect(toTimeZone(input, timezone)).toEqual(expected);
        });
    });

    describe('setTimezone', () => {
        test.each([
            ['2001-01-01T01:00:00.000Z', 4 * 60, [978310800000, 4 * 60]],
            ['2001-01-01T04:00:00.000+03:00', 2 * 60, [978310800000, 2 * 60]],
        ])('should handle %p with timezone %p and return %p', (input, timezone, expected) => {
            expect(setTimezone(input, timezone)).toEqual(expected);
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
            }).toThrow('Expected example (String) to be in a standard date format');
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
            [new Date(102390933000), DateFormat.milliseconds, 102390933000],
            [-102390933000, DateFormat.epoch_millis, -102390933000],
            [new Date('2021-06-03T22:46:15.244Z'), 'MM/dd/yy', '06/03/21'],
            [[1622760480654, 60] as DateTuple, DateFormat.iso_8601, '2021-06-03T23:48:00.654+01:00'],
            [[1622760480654, 60] as DateTuple, 'MM/dd/yyyy', '06/03/2021'],
        ])('should handle %p and return %p', (input, format, expected) => {
            expect(formatDateValue(input, format)).toBe(expected);
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
            ['2021-05-10T10:00:00.000Z', '2019-05-10T11:01:33.192Z', 'ISOWeekYears', 1],
            ['2021-05-10T10:00:00.000Z', '2010-01-09T11:01:33.192Z', 'ISO8601', 'P11Y4M0DT22H58M26S'],
            [[1620640800000, 0], '2021-05-10T09:59:00.000Z', 'milliseconds', 60000],
            [[1620640800000, -60], '2021-05-10T09:59:00.000-01:00', 'milliseconds', -7140000],
            [[1620640800000, -60], '2021-05-10T09:59:00.000+02:00', 'milliseconds', 3660000],
            [[1620640800000, -60], '2021-05-10T10:00:00.000-02:00', 'milliseconds', -10800000]
        ])('should return duration between %p and %p, in %p as %p for start values', (input, start, interval, expected) => {
            const args: { start: any; interval: any } = { start, interval };

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
            ['2021-05-10T10:00:00.000Z', '2024-05-10T11:01:33.192Z', 'ISOWeekYears', 3],
            ['2021-05-10T10:00:00.000Z', '2023-01-09T18:19:23.132Z', 'ISO8601', 'P1Y7M30DT8H19M23S'],
            [[1620640800000, -60], '2021-05-10T10:00:00.000-02:00', 'milliseconds', 10800000]
        ])('should return duration between %p and %p, in %p as %p for end values', (input, end, interval, expected) => {
            const args: { end: any; interval: any } = { end, interval };

            expect(getTimeBetween(input, args)).toBe(expected);
        });

        test.each([
            [1620764444501, 1620764444511, 'milliseconds', 10],
            [1620764444501, 1715472000000, 'years', 3],
            [1620764444501, '2028-05-10T11:01:33.192Z', 'milliseconds', 220804848691],
            [1620764444501, '2028-05-10', 'milliseconds', 220765155499],
            [1620764444501, '05/10/2028 UTC', 'milliseconds', 220765155499],
            [new Date(1620764444501), new Date('2028-05-10T11:01:33.192Z'), 'milliseconds', 220804848691],
        ])('should return duration between %p and %p, in %p as %p for different date intervals', (input, end, interval, expected) => {
            const args: { end: any; interval: any } = { end, interval };

            expect(getTimeBetween(input, args)).toBe(expected);
        });

        it('should throw if end and start are missing', () => {
            expect(() => {
                getTimeBetween('2021-05-10T10:00:00.000Z', { interval: 'seconds' });
            })
                .toThrow('Must provide a start or an end argument');
        });

        it('should throw if input is an invalid date', () => {
            expect(() => {
                getTimeBetween('bad date', { start: 1715472000000, interval: 'seconds' });
            })
                .toThrow('Expected bad date (String) to be in a standard date format');
        });

        it('should throw if start or end arg is an invalid date', () => {
            expect(() => {
                getTimeBetween('1715472000000', { start: 'bad date', interval: 'seconds' });
            })
                .toThrow('Expected bad date (String) to be in a standard date format');
        });
    });

    describe('isBefore', () => {
        test.each([
            ['2021-05-10T10:00:00.000Z', '2021-05-10T10:00:00.001Z', true],
            ['2021-05-10T10:00:00.000Z', '2199-12-31T23:00:00.001Z', true],
            [[1620640800000, 0], '2021-05-10T10:00:00.001Z', true],
            [[1620640800000, 0], [1620640800001, 0], true],
            [[1620640800000, -420], '2021-05-10T10:00:00.001Z', true],
            ['2021-05-10T10:00:00.000Z', '2021-05-09T10:00:00.001Z', false],
            [1620764444501, 1715472000000, true],
            [1620764444501, new Date(1715472000000), true],
            [new Date(1620764444501), new Date(1715472000000), true],
            ['bad date', new Date(1715472000000), false],
            [1620764444501, 'bad date', false],
            [null, '2021-05-09T10:00:00.001Z', false],
        ])('for input %p and date %p return %p', (input, date, expected) => {
            expect(isBefore(input, date as Date)).toEqual(expected);
        });
    });

    describe('isAfter', () => {
        test.each([
            ['2021-05-10T10:00:00.001Z', '2021-05-10T10:00:00.000Z', true],
            ['2199-12-31T23:00:00.001Z', '2021-05-10T10:00:00.000Z', true],
            [new Date('2199-12-31T23:00:00.001Z'), new Date('2021-05-10T10:00:00.000Z'), true],
            [[1620640800000, 0], '2021-05-10T09:59:59.999Z', true],
            [[1620640800001, 0], [1620640800000, 0], true],
            [[1620640800000, 420], '2021-05-10T10:00:00.001Z', true],
            ['2021-05-09T10:00:00.001Z', '2021-05-10T10:00:00.000Z', false],
            [1715472000000, 1620764444501, true],
            [new Date(1715472000000), 1620764444501, true],
            [new Date(1715472000000), new Date(1620764444501), true],
            [new Date(1715472000000), 'bad date', false],
            ['bad date', 1620764444501, false],
            [null, '2021-05-09T10:00:00.001Z', false],
        ])('for input %p and date %p return %p', (input, date, expected) => {
            expect(isAfter(input, date as Date)).toEqual(expected);
        });
    });

    describe('isBetween', () => {
        test.each([
            ['2021-05-10T10:00:00.001Z', '2021-05-10T10:00:00.000Z', '2021-05-10T10:00:00.002Z', true],
            ['2199-12-31T23:00:00.001Z', '1872-05-10T10:00:00.000Z', '2499-01-31T23:00:00.001Z', true],
            [[1620640800000, 0], [1620640800000, 60], [1620640800000, -60], false],
            ['2021-05-10T10:00:00.003Z', '2021-05-10T10:00:00.000Z', '2021-05-10T10:00:00.002Z', false],
            ['2021-05-10T10:00:00.000Z', '2021-05-10T10:00:00.001Z', '2021-05-10T10:00:00.003Z', false],
            ['1872-05-10T10:00:00.000Z', '2199-12-31T23:00:00.001Z', '2499-01-31T23:00:00.001Z', false],
            ['2199-12-31T23:00:00.001Z', '2499-01-31T23:00:00.001Z', '1872-05-10T10:00:00.000Z', false],
            ['1272-12-31T23:00:00.001Z', '2499-01-31T23:00:00.001Z', '3129-05-10T10:00:00.000Z', false],
            [1715472000000, 1620764444501, 1725492002001, true],
            [1, -10, 10, true],
            [1620764444501, -1002332430, 1725492002001, true],
            [-1002332430, 1620764444501, 1725492002001, false],
            [new Date(1715472000000), new Date(1620764444501), new Date(1725492002001), true],
            [null, new Date(1620764444501), new Date(1725492002001), false],
            [[], -10, 10, false],
            [true, -10, 10, false],
            [false, -10, 10, false],
            [new Date(1715472000000), 'bad date', new Date(1725492002001), false],
            [new Date(1715472000000), new Date(1620764444501), 'new date', false],
        ])('for input %p and start %p and end %p return %p', (input, start, end, expected) => {
            expect(isBetween(input, { start: start as Date, end: end as Date })).toEqual(expected);
        });
    });

    describe('timezoneToOffset', () => {
        // we do this to lock in the timzeone, so tests don't randomly fail in future
        const date = new Date('2021-05-20T15:13:52.131Z');

        test.each([
            ['Africa/Accra', 0],
            ['America/Anchorage', -8 * 60],
            ['America/Aruba', -4 * 60],
            ['Asia/Istanbul', 3 * 60],
            ['Australia/Canberra', 10 * 60],
        ])('for input %p and date %p return %p', (timezone, expected) => {
            expect(getTimezoneOffset(date, timezone)).toEqual(expected);
            expect(getTimezoneOffsetFP(timezone)(date)).toEqual(expected);
        });
    });

    describe('setMilliseconds', () => {
        test.each([
            ['2021-05-14T20:45:30.000Z', 392, new Date('2021-05-14T20:45:30.392Z').getTime()],
            ['04/18/2022 UTC', 858, new Date('2022-04-18T00:00:00.858Z').getTime()],
            [1621026049859, 15, new Date('2021-05-14T21:00:49.015Z').getTime()],
            [[1621026049859, -60], 15, new Date('2021-05-14T21:00:49.015Z').getTime()]
        ])('for input %p set the milliseconds to %p and return %p', (input, milliseconds, expected) => {
            expect(setMilliseconds(milliseconds)(input)).toEqual(expected);
        });

        it('should throw if milliseconds value is above 999', () => {
            expect(() => {
                setMilliseconds(1000)('2021-05-14T20:45:30.000Z');
            })
                .toThrow('milliseconds value must be an integer between 0 and 999, received 1000');
        });

        it('should throw if milliseconds value is negative', () => {
            expect(() => {
                setMilliseconds(-232)('2021-05-14T20:45:30.000Z');
            })
                .toThrow('milliseconds value must be an integer between 0 and 999, received -232');
        });

        it('should throw if milliseconds value is not an integer', () => {
            expect(() => {
                setMilliseconds(12.34)('2021-05-14T20:45:30.000Z');
            })
                .toThrow('milliseconds value must be an integer between 0 and 999, received 12.34');
        });
    });

    describe('setSeconds', () => {
        test.each([
            ['2021-05-14T20:45:00.000Z', 59, new Date('2021-05-14T20:45:59.000Z').getTime()],
            ['04/18/2022 UTC', 54, new Date('2022-04-18T00:00:54.000Z').getTime()],
            [1621026000000, 15, new Date('2021-05-14T21:00:15.000Z').getTime()],
            [[1621026000000, -60], 15, new Date('2021-05-14T21:00:15.000Z').getTime()],
        ])('for input %p set the seconds to %p and return %p', (input, seconds, expected) => {
            expect(setSeconds(seconds)(input)).toEqual(expected);
        });

        it('should throw if seconds value is above 59', () => {
            expect(() => {
                setSeconds(84)('2021-05-14T20:45:30.000Z');
            })
                .toThrow('seconds value must be an integer between 0 and 59, received 84');
        });
    });

    describe('setMinutes', () => {
        test.each([
            ['2021-05-14T00:00:00.000Z', 12, new Date('2021-05-14T00:12:00.000Z').getTime()],
            ['2021-05-14T00:32:00.000Z', 0, new Date('2021-05-14T00:00:00.000Z').getTime()],
            ['04/18/2022 UTC', 54, new Date('2022-04-18T00:54:00.000Z').getTime()],
            [1621026000000, 59, new Date('2021-05-14T21:59:00.000Z').getTime()],
            [[1621026000000, -120], 59, 1621022340000],
        ])('for input %p set the minutes to %p and return %p', (input, minutes, expected) => {
            expect(setMinutes(minutes)(input)).toEqual(expected);
        });

        it('should throw if minutes value is above 59', () => {
            expect(() => {
                setMinutes(84)('2021-05-14T20:45:30.000Z');
            })
                .toThrow('minutes value must be an integer between 0 and 59, received 84');
        });
    });

    describe('setHours', () => {
        test.each([
            ['2021-05-14T00:00:00.000Z', 12, new Date('2021-05-14T12:00:00.000Z').getTime()],
            ['04/18/2022 UTC', 12, new Date('2022-04-18T12:00:00.000Z').getTime()],
            [1621026000000, 12, new Date('2021-05-14T12:00:00.000Z').getTime()],
            [[1621026000000, 120], 12, new Date('2021-05-14T12:00:00.000Z').getTime()],
        ])('for input %p set the hours to %p and return %p', (input, hours, expected) => {
            expect(setHours(hours)(input)).toEqual(expected);
        });
    });

    describe('setDate', () => {
        test.each([
            ['2021-05-14T00:00:00.000Z', 12, new Date('2021-05-12T00:00:00.000Z').getTime()],
            ['04/18/2022 UTC', 12, new Date('2022-04-12T00:00:00.000Z').getTime()],
            [1621026000000, 12, new Date('2021-05-12T21:00:00.000Z').getTime()],
            [[1621026000000, 420], 12, 1620792000000],
            ['2021-02-14T00:00:00.000Z', 30, new Date('2021-03-02T00:00:00.000Z').getTime()],
        ])('for input %p set the date to %p and return %p', (input, date, expected) => {
            expect(setDate(date)(input)).toEqual(expected);
        });

        it('should throw if date value is above 31', () => {
            expect(() => {
                setDate(84)('2021-05-14T20:45:30.000Z');
            })
                .toThrow('date value must be an integer between 1 and 31, received 84');
        });

        it('should throw if date value is below 1', () => {
            expect(() => {
                setDate(0)('2021-05-14T20:45:30.000Z');
            })
                .toThrow('date value must be an integer between 1 and 31, received 0');
        });
    });

    describe('setMonth', () => {
        test.each([
            ['2021-05-14T00:00:00.000Z', 1, new Date('2021-01-14T00:00:00.000Z').getTime()],
            ['04/18/2022 UTC', 12, new Date('2022-12-18T00:00:00.000Z').getTime()],
            [1621026000000, 12, new Date('2021-12-14T21:00:00.000Z').getTime()],
            [[1621026000000, -120], 12, new Date('2021-12-14T19:00:00.000Z').getTime()],
        ])('for input %p set the month to %p and return %p', (input, month, expected) => {
            expect(setMonth(month)(input)).toEqual(expected);
        });

        it('should throw if month value is above 12', () => {
            expect(() => {
                setMonth(13)('2021-05-14T20:45:30.000Z');
            })
                .toThrow('month value must be an integer between 1 and 12, received 13');
        });

        it('should throw if date value is below 1', () => {
            expect(() => {
                setMonth(-10)('2021-05-14T20:45:30.000Z');
            })
                .toThrow('month value must be an integer between 1 and 12, received -10');
        });
    });

    describe('setYear', () => {
        test.each([
            ['2021-05-14T00:00:00.000Z', 1984, new Date('1984-05-14T00:00:00.000Z').getTime()],
            ['2021-05-14T00:00:00.000Z', 10042, new Date('+010042-05-14T00:00:00.000Z').getTime()],
            ['04/18/2022 UTC', 12, new Date('0012-04-18T00:00:00.000Z').getTime()],
            [1621026000000, 2023, new Date('2023-05-14T21:00:00.000Z').getTime()],
            [[1621026000000, 420], 2023, new Date('2023-05-15T04:00:00.000Z').getTime()],
        ])('for input %p set the year to %p and return %p', (input, year, expected) => {
            expect(setYear(year)(input)).toEqual(expected);
        });

        it('should throw if year value is not an integer', () => {
            expect(() => {
                setYear(234.343)('2021-05-14T20:45:30.000Z');
            })
                .toThrow('year value must be an integer, received 234.343');
        });
    });

    describe('getMilliseconds', () => {
        test.each([
            ['2021-05-10T10:00:00.746Z', 746],
            ['2021-05-10T10:00:00.000Z', 0],
            [1715472000231, 231],
            [1715472131, 131],
            ['08/05/2021', 0],
            [[1621026000012, -420], 12]
        ])('for date %p getMilliseconds should return %p', (input, expected) => {
            expect(getMilliseconds(input)).toEqual(expected);
        });

        it('should throw if input cannot be parsed to a date', () => {
            expect(() => {
                getMilliseconds('nope');
            })
                .toThrow('Expected nope (String) to be in a standard date format');
        });
    });

    describe('getSeconds', () => {
        test.each([
            ['2021-05-10T10:00:12.746Z', 12],
            ['2021-05-10T10:00:00.000Z', 0],
            [1715472019231, 19],
            [1715472343, 12],
            ['08/05/2021', 0],
            [[1621026002000, -420], 2]
        ])('for date %p getSeconds should return %p', (input, expected) => {
            expect(getSeconds(input)).toEqual(expected);
        });

        it('should throw if input cannot be parsed to a date', () => {
            expect(() => {
                getSeconds('nope');
            })
                .toThrow('Expected nope (String) to be in a standard date format');
        });
    });

    describe('getMinutes', () => {
        test.each([
            ['2021-05-10T10:19:12.746Z', 19],
            ['2001-03-19T11:36:44+01:00', 36],
            ['2021-05-10T10:00:00.000Z', 0],
            [1311874359231, 32],
            [1715472343, 31],
            ['08/05/2021', 0],
            [[1621026300000, -420], 5],
            [[1621026300000, -418], 7]
        ])('for date %p getMinutes should return %p', (input, expected) => {
            expect(getMinutes(input)).toEqual(expected);
        });

        it('should throw if input cannot be parsed to a date', () => {
            expect(() => {
                getMinutes(true);
            })
                .toThrow('Expected true (Boolean) to be in a standard date format');
        });
    });

    describe('getUTCMinutes', () => {
        test.each([
            ['2021-05-10T10:19:12.746Z', 19],
            ['2001-03-19T11:36:44+01:00', 36],
            ['2021-05-10T10:00:00.000Z', 0],
            [1311874359231, 32],
            [1715472343, 31],
            ['08/05/2021', 0],
            [[1621026300000, -420], 5],
            [[1621026300000, -418], 5]
        ])('for date %p getMinutes should return %p', (input, expected) => {
            expect(getUTCMinutes(input)).toEqual(expected);
        });

        it('should throw if input cannot be parsed to a date', () => {
            expect(() => {
                getUTCMinutes(true);
            })
                .toThrow('Expected true (Boolean) to be in a standard date format');
        });
    });

    describe('getHours', () => {
        test.each([
            ['2021-05-10T10:19:12.746Z', 10],
            ['2021-05-10T00:00:00.000Z', 0],
            [1311874359231, 17],
            [1715472343, 20],
            ['08/05/2021 UTC', 0],
            ['08/05/2021 EST', 5],
            ['2021-05-10T03:00:00.000-05:00', 8],
            [[1621026300000, -420], 14]
        ])('for date %p getHours should return %p', (input, expected) => {
            expect(getHours(input)).toEqual(expected);
        });

        it('should throw if input cannot be parsed to a date', () => {
            expect(() => {
                getHours(false);
            })
                .toThrow('Expected false (Boolean) to be in a standard date format');
        });
    });

    describe('getUTCHours', () => {
        test.each([
            ['2021-05-10T10:19:12.746Z', 10],
            ['2021-05-10T00:00:00.000Z', 0],
            [1311874359231, 17],
            [1715472343, 20],
            ['08/05/2021 UTC', 0],
            ['08/05/2021 EST', 5],
            ['2021-05-10T03:00:00.000-05:00', 8],
            [[1621026300000, -420], 21]
        ])('for date %p getHours should return %p', (input, expected) => {
            expect(getUTCHours(input)).toEqual(expected);
        });

        it('should throw if input cannot be parsed to a date', () => {
            expect(() => {
                getUTCHours(false);
            })
                .toThrow('Expected false (Boolean) to be in a standard date format');
        });
    });

    describe('getDate', () => {
        test.each([
            ['2021-05-10T10:19:12.746Z', 10],
            [1311874359231, 28],
            [1715472343, 20],
            ['08/05/2021', 5],
            [[1621026300000, -420], 14]
        ])('for date %p getDate should return %p', (input, expected) => {
            expect(getDate(input)).toEqual(expected);
        });

        it('should throw if input cannot be parsed to a date', () => {
            expect(() => {
                getDate([]);
            })
                .toThrow('Expected  (Array) to be in a standard date format');
        });
    });

    describe('getUTCDate', () => {
        test.each([
            ['2021-05-10T10:19:12.746Z', 10],
            [1311874359231, 28],
            [1715472343, 20],
            ['08/05/2021', 5],
            [[1621026300000, -420], 14]
        ])('for date %p getDate should return %p', (input, expected) => {
            expect(getUTCDate(input)).toEqual(expected);
        });

        it('should throw if input cannot be parsed to a date', () => {
            expect(() => {
                getUTCDate([]);
            })
                .toThrow('Expected  (Array) to be in a standard date format');
        });
    });

    describe('getMonth', () => {
        test.each([
            ['2021-05-10T10:19:12.746Z', 5],
            [1311874359231, 7],
            [1715472343, 1],
            ['08/05/2021', 8],
            ['2021-05-10T10:19:12.746Z', 5],
            ['12/05/2021', 12],
            ['01/05/2021', 1],
            [[1621026300000, -420], 5]
        ])('for date %p getMonth should return %p', (input, expected) => {
            expect(getMonth(input)).toEqual(expected);
        });
    });

    describe('getUTCMonth', () => {
        test.each([
            ['2021-05-10T10:19:12.746Z', 5],
            [1311874359231, 7],
            [1715472343, 1],
            ['08/05/2021', 8],
            ['2021-05-10T10:19:12.746Z', 5],
            ['12/05/2021', 12],
            ['01/05/2021', 1],
            [[1621026300000, -420], 5]
        ])('for date %p getMonth should return %p', (input, expected) => {
            expect(getUTCMonth(input)).toEqual(expected);
        });
    });

    describe('getYear', () => {
        test.each([
            ['2021-05-10T10:19:12.746Z', 2021],
            [1311874359231, 2011],
            [1715472343, 1970],
            ['08/05/1872', 1872],
            [[1621026300000, -420], 2021]
        ])('for date %p getYear should return %p', (input, expected) => {
            expect(getYear(input)).toEqual(expected);
        });
    });

    describe('getUTCYear', () => {
        test.each([
            ['2021-05-10T10:19:12.746Z', 2021],
            [1311874359231, 2011],
            [1715472343, 1970],
            ['08/05/1872', 1872],
            [[1621026300000, -420], 2021]
        ])('for date %p getYear should return %p', (input, expected) => {
            expect(getUTCYear(input)).toEqual(expected);
        });
    });

    describe('addToDate', () => {
        test.each([
            ['2019-10-22T22:00:00.000Z', { expr: '10h+2m' }, new Date('2019-10-23T08:02:00.000Z').getTime()],
            [[1571781600000, 0], { expr: '10h+2m' }, new Date('2019-10-23T08:02:00.000Z').getTime()],
            [[1571781600000, 420], { years: 4 }, 1698037200000],
            [[1571781600000, -60], { months: 1, minutes: 2 }, 1574456520000]
        ])('for date %p and exp %p addToDate should return %p', (input, args, expected) => {
            expect(addToDate(input, args)).toEqual(expected);
        });
    });

    describe('subtractFromDate', () => {
        test.each([
            ['2019-10-22T22:00:00.000Z', { expr: '10h+2m' }, 1571745720000],
            [[1571781600000, 0], { expr: '10h+2m' }, 1571745720000],
            [[1571781600000, 420], { years: 4 }, 1445576400000]
        ])('for date %p and exp %p addToDate should return %p', (input, args, expected) => {
            expect(subtractFromDate(input, args)).toEqual(expected);
        });
    });
});
