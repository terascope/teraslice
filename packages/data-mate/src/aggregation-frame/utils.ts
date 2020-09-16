import { createHash } from 'crypto';
import formatDate from 'date-fns/format';
import {
    get, getValidDate, toString, toBigInt
} from '@terascope/utils';
import { FieldType } from '@terascope/types';
import { Column } from '../column';
import { Builder } from '../builder';
import { Aggregation } from './interfaces';
import { BigIntVector, getNumericValues } from '../vector';

export const aggMap: Partial<Record<Aggregation, () => FieldAgg>> = {
    [Aggregation.AVG]: makeAvgAgg,
    [Aggregation.SUM]: makeSumAgg,
    [Aggregation.MIN]: makeMinAgg,
    [Aggregation.MAX]: makeMaxAgg,
    [Aggregation.COUNT]: makeCountAgg,
};

export function getBuilderForField(col: Column<any>, aggs?: Aggregation[]): Builder<any> {
    if (!aggs?.length) {
        return Builder.make(
            col.config, get(col.vector, 'childConfig')
        );
    }

    let type = col.config.type as FieldType;
    let array = false;
    for (const agg of aggs) {
        if (agg === Aggregation.AVG) {
            if (type === FieldType.Long) {
                type = FieldType.Double;
            } else if (isNumberLike(type)) {
                type = FieldType.Float;
            } else {
                throw new Error(`Unsupported field type ${type} for aggregation ${agg}`);
            }
        } else if (agg === Aggregation.SUM) {
            if (!isNumberLike(type)) {
                throw new Error(`Unsupported field type ${type} for aggregation ${agg}`);
            }
            if (type === FieldType.Long || type === FieldType.Integer) {
                type = FieldType.Long;
            } else if (type === FieldType.Short || type === FieldType.Byte) {
                type = FieldType.Integer;
            } else if (isFloatLike(type)) {
                type = FieldType.Float;
            } else {
                throw new Error(`Unsupported field type ${type} for aggregation ${agg}`);
            }
        } else if (agg === Aggregation.MAX || agg === Aggregation.MIN) {
            if (!isNumberLike(type)) {
                throw new Error(`Unsupported field type ${type} for aggregation ${agg}`);
            }
        } else if (agg === Aggregation.COUNT) {
            type = FieldType.Integer;
        } else if (agg === Aggregation.UNIQUE) {
            array = col.config.array ?? false;
        }
    }

    return Builder.make<any>({
        type,
        array,
        description: col.config.description // FIXME append agg info
    });
}

function isNumberLike(type: FieldType) {
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

export function md5(value: unknown): string {
    return createHash('md5').update(toString(value)).digest('hex');
}

export type FieldAgg = {
    push(value: unknown, index: number): void;
    flush(): { value: unknown, index?: number };
}

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
export const keyAggMap: Partial<Record<Aggregation, MakeKeyAggFn>> = {
    [Aggregation.UNIQUE]: makeDefaultKeyFn,
    [Aggregation.HOURLY]: makeDateAgg('yyyy:MM:dd:hh'),
    [Aggregation.DAILY]: makeDateAgg('yyyy:MM:dd'),
    [Aggregation.MONTHLY]: makeDateAgg('yyyy:MM'),
    [Aggregation.YEARLY]: makeDateAgg('yyyy'),
};

export function makeDateAgg(dateFormat: string): MakeKeyAggFn {
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

export function makeDefaultKeyFn(col: Column<unknown>): KeyAggFn {
    return (index) => {
        const value = col.vector.get(index);
        if (value == null || value === '') {
            return { key: undefined, value };
        }
        return {
            key: toString(
                col.vector.valueToJSON ? col.vector.valueToJSON(value) : value
            ),
            value
        };
    };
}
