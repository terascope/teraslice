import 'jest-extended';
import { DateFormat, ISO8601DateSegment } from '@terascope/types';
import {
    isISO8601, parseDateValue, formatDateValue, trimISODateSegment
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
            ['1970-10-10 01:20:15', ISO8601DateSegment.hourly, '1970-10-10T01'],
            ['1970-10-10T01:20:15', ISO8601DateSegment.hourly, '1970-10-10T01'],
            ['1970-10-10T01:20:15', ISO8601DateSegment.daily, '1970-10-10'],
            ['1970-10-10T01:20:15', ISO8601DateSegment.monthly, '1970-10'],
            ['1970-10-10T01:20:15', ISO8601DateSegment.yearly, '1970'],
        ])('should handle %p and return %p', (input, segment, expected) => {
            expect(trimISODateSegment(segment)(input)).toBe(expected);
        });

        it('should throw if given a non ISO 8601 date', () => {
            expect(() => {
                trimISODateSegment(ISO8601DateSegment.hourly)('1970/10/10 01:20:15');
            }).toThrowError('Expected 1970/10/10 01:20:15 (String) to be parsable to a date or ISO 8601 string');
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
});
