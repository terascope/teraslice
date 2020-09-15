import MultiMap from 'mnemonist/multi-map';
import { getFirst, getLast } from '@terascope/utils';
import { Column } from '../column';
import { AggregationFn } from './interfaces';
import { Builder } from '../builder';
import {
    aggMap, FieldAgg, getBuilderForField, KeyAggFn,
    keyAggMap, makeDefaultAggFn, makeDefaultFieldFn, md5
} from './aggregation-utils';

/**
 * Grouped Data with aggregation support
 * @todo validate when adding agg
 * @todo handle mixing key aggregation and value aggregations
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
        const otherCols = this.columns.filter((col) => !this.keys.includes(col.name));
        const { builders, fieldAggs, keyAggs } = this._builders();

        for (let i = 0; i < count; i++) {
            const row: Record<string, any> = {};

            let key = '';
            for (const [field, getKey] of keyAggs) {
                const res = getKey(i);
                if (res.key) key += res.key;
                row[field] = res.value;
            }

            for (const col of otherCols) {
                const value = col.vector.get(i);
                row[col.name] = value;
            }

            const groupKey = md5(key);
            const bucket = buckets.get(groupKey) || [];
            bucket.push(row);
            buckets.set(groupKey, bucket);
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
        const keyAggs = new Map<string, KeyAggFn>();

        for (const col of this.columns) {
            const aggs = this._aggregations.get(col.name);
            builders.set(col.name, getBuilderForField(col, aggs));
            const last = getLast(aggs);

            fieldAggs.set(col.name, (
                last && aggMap[last] ? aggMap[last]!() : makeDefaultAggFn()
            ));

            const first = getFirst(aggs);
            if (this.keys.includes(col.name) || (first && first in keyAggMap)) {
                keyAggs.set(col.name, (
                    first && keyAggMap[first] ? keyAggMap[first]!(col) : makeDefaultFieldFn(col)
                ));
            }
        }

        return { builders, fieldAggs, keyAggs };
    }

    clear(): void {
        this._aggregations.clear();
    }
}
