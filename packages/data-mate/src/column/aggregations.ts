import formatDate from 'date-fns/format';
import {
    isBigInt, toBigInt
} from '@terascope/utils';
import {
    Vector, VectorType, getNumericValues
} from '../vector';
import { DateValue, getHashCodeFrom } from '../core';

export enum ValueAggregation {
    avg = 'avg',
    sum = 'sum',
    min = 'min',
    max = 'max',
    count = 'count',
}

export type FieldAgg = {
    push(value: unknown, index: number): void;
    flush(): { value: unknown, index?: number };
}
export type MakeValueAgg = (vector: Vector<unknown>) => FieldAgg;

export const valueAggMap: Record<ValueAggregation, MakeValueAgg> = {
    [ValueAggregation.avg]: makeAvgAgg,
    [ValueAggregation.sum]: makeSumAgg,
    [ValueAggregation.min]: makeMinAgg,
    [ValueAggregation.max]: makeMaxAgg,
    [ValueAggregation.count]: makeCountAgg,
};

export function runVectorAggregation<V>(vector: Vector<any>, valueAgg: ValueAggregation): V {
    const agg = valueAggMap[valueAgg](vector);
    for (const [i, v] of vector.data.values) {
        agg.push(v, i);
    }
    return agg.flush().value as any;
}

function _addReducer(acc: any, curr: any) {
    if (typeof acc === typeof curr) return acc + curr;
    if (isBigInt(curr)) return BigInt(acc) + curr;
    return acc + BigInt(curr);
}
function add(value: number|bigint, ...values: (number|bigint)[]): number|bigint {
    return values.reduce(_addReducer, value);
}

function makeSumAgg(vector: Vector<any>): FieldAgg {
    const type = vector.type === VectorType.BigInt ? 'bigint' : 'number';
    let agg: {
        value: number|bigint;
    } = { value: 0 };

    return {
        push(value) {
            const res = getNumericValues(value);
            const sum = add(0, ...res.values);
            agg.value = add(agg.value, sum);
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
        value?: number|bigint,
    } = { total: 0 };

    return {
        push(value: unknown) {
            const res = getNumericValues(value);
            if (res.values.length) {
                const sum = add(0, ...res.values);
                agg.value = agg.value != null ? add(sum, agg.value) : sum;
            }
            agg.total += res.values.length;
        },
        flush() {
            if (agg.value == null) return { value: undefined };

            const total = type === 'bigint' ? BigInt(agg.total) : agg.total;

            const avg = (agg.value as any) / (total as any);
            const result = Number.isNaN(avg) ? { value: undefined } : { value: avg };
            agg = { total: 0 };
            return result;
        },
    };
}

function makeMinAgg(): FieldAgg {
    let agg: {
        index: number;
        value?: number|bigint,
    } = { index: -1 };

    return {
        push(value, index) {
            const res = getNumericValues(value);
            for (const num of res.values) {
                if (agg.value == null || num < agg.value) {
                    agg.value = num;
                    agg.index = index;
                }
            }
        },
        flush() {
            const result = { value: agg.value, index: agg.index };
            agg = { index: -1 };
            return result;
        },
    };
}

function makeMaxAgg(): FieldAgg {
    let agg: {
        index: number;
        value?: number|bigint,
    } = { index: -1 };

    return {
        push(value, index) {
            const res = getNumericValues(value);
            for (const num of res.values) {
                if (agg.value == null || num > agg.value) {
                    agg.value = num;
                    agg.index = index;
                }
            }
        },
        flush() {
            const result = { value: agg.value, index: agg.index };
            agg = { index: -1 };
            return result;
        },
    };
}

function makeCountAgg(): FieldAgg {
    let count: number|undefined;
    return {
        push(value) {
            if (value == null) return;
            if (!count) count = 1;
            else count++;
        },
        flush() {
            const result = count;
            count = undefined;
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
    key: string|undefined;
    value: unknown;
};
export type MakeKeyAggFn = (col: Vector<unknown>) => KeyAggFn;
export const keyAggMap: Record<KeyAggregation, MakeKeyAggFn> = {
    [KeyAggregation.hourly]: makeDateAgg('yyyy:MM:dd:hh'),
    [KeyAggregation.daily]: makeDateAgg('yyyy:MM:dd'),
    [KeyAggregation.monthly]: makeDateAgg('yyyy:MM'),
    [KeyAggregation.yearly]: makeDateAgg('yyyy'),
};

function makeDateAgg(dateFormat: string): MakeKeyAggFn {
    return (vector) => (index) => {
        const value = vector.get(index) as DateValue;
        if (value == null) return { key: undefined, value };

        return {
            key: formatDate(value.value, dateFormat),
            value,
        };
    };
}

export function makeUniqueKeyAgg(vector: Vector<any>): KeyAggFn {
    return (index) => {
        const value = vector.get(index, false);
        if (value == null) {
            return { key: undefined, value: null };
        }

        return {
            key: getHashCodeFrom(value),
            value
        };
    };
}
