import isWithinInterval from 'date-fns/isWithinInterval';
import isEqual from 'date-fns/isEqual';
import subMilliseconds from 'date-fns/subMilliseconds';
import addMilliseconds from 'date-fns/addMilliseconds';
import { getValidDate } from '@terascope/utils';
import {
    isInfiniteMax, isInfiniteMin, ParsedRange
} from 'xlucene-parser';
import { BooleanCB } from '../interfaces';

// TODO: handle datemath

export function compareTermDates(value: unknown):BooleanCB {
    const nodeTermTime = convertDate(value, 0, true);
    return function dateTerm(date: string) {
        const result = convertDate(date, 0, false);
        if (!result) return false;
        return isEqual(result, nodeTermTime);
    };
}

function getRangeValues(
    rangeQuery: ParsedRange
): { start: Date; end: Date } {
    let incMin = rangeQuery.gte == null ? 1 : 0;
    let incMax = rangeQuery.lte == null ? -1 : 0;

    let minValue: any = rangeQuery.gte || rangeQuery.gt || '*';
    let maxValue: any = rangeQuery.lte || rangeQuery.lt || '*';

    if (isInfiniteMin(minValue)) {
        incMin = 0;
        minValue = new Date(-8640000000000000);
    }

    if (isInfiniteMax(maxValue)) {
        incMax = 0;
        maxValue = new Date(8640000000000000);
    }

    const start = convertDate(minValue, incMin, true);
    const end = convertDate(maxValue, incMax, true);

    return {
        start,
        end
    };
}

export function dateRange(
    rangeQuery: ParsedRange
): BooleanCB {
    const interval = getRangeValues(rangeQuery);
    // verify it won't fail
    isWithinInterval(new Date(), interval);

    return function dateRangeTerm(date: string): boolean {
        const result = convertDate(date, 0, false);
        if (!result) return false;

        try {
            return isWithinInterval(result, interval);
        } catch (err) {
            return false;
        }
    };
}

function convertDate(val: any, inclusive: number, throwErr: false): Date|undefined;
function convertDate(val: any, inclusive: number, throwErr: true): Date;
function convertDate(val: any, inclusive: number, throwErr: boolean): Date|undefined {
    const result = getValidDate(val);
    if (result) return handleInclusive(result, inclusive);

    if (throwErr) throw new Error(`Invalid date format ${val}`);
    return undefined;
}

function handleInclusive(date: Date, inclusive: number): Date {
    if (inclusive === 0) return date;
    if (inclusive < 0) return subMilliseconds(date, inclusive);
    return addMilliseconds(date, inclusive);
}
