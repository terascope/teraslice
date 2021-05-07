import 'jest-extended';
import { DateFormat } from '@terascope/types';
import {
    isISO8061, parseDateValue, formatDateValue
} from '../src/dates';

describe('date utils', () => {
    describe('isISO8061', () => {
        test.each([
            ['1970-10-10', false],
            ['2001-01-01T01:00:00.000Z', true],
            [102390933, false],
        ])('should handle %p and return %p', (input, expected) => {
            expect(isISO8061(input)).toBe(expected);
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
            [24364800000, 'yyyy-MM-dd', '1970-10-09'],
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
