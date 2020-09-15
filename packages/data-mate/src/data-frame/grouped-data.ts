import { createHash } from 'crypto';
import MultiMap from 'mnemonist/multi-map';
import { toString, getLast, get } from '@terascope/utils';
import { FieldType } from '@terascope/types';
import { Column } from '../column';
import { AggregationFn } from './interfaces';
import { Builder } from '../builder';

/**
 * Grouped Data with aggregation support
 * @todo validate when adding agg
*/
export class GroupedData<T extends Record<string, any>> {
    protected readonly _aggregations = new MultiMap<string, AggregationFn>();

    constructor(
        readonly columns: readonly Column<any>[],
        readonly keys: (keyof T)[]
    ) {}

    avg(field: keyof T): GroupedData<T> {
        this._addAgg(field, AggregationFn.AVG);
        return this;
    }

    sum(field: keyof T): GroupedData<T> {
        this._addAgg(field, AggregationFn.SUM);
        return this;
    }

    min(field: keyof T): GroupedData<T> {
        this._addAgg(field, AggregationFn.MIN);
        return this;
    }

    max(field: keyof T): GroupedData<T> {
        this._addAgg(field, AggregationFn.MAX);
        return this;
    }

    count(field: keyof T): GroupedData<T> {
        this._addAgg(field, AggregationFn.COUNT);
        return this;
    }

    unique(field: keyof T): GroupedData<T> {
        this._addAgg(field, AggregationFn.UNIQUE);
        return this;
    }

    hourly(field: keyof T): GroupedData<T> {
        this._addAgg(field, AggregationFn.HOURLY);
        return this;
    }

    daily(field: keyof T): GroupedData<T> {
        this._addAgg(field, AggregationFn.DAILY);
        return this;
    }

    monthly(field: keyof T): GroupedData<T> {
        this._addAgg(field, AggregationFn.MONTHLY);
        return this;
    }

    yearly(field: keyof T): GroupedData<T> {
        this._addAgg(field, AggregationFn.YEARLY);
        return this;
    }

    protected _addAgg(field: keyof T, agg: AggregationFn): void {
        this._aggregations.set(field as string, agg);
    }

    /**
     * Run aggregations and flatten the grouped data into a DataFrame
    */
    collect(): Column[] {
        const buckets = new Map<string, any[]>();
        const count = this.columns[0].count();
        const keyedCols = this.columns.filter((col) => this.keys.includes(col.name));
        const otherCols = this.columns.filter((col) => !this.keys.includes(col.name));
        const { builders, fieldAggs } = this._builders();
        for (let i = 0; i < count; i++) {
            const row: Record<string, any> = {};

            let key = '';
            for (const col of keyedCols) {
                const value = col.vector.get(i);
                key += md5(value);
                row[col.name] = value;
            }

            for (const col of otherCols) {
                const value = col.vector.get(i);
                row[col.name] = value;
            }

            const bucket = buckets.get(key) || [];
            bucket.push(row);
            buckets.set(key, bucket);
        }

        for (const bucket of buckets.values()) {
            for (const row of bucket) {
                for (const [field, agg] of fieldAggs) {
                    agg.push(row[field]);
                }
            }
            for (const [field, builder] of builders) {
                const value = fieldAggs.get(field)!.flush();
                builder.append(value);
            }
        }

        return [...builders].map(([name, builder]) => new Column<any>({
            name,
            config: builder.config,
            vector: builder.toVector()
        }));
    }

    private _builders() {
        const builders = new Map<string, Builder<any>>();
        const fieldAggs = new Map<string, FieldAgg>();
        for (const col of this.columns) {
            const aggs = this._aggregations.get(col.name);
            builders.set(col.name, getBuilderForField(col, aggs));
            if (!aggs?.length) {
                fieldAggs.set(col.name, makeNoAggFn());
            } else {
                const last = getLast(aggs)!;
                fieldAggs.set(col.name, makeAggFn(last));
            }
        }

        return { builders, fieldAggs };
    }

    clear(): void {
        this._aggregations.clear();
    }
}

function getBuilderForField(col: Column<any>, aggs?: AggregationFn[]): Builder<any> {
    if (!aggs?.length) {
        return Builder.fromConfig(
            col.config, get(col.vector, 'childConfig')
        );
    }

    let type = col.config.type as FieldType;
    for (const agg of aggs) {
        if (agg === AggregationFn.AVG) {
            if (type === FieldType.Long) {
                type = FieldType.Double;
            } else if (isNumberLike(type)) {
                type = FieldType.Float;
            } else {
                throw new Error(`Unsupported field type ${type} for aggregation ${agg}`);
            }
        } else if (agg === AggregationFn.SUM) {
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
        } else if (agg === AggregationFn.MAX || agg === AggregationFn.MIN) {
            if (!isNumberLike(type)) {
                throw new Error(`Unsupported field type ${type} for aggregation ${agg}`);
            }
        } else if (agg === AggregationFn.COUNT) {
            type = FieldType.Integer;
        } else {
            // FIXME
            throw new Error(`Unsupported aggregation ${agg}`);
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

function md5(value: any) {
    return createHash('md5').update(toString(value)).digest('hex');
}

type FieldAgg = {
    push(value: unknown): void;
    flush(): unknown
}

function makeNoAggFn(): FieldAgg {
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

const aggMap: Partial<Record<AggregationFn, () => FieldAgg>> = {
    [AggregationFn.AVG]: makeAvgAgg,
    [AggregationFn.SUM]: makeSumAgg,
    [AggregationFn.MIN]: makeMinAgg,
    [AggregationFn.MAX]: makeMaxAgg,
    [AggregationFn.COUNT]: makeCountAgg,
};

function makeAggFn(name: AggregationFn): FieldAgg {
    const fn = aggMap[name];
    if (!fn) {
        throw new Error(`${name} Aggregation isn't supported`);
    }
    return fn();
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
