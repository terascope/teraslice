import { createHash } from 'crypto';
import { toString } from '@terascope/utils';
import { Column } from '../column';
import { AggregationFn } from './interfaces';
import { Builder } from '../builder';

type FieldAgg = [fn: AggregationFn, when?: string];
/**
 * Grouped Data with aggregation support
*/
export class GroupedData<T extends Record<string, any>> {
    protected _aggregations: Record<string, FieldAgg[]> = {};

    constructor(
        readonly columns: readonly Column<any>[],
        readonly keys: (keyof T)[]
    ) {}

    avg(field: keyof T, when?: string): GroupedData<T> {
        this._addAgg(field, [AggregationFn.AVG, when]);
        return this;
    }

    sum(field: keyof T, when?: string): GroupedData<T> {
        this._addAgg(field, [AggregationFn.SUM, when]);
        return this;
    }

    min(field: keyof T, when?: string): GroupedData<T> {
        this._addAgg(field, [AggregationFn.MIN, when]);
        return this;
    }

    max(field: keyof T, when?: string): GroupedData<T> {
        this._addAgg(field, [AggregationFn.MAX, when]);
        return this;
    }

    count(field: keyof T, when?: string): GroupedData<T> {
        this._addAgg(field, [AggregationFn.COUNT, when]);
        return this;
    }

    unique(field: keyof T, when?: string): GroupedData<T> {
        this._addAgg(field, [AggregationFn.UNIQUE, when]);
        return this;
    }

    hourly(field: keyof T, when?: string): GroupedData<T> {
        this._addAgg(field, [AggregationFn.HOURLY, when]);
        return this;
    }

    daily(field: keyof T, when?: string): GroupedData<T> {
        this._addAgg(field, [AggregationFn.DAILY, when]);
        return this;
    }

    monthly(field: keyof T, when?: string): GroupedData<T> {
        this._addAgg(field, [AggregationFn.MONTHLY, when]);
        return this;
    }

    yearly(field: keyof T, when?: string): GroupedData<T> {
        this._addAgg(field, [AggregationFn.YEARLY, when]);
        return this;
    }

    protected _addAgg(field: keyof T, agg: FieldAgg): void {
        const aggregations = (this._aggregations[field as string] ?? []) as FieldAgg[];
        this._aggregations[field as string] = aggregations.concat([agg]);
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
        for (const bucket of buckets.values()) {
            const aggRow = bucket.reduce((acc: Record<string, any>|undefined, row) => {
                if (!acc) return row;

                for (const [field, aggregations] of Object.entries(this._aggregations)) {
                    for (const [aggFn] of aggregations) {
                        if (aggFn === AggregationFn.SUM) {
                            acc[field] += row[field];
                        }
                    }
                }
                return acc;
            });
            for (const [field, builder] of builders) {
                builder.append(aggRow[field]);
            }
        }
        return [...builders].map(([field, builder]) => new Column<any>({
            name: field,
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
