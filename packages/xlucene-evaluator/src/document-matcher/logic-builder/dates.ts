import isWithinInterval from 'date-fns/isWithinInterval';
import parseDate from 'date-fns/parseJSON';
import { Term, Range } from '../../parser';
import { isInfiniteMax, isInfiniteMin, parseRange } from '../../utils';
import { DateInput } from '../interfaces';

// TODO: handle datemath

export function compareTermDates(node: Term) {
    const nodeTermTime = convert(node.value as string);
    if (!nodeTermTime) throw new Error(`was not able to convert ${node.value} to a date value`);
    return function dateTerm(date: string) {
        return convert(date) === nodeTermTime;
    };
}

export function getRangeValues(node: Range) {
    const rangeQuery = parseRange(node);
    const incMin = rangeQuery.gte != null;
    const incMax = rangeQuery.lte != null;
    const minValue = rangeQuery.gte || rangeQuery.gt || '*';
    const maxValue = rangeQuery.lte || rangeQuery.lt || '*';

    return {
        incMin, incMax, minValue, maxValue
    };
}

function validateRangeValues(node: Range) {
    const values = getRangeValues(node);
    const { incMin, incMax } = values;
    let { minValue, maxValue } = values;

    // javascript min/max date allowable http://www.ecma-international.org/ecma-262/5.1/#sec-15.9.1.1
    if (isInfiniteMin(minValue)) minValue = -8640000000000000;
    if (isInfiniteMax(maxValue)) maxValue = 8640000000000000;

    if (!incMin) {
        const convertedValue = convert(minValue);
        if (!convertedValue) throw new Error(`was not able to convert ${minValue} to a date value`);
        minValue = convertedValue + 1;
    }
    if (!incMax) {
        const convertedValue = convert(maxValue);
        if (!convertedValue) throw new Error(`was not able to convert ${maxValue} to a date value`);
        maxValue = convertedValue - 1;
    }
    return { minValue, maxValue };
}

export function dateRange(node: Range) {
    const { minValue, maxValue } = validateRangeValues(node);
    const start = parseDate(minValue);
    const end = parseDate(maxValue);

    return function dateRangeTerm(date: string) {
        return isWithinInterval(parseDate(date), {
            start,
            end
        });
    };
}

function convert(value: DateInput): number | null {
    const results = new Date(value).getTime();
    if (results) return results;
    return null;
}
