import formatDate from 'date-fns/format';
import {
    getTypeOf, isBigInt, toBigInt
} from '@terascope/utils';
import { Maybe } from '@terascope/types';
import { Vector } from './vector';
import { createKeyForValue, getNumericValues } from './utils';
import { VectorType } from './interfaces';
import { DateValue } from './types';

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
    let i = -1;
    for (const value of vector) {
        agg.push(value, ++i);
    }
    return agg.flush().value as any;
}

function getSameNumberType(
    a: Maybe<number|bigint>,
    b: number|bigint,
    defaultVal: bigint
): [bigint, bigint]
function getSameNumberType(
    a: Maybe<number|bigint>,
    b: number|bigint,
    defaultVal: number
): [number, number]
function getSameNumberType(
    a: Maybe<number|bigint>,
    b: number|bigint,
    defaultVal?: number|bigint
): [number|undefined, number]|[bigint|undefined, bigint] {
    if (a == null) {
        if (defaultVal == null) return [undefined, b as any];
        if (isBigInt(b)) {
            return [toBigInt(defaultVal), b];
        }
        if (isBigInt(defaultVal)) {
            return [defaultVal, toBigInt(b)];
        }
        return [defaultVal, b];
    }
    if (isBigInt(a)) {
        return [a, toBigInt(b)];
    }
    if (isBigInt(b)) {
        return [toBigInt(a), b];
    }
    if (typeof a === typeof b) return [a, b];

    throw new TypeError(
        `Invalid number comparison, got ${getTypeOf(a)} and ${getTypeOf(b)}`
    );
}

function makeSumAgg(vector: Vector<any>): FieldAgg {
    const type = vector.type === VectorType.BigInt ? 'bigint' : 'number';
    let agg: {
        value: number|bigint;
    } = { value: 0 };

    return {
        push(value: unknown) {
            const res = getNumericValues(value);
            for (const num of res.values) {
                const [a, b] = getSameNumberType(agg.value, num, 0);
                agg.value = a + b;
            }
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

            for (const num of res.values) {
                const [a, b] = getSameNumberType(agg.value, num, 0);
                agg.value = a + b;
                agg.total++;
            }
        },
        flush() {
            if (agg.value == null) return { value: undefined };

            if (type === 'bigint') {
                const result = { value: (agg.value as bigint) / BigInt(agg.total) };
                agg = { total: 0 };
                return result;
            }

            const result = { value: (agg.value as number) / agg.total };
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
        push() {
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
    unique = 'unique',
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
    [KeyAggregation.unique]: makeUniqueKeyAgg,
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

function makeUniqueKeyAgg(vector: Vector<unknown>): KeyAggFn {
    return (index) => {
        const value = vector.get(index);
        if (value == null || value === '') {
            return { key: undefined, value };
        }
        return {
            key: createKeyForValue(value),
            value
        };
    };
}
