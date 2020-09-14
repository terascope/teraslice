import { createHash } from 'crypto';
import { toString } from '@terascope/utils';
import { Column } from '../column';
import { AggregationFn } from './interfaces';
import { Builder } from '../builder';

/**
 * Grouped Data with aggregation support
 * @todo validate when adding agg
*/
export class GroupedData<T extends Record<string, any>> {
    protected _aggregations: Record<string, AggregationFn[]> = {};

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
        const aggregations = (this._aggregations[field as string] ?? []) as AggregationFn[];
        this._aggregations[field as string] = aggregations.concat(agg);
    }

    /**
     * Run aggregations and flatten the grouped data into a DataFrame
    */
    collect(): Column[] {
        const buckets = new Map<string, any[]>();
        const count = this.columns[0].count();
        const keyedCols = this.columns.filter((col) => this.keys.includes(col.name));
        const otherCols = this.columns.filter((col) => !this.keys.includes(col.name));
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

        const builders = new Map<string, Builder<any>>();
        for (const col of this.columns) {
            // FIXME add childConfig
            builders.set(col.name, Builder.fromConfig(col.config));
        }
        const fieldAggs = Object.entries(this._aggregations).map(([field, aggregations]) => [
            field, makeAggFn(aggregations[0])
        ]) as [string, AggWrapper][];

        for (const bucket of buckets.values()) {
            for (const row of bucket) {
                for (const [field, agg] of fieldAggs) {
                    agg.push(row[field]);
                }
            }
            const aggRow = { ...bucket[0] };
            for (const [field, agg] of fieldAggs) {
                aggRow[field] = agg.flush();
            }
            for (const [field, builder] of builders) {
                builder.append(aggRow[field]);
            }
        }

        return [...builders].map(([name, builder]) => new Column<any>({
            name,
            config: builder.config,
            vector: builder.toVector()
        }));
    }

    clear(): void {
        this._aggregations = {};
    }
}

function md5(value: any) {
    return createHash('md5').update(toString(value)).digest('hex');
}

type AggWrapper = {
    push(value: unknown): void;
    flush(): unknown
}

const aggMap: Partial<Record<AggregationFn, () => AggWrapper>> = {
    [AggregationFn.AVG]: makeAvgAgg,
    [AggregationFn.SUM]: makeSumAgg,
    [AggregationFn.MIN]: makeMinAgg,
    [AggregationFn.MAX]: makeMaxAgg,
};

function makeAggFn(name: AggregationFn): AggWrapper {
    const fn = aggMap[name];
    if (!fn) {
        throw new Error(`${name} Aggregation isn't supported`);
    }
    return fn();
}

function makeSumAgg(): AggWrapper {
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

function makeAvgAgg(): AggWrapper {
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

function makeMinAgg(): AggWrapper {
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

function makeMaxAgg(): AggWrapper {
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
