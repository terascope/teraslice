import MultiMap from 'mnemonist/multi-map';
import { getFirst, getLast } from '@terascope/utils';
import { Column } from '../column';
import { Aggregation } from './interfaces';
import { Builder } from '../builder';
import {
    aggMap, FieldAgg, getBuilderForField, KeyAggFn,
    keyAggMap, makeDefaultKeyFn, md5
} from './utils';

/**
 * A frame dedicated to running a aggregations
 *
 * @todo validate when adding agg
 * @todo handle mixing key aggregation and value aggregations
*/
export class AggregationFrame<T extends Record<string, any>> {
    protected readonly _aggregations = new MultiMap<string, Aggregation>();

    constructor(
        readonly columns: readonly Column<any>[],
        readonly keyBy: (keyof T)[]
    ) {}

    avg(field: keyof T): AggregationFrame<T> {
        this._addAgg(field, Aggregation.AVG);
        return this;
    }

    sum(field: keyof T): AggregationFrame<T> {
        this._addAgg(field, Aggregation.SUM);
        return this;
    }

    min(field: keyof T): AggregationFrame<T> {
        this._addAgg(field, Aggregation.MIN);
        return this;
    }

    max(field: keyof T): AggregationFrame<T> {
        this._addAgg(field, Aggregation.MAX);
        return this;
    }

    count(field: keyof T): AggregationFrame<T> {
        this._addAgg(field, Aggregation.COUNT);
        return this;
    }

    unique(field: keyof T): AggregationFrame<T> {
        this._addAgg(field, Aggregation.UNIQUE);
        return this;
    }

    hourly(field: keyof T): AggregationFrame<T> {
        this._addAgg(field, Aggregation.HOURLY);
        return this;
    }

    daily(field: keyof T): AggregationFrame<T> {
        this._addAgg(field, Aggregation.DAILY);
        return this;
    }

    monthly(field: keyof T): AggregationFrame<T> {
        this._addAgg(field, Aggregation.MONTHLY);
        return this;
    }

    yearly(field: keyof T): AggregationFrame<T> {
        this._addAgg(field, Aggregation.YEARLY);
        return this;
    }

    protected _addAgg(field: keyof T, agg: Aggregation): void {
        this._aggregations.set(field as string, agg);
    }

    /**
     * Run aggregations and flatten the grouped data into a DataFrame
     * @returns the new columns
    */
    run(): Column[] {
        const buckets = new Map<string, any[]>();
        const count = this.columns[0].count();
        const otherCols = this.columns.filter((col) => !this.keyBy.includes(col.name));
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
            const len = bucket.length;
            for (let i = 0; i < len; i++) {
                for (const [field, agg] of fieldAggs) {
                    agg.push(bucket[i][field], i);
                }
            }

            let useIndex = 0;
            const remainingFields: string[] = [];
            for (const [field, builder] of builders) {
                const agg = fieldAggs.get(field);
                if (agg != null) {
                    const res = agg.flush();
                    if (res.index != null && res.index > useIndex) {
                        useIndex = res.index;
                    }
                    builder.append(res.value);
                } else {
                    remainingFields.push(field);
                }
            }

            for (const field of remainingFields) {
                builders.get(field)!.append(bucket[useIndex][field]);
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
            if (last && aggMap[last]) {
                fieldAggs.set(col.name, aggMap[last]!());
            }

            const first = getFirst(aggs);
            if (this.keyBy.includes(col.name) || (first && first in keyAggMap)) {
                keyAggs.set(col.name, (
                    first && keyAggMap[first] ? keyAggMap[first]!(col) : makeDefaultKeyFn(col)
                ));
            }
        }

        return { builders, fieldAggs, keyAggs };
    }

    clear(): void {
        this._aggregations.clear();
    }
}
