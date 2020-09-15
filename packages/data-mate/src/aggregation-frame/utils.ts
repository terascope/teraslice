import { createHash } from 'crypto';
import formatDate from 'date-fns/format';
import { get, getValidDate, toString } from '@terascope/utils';
import { FieldType } from '@terascope/types';
import { Column } from '../column';
import { Builder } from '../builder';
import { Aggregation } from './interfaces';

export const aggMap: Partial<Record<Aggregation, () => FieldAgg>> = {
    [Aggregation.AVG]: makeAvgAgg,
    [Aggregation.SUM]: makeSumAgg,
    [Aggregation.MIN]: makeMinAgg,
    [Aggregation.MAX]: makeMaxAgg,
    [Aggregation.COUNT]: makeCountAgg,
};

export function getBuilderForField(col: Column<any>, aggs?: Aggregation[]): Builder<any> {
    if (!aggs?.length) {
        return Builder.fromConfig(
            col.config, get(col.vector, 'childConfig')
        );
    }

    let type = col.config.type as FieldType;
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
        }
    }

    return Builder.fromConfig<any>({
        type,
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
    push(value: unknown): void;
    flush(): unknown
}

export function makeDefaultAggFn(): FieldAgg {
    let fieldValue: unknown|undefined;
    return {
        push(value: unknown) {
            if (fieldValue === undefined) {
                fieldValue = value ?? null;
            }
        },
        flush(): unknown {
            const result = fieldValue;
            fieldValue = undefined;
            return result;
        },
    };
}

function makeSumAgg(): FieldAgg {
    let sum = 0;
    return {
        push(value: unknown) {
            if (typeof value === 'number' && !Number.isNaN(value)) {
                sum += value;
            }
            // add bigint support
        },
        flush(): number {
            const result = sum;
            sum = 0;
            return result;
        },
    };
}

function makeAvgAgg(): FieldAgg {
    let sum = 0;
    let total = 0;
    return {
        push(value: unknown) {
            if (typeof value === 'number' && !Number.isNaN(value)) {
                sum += value;
                total += 1;
            }
            // add bigint support
        },
        flush(): number {
            const result = sum / total;
            sum = 0;
            total = 0;
            return result;
        },
    };
}

function makeMinAgg(): FieldAgg {
    let min: number|undefined;
    return {
        push(value: unknown) {
            if (typeof value === 'number' && !Number.isNaN(value)) {
                if (min == null || value < min) {
                    min = value;
                }
            }
            // add bigint support
        },
        flush(): number|undefined {
            const result = min;
            min = undefined;
            return result;
        },
    };
}

function makeMaxAgg(): FieldAgg {
    let max: number|undefined;
    return {
        push(value: unknown) {
            if (typeof value === 'number' && !Number.isNaN(value)) {
                if (max == null || value > max) {
                    max = value;
                }
            }
            // add bigint support
        },
        flush(): number|undefined {
            const result = max;
            max = undefined;
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
        flush(): number|undefined {
            const result = count;
            count = undefined;
            return result;
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
            key: toString(value),
            value
        };
    };
}
