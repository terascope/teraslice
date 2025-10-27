import { isBigInt, toBigInt, trimISODateSegment } from '@terascope/core-utils';
import { Maybe, ISO8601DateSegment } from '@terascope/types';
import { getHashCodeFrom } from '../builder/type-coercion.js';
import {
    Vector, VectorType, getNumericValues, SerializeOptions,
    ParsedNumericObject
} from '../vector/index.js';

export enum ValueAggregation {
    avg = 'avg',
    sum = 'sum',
    min = 'min',
    max = 'max',
    count = 'count',
}

export interface FieldAgg {
    /**
     * If this returns true, then the flush method will
     * return an index which will indicate which row to select
    */
    adjustsSelectedRow: boolean;
    push(value: unknown, index: number): void;
    flush(): {
        readonly value: unknown;
        /**
         * This index will indicate which row to select,
         * this will conflict with other aggregations that
         * return the same row
        */
        readonly index?: number;
    };
}

export type MakeValueAgg = (vector: Vector<unknown>) => FieldAgg;

export const valueAggMap: Record<ValueAggregation, MakeValueAgg> = {
    [ValueAggregation.avg]: makeAvgAgg,
    [ValueAggregation.sum]: makeSumAgg,
    [ValueAggregation.min]: makeMinAgg,
    [ValueAggregation.max]: makeMaxAgg,
    [ValueAggregation.count]: makeCountAgg,
};

export const valueAggregationDescriptions = {
    avg: 'Calculate the average value in a column',
    count: 'Count all of the values in a column',
    max: 'Find the maximum value in a column',
    min: 'Find the minimum value in a column',
    sum: 'Add all of the values in a column together',
};

export function runVectorAggregation<V>(vector: Vector<any>, valueAgg: ValueAggregation): V {
    const agg = valueAggMap[valueAgg](vector);
    for (const [i, v] of vector.values()) {
        agg.push(v, i);
    }
    return agg.flush().value as any;
}

function _addReducer(acc: any, curr: any): bigint {
    if (typeof acc === typeof curr) return acc + curr;
    if (isBigInt(curr)) return BigInt(acc) + curr;
    return acc + BigInt(curr);
}
function add(value: number | bigint, values: (number | bigint)[]): number | bigint {
    return values.reduce(_addReducer, value);
}

function makeSumAgg(vector: Vector<any>): FieldAgg {
    const type = vector.type === VectorType.BigInt ? 'bigint' : 'number';
    let agg: {
        value: number | bigint;
    } = { value: 0 };

    return {
        adjustsSelectedRow: false,
        push(value) {
            const res = getNumericValues(value);
            const sum = add(0, res.values as (number | bigint)[]);
            agg.value = add(agg.value, [sum]);
        },
        flush() {
            if (agg.value == null) return { value: undefined };

            const result = {
                value: type === 'bigint' ? toBigInt(agg.value) : agg.value
            };
            agg = { value: 0 };
            return result;
        },
    };
}

function makeAvgAgg(vector: Vector<any>): FieldAgg {
    const type = vector.type === VectorType.BigInt ? 'bigint' : 'number';
    let agg: {
        total: number;
        value?: number | bigint;
    } = { total: 0 };

    return {
        adjustsSelectedRow: false,
        push(value: unknown) {
            const res = getNumericValues(value);
            if (res.values.length) {
                const sum = add(0, res.values as (number | bigint)[]);
                agg.value = agg.value != null ? add(sum, [agg.value]) : sum;
            }
            agg.total += res.values.length;
        },
        flush() {
            if (agg.value == null) return { value: undefined };

            const total = type === 'bigint' ? BigInt(agg.total) : agg.total;

            const avg = (agg.value as any) / (total as any);
            const result = { value: avg };
            agg = { total: 0 };
            return result;
        },
    };
}

function numericValueToObject(value: number | bigint | ParsedNumericObject) {
    if (typeof value === 'object') return value;
    return { parsed: value };
}

function makeMinAgg(): FieldAgg {
    let agg: {
        index: number;
        value?: number | bigint;
        original?: string;
    } = { index: -1 };

    return {
        adjustsSelectedRow: true,
        push(value, index) {
            const res = getNumericValues(value, true);
            for (const num of res.values) {
                const { parsed, original } = numericValueToObject(num);
                if (agg.value == null || parsed < agg.value) {
                    agg.value = parsed;
                    agg.index = index;
                    agg.original = original;
                }
            }
        },
        flush() {
            const result = { value: agg.original || agg.value, index: agg.index };
            agg = { index: -1 };
            return result;
        },
    };
}

function makeMaxAgg(): FieldAgg {
    let agg: {
        index: number;
        value?: number | bigint;
        original?: string;
    } = { index: -1 };

    return {
        adjustsSelectedRow: true,
        push(value, index) {
            const res = getNumericValues(value, true);
            for (const num of res.values) {
                const { parsed, original } = numericValueToObject(num);
                if (agg.value == null || parsed > agg.value) {
                    agg.value = parsed;
                    agg.index = index;
                    agg.original = original;
                }
            }
        },
        flush() {
            const result = { value: agg.original || agg.value, index: agg.index };
            agg = { index: -1 };
            return result;
        },
    };
}

function makeCountAgg(): FieldAgg {
    let count = 0;
    return {
        adjustsSelectedRow: false,
        push(value) {
            if (value == null) return;
            count++;
        },
        flush() {
            const result = count;
            count = 0;
            return { value: result };
        },
    };
}

export enum KeyAggregation {
    hourly = 'hourly',
    daily = 'daily',
    monthly = 'monthly',
    yearly = 'yearly'
}

export type KeyAggFn = (index: number) => {
    key: string | undefined;
    value: unknown;
};
export type MakeKeyAggFn = (col: Vector<unknown>) => KeyAggFn;

export const keyAggMap: Record<KeyAggregation, MakeKeyAggFn> = {
    [KeyAggregation.hourly]: makeDateAgg(trimISODateSegment(ISO8601DateSegment.hourly)),
    [KeyAggregation.daily]: makeDateAgg(trimISODateSegment(ISO8601DateSegment.daily)),
    [KeyAggregation.monthly]: makeDateAgg(trimISODateSegment(ISO8601DateSegment.monthly)),
    [KeyAggregation.yearly]: makeDateAgg(trimISODateSegment(ISO8601DateSegment.yearly)),
};

export const keyAggregationDescriptions = {
    hourly: 'Group the data in hourly buckets',
    daily: 'Group the data in daily buckets',
    monthly: 'Group the data in monthly buckets',
    yearly: 'Group the data in yearly buckets',
};

function makeDateAgg(trimDateFn: (input: unknown) => number): MakeKeyAggFn {
    return function _makeDateAgg(vector) {
        return function dateAgg(index) {
            const value = vector.get(index) as Maybe<number>;
            if (value == null) return { key: undefined, value };

            return {
                key: String(trimDateFn(value)),
                value,
            };
        };
    };
}

export function makeUniqueKeyAgg(vector: Vector<any>, options?: SerializeOptions): KeyAggFn {
    return function uniqueKeyAgg(index) {
        const value = vector.get(index, false);
        if (value == null) {
            return { key: undefined, value: null };
        }

        return {
            key: getHashCodeFrom(value),
            value: options && vector.toJSONCompatibleValue
                ? vector.toJSONCompatibleValue(value, options)
                : value
        };
    };
}
