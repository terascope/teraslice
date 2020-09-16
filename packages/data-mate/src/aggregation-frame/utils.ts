import { createHash } from 'crypto';
import formatDate from 'date-fns/format';
import {
    get, getValidDate, toBigInt, toString
} from '@terascope/utils';
import { FieldType } from '@terascope/types';
import { Column } from '../column';
import { Builder } from '../builder';
import { ValueAggregation, KeyAggregation } from './interfaces';
import { BigIntVector, getNumericValues, Vector } from '../vector';

export function getBuilderForField(
    col: Column<any>,
    keyAgg?: KeyAggregation,
    valueAgg?: ValueAggregation
): Builder<any> {
    if (!keyAgg && !valueAgg) {
        return Builder.make(
            col.config, get(col.vector, 'childConfig')
        );
    }

    if (keyAgg && !valueAgg) {
        return Builder.make<any>(
            col.config,
            get(col.vector, 'childConfig')
        );
    }

    const currentType = col.config.type as FieldType;
    let type: FieldType|undefined;
    if (valueAgg === ValueAggregation.avg) {
        if (currentType === FieldType.Long) {
            type = FieldType.Double;
        } else if (isNumberLike(currentType)) {
            type = FieldType.Float;
        }
    } else if (valueAgg === ValueAggregation.sum) {
        if (type === FieldType.Long || type === FieldType.Integer) {
            type = FieldType.Long;
        } else if (type === FieldType.Short || type === FieldType.Byte) {
            type = FieldType.Integer;
        } else if (isFloatLike(currentType)) {
            type = FieldType.Float;
        }
    } else if (valueAgg === ValueAggregation.max || valueAgg === ValueAggregation.min) {
        if (isNumberLike(currentType)) {
            type = currentType;
        }
    } else if (valueAgg === ValueAggregation.count) {
        type = FieldType.Integer;
    }
    if (!type) {
        throw new Error(`Unsupported field type ${type} for aggregation ${valueAgg}`);
    }

    return Builder.make<any>({
        type,
        array: false,
        description: col.config.description // FIXME append agg info
    });
}

export function isNumberLike(type: FieldType): boolean {
    if (type === FieldType.Long) return true;
    return isFloatLike(type) || isIntLike(type);
}

function isFloatLike(type: FieldType) {
    if (type === FieldType.Float) return true;
    if (type === FieldType.Number) return true;
    if (type === FieldType.Double) return true;
    return true;
}

function isIntLike(type: FieldType) {
    if (type === FieldType.Byte) return true;
    if (type === FieldType.Short) return true;
    if (type === FieldType.Integer) return true;
    return true;
}

export function md5(value: string|Buffer): string {
    return createHash('md5').update(value).digest('hex');
}
export function createKeyForValue(value: unknown): string|undefined {
    if (value == null) return;

    if (typeof value !== 'object') return String(value);
    if (value instanceof Vector || Array.isArray(value)) {
        let key = '';
        for (const item of value) {
            if (item != null) key += `${toString(item)}`;
        }
        return key;
    }

    const keys: string[] = Object.keys(value as any).sort();

    let key = '';
    for (const prop of keys) {
        const item = (value as any)[prop];
        if (item != null) {
            key += `${prop}:${toString(item)}`;
        }
    }
    return key;
}

export type FieldAgg = {
    push(value: unknown, index: number): void;
    flush(): { value: unknown, index?: number };
}
export type MakeValueAgg = (col: Column<unknown>) => FieldAgg;

export const valueAggMap: Record<ValueAggregation, MakeValueAgg> = {
    [ValueAggregation.avg]: makeAvgAgg,
    [ValueAggregation.sum]: makeSumAgg,
    [ValueAggregation.min]: makeMinAgg,
    [ValueAggregation.max]: makeMaxAgg,
    [ValueAggregation.count]: makeCountAgg,
};

function makeSumAgg(): FieldAgg {
    let agg: {
        value?: number;
        type: 'number'
    }|{
        value?: bigint;
        type: 'bigint'
    } = { type: 'number' };

    return {
        push(value: unknown) {
            const res = getNumericValues(value);
            if (res.type === 'bigint') {
                if (agg.type === 'number') {
                    agg = {
                        type: 'bigint',
                        value: agg.value != null ? toBigInt(agg.value) : undefined
                    };
                }
                for (const num of res.values) {
                    if (agg.value != null) {
                        agg.value += num;
                    } else {
                        agg.value = num;
                    }
                }
            }
            if (res.type === 'number') {
                if (agg.type === 'bigint') {
                    agg = {
                        type: 'number',
                        value: agg.value != null ? parseFloat(
                            BigIntVector.valueToJSON(agg.value)
                        ) : undefined
                    };
                }
                for (const num of res.values) {
                    if (agg.value != null) {
                        agg.value += num;
                    } else {
                        agg.value = num;
                    }
                }
            }
        },
        flush() {
            if (agg.value == null) return { value: undefined };

            const result = { value: agg.value };
            agg = { type: 'number' };
            return result;
        },
    };
}

function makeAvgAgg(): FieldAgg {
    let agg: {
        value?: number;
        total: number;
        type: 'number'
    }|{
        value?: bigint;
        total: number;
        type: 'bigint'
    } = { type: 'number', total: 0 };

    return {
        push(value: unknown) {
            const res = getNumericValues(value);
            if (res.type === 'bigint') {
                if (agg.type === 'number') {
                    agg = {
                        type: 'bigint',
                        value: agg.value != null ? toBigInt(agg.value) : agg.value,
                        total: agg.total,
                    };
                }
                for (const num of res.values) {
                    if (agg.value != null) {
                        agg.value += num;
                    } else {
                        agg.value = num;
                    }
                    agg.total++;
                }
            }
            if (res.type === 'number') {
                if (agg.type === 'bigint') {
                    agg = {
                        type: 'number',
                        value: agg.value != null ? parseFloat(
                            BigIntVector.valueToJSON(agg.value)
                        ) : undefined,
                        total: agg.total,
                    };
                }
                for (const num of res.values) {
                    if (agg.value != null) {
                        agg.value += num;
                    } else {
                        agg.value = num;
                    }
                    agg.total++;
                }
            }
        },
        flush() {
            if (agg.value == null) return { value: undefined };

            if (agg.type === 'bigint') {
                const result = { value: agg.value / BigInt(agg.total) };
                agg = { type: 'number', total: 0 };
                return result;
            }

            const result = { value: agg.value / agg.total };
            agg = { type: 'number', total: 0 };
            return result;
        },
    };
}

function makeMinAgg(): FieldAgg {
    let agg: {
        index: number;
        value?: number,
        type: 'number'
    }|{
        index: number;
        value?: bigint,
        type: 'bigint'
    } = { type: 'number', index: -1 };

    return {
        push(value, index) {
            const res = getNumericValues(value);
            if (res.type === 'bigint') {
                if (agg.type === 'number') {
                    agg = {
                        type: 'bigint',
                        value: agg.value != null ? toBigInt(agg.value) : agg.value,
                        index: agg.index,
                    };
                }
                for (const num of res.values) {
                    if (agg.value == null || num < agg.value) {
                        agg.value = num;
                        agg.index = index;
                    }
                }
            }
            if (res.type === 'number') {
                if (agg.type === 'bigint') {
                    agg = {
                        type: 'number',
                        value: agg.value != null ? parseFloat(
                            BigIntVector.valueToJSON(agg.value)
                        ) : undefined,
                        index: agg.index,
                    };
                }
                for (const num of res.values) {
                    if (agg.value == null || num < agg.value) {
                        agg.value = num;
                        agg.index = index;
                    }
                }
            }
        },
        flush() {
            const result = { value: agg.value, index: agg.index };
            agg = { type: 'number', index: -1 };
            return result;
        },
    };
}

function makeMaxAgg(): FieldAgg {
    let agg: {
        index: number,
        value?: number,
        type: 'number'
    }|{
        index: number,
        value?: bigint,
        type: 'bigint'
    } = { type: 'number', index: -1 };

    return {
        push(value, index) {
            const res = getNumericValues(value);
            if (res.type === 'bigint') {
                if (agg.type === 'number') {
                    agg = {
                        type: 'bigint',
                        value: agg.value != null ? toBigInt(agg.value) : agg.value,
                        index: agg.index,
                    };
                }
                for (const num of res.values) {
                    if (agg.value == null || num > agg.value) {
                        agg.value = num;
                        agg.index = index;
                    }
                }
            }
            if (res.type === 'number') {
                if (agg.type === 'bigint' && agg.value != null) {
                    agg = {
                        type: 'number',
                        value: agg.value != null ? parseFloat(
                            BigIntVector.valueToJSON(agg.value)
                        ) : undefined,
                        index: agg.index,
                    };
                }
                for (const num of res.values) {
                    if (agg.value == null || num > agg.value) {
                        agg.value = num;
                        agg.index = index;
                    }
                }
            }
        },
        flush() {
            const result = { value: agg.value, index: agg.index };
            agg = { type: 'number', index: -1 };
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

export type KeyAggFn = (index: number) => {
    key: string|undefined;
    value: unknown;
};
export type MakeKeyAggFn = (col: Column<unknown>) => KeyAggFn;
export const keyAggMap: Record<KeyAggregation, MakeKeyAggFn> = {
    [KeyAggregation.unique]: makeUniqueKeyAgg,
    [KeyAggregation.hourly]: makeDateAgg('yyyy:MM:dd:hh'),
    [KeyAggregation.daily]: makeDateAgg('yyyy:MM:dd'),
    [KeyAggregation.monthly]: makeDateAgg('yyyy:MM'),
    [KeyAggregation.yearly]: makeDateAgg('yyyy'),
};

function makeDateAgg(dateFormat: string): MakeKeyAggFn {
    return (col) => (index) => {
        const value = col.vector.get(index);
        if (value == null) return { key: undefined, value };

        const date = getValidDate(value);
        if (date === false) return { key: undefined, value };

        return {
            key: formatDate(date, dateFormat),
            value,
        };
    };
}

function makeUniqueKeyAgg(col: Column<unknown>): KeyAggFn {
    return (index) => {
        const value = col.vector.get(index);
        if (value == null || value === '') {
            return { key: undefined, value };
        }
        return {
            key: createKeyForValue(value),
            value
        };
    };
}
