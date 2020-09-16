import { FieldType } from '@terascope/types';
import { Column } from '../column';
import {
    KeyAggregation, ValueAggregation, valueAggMap,
    FieldAgg, KeyAggFn, keyAggMap, md5, isNumberLike
} from '../vector';
import { Builder } from '../builder';
import { getBuilderForField } from './utils';

/**
 * A frame dedicated to running a aggregations
*/
export class AggregationFrame<T extends Record<string, any>> {
    columns: readonly Column<any>[];
    readonly keyBy: readonly (keyof T)[];
    protected readonly _aggregations = new Map<string, AggObject>();

    constructor(columns: readonly Column<any>[], keyBy?: readonly (keyof T)[]) {
        this.columns = Object.freeze(columns.slice());
        this.keyBy = Object.freeze(keyBy ?? []);
        for (const key of this.keyBy) {
            this[KeyAggregation.unique](key);
        }
    }

    [ValueAggregation.avg](field: keyof T, as?: string): AggregationFrame<T> {
        const { name, type } = this._ensureColumn(field, as);
        if (!isNumberLike(type)) {
            throw new Error(`${ValueAggregation.avg} requires a numeric field type`);
        }
        const aggObject = this._aggregations.get(name) ?? { };
        aggObject.value = ValueAggregation.avg;
        this._aggregations.set(name, aggObject);
        return this;
    }

    [ValueAggregation.sum](field: keyof T, as?: string): AggregationFrame<T> {
        const { name, type } = this._ensureColumn(field, as);
        if (!isNumberLike(type)) {
            throw new Error(`${ValueAggregation.sum} requires a numeric field type`);
        }
        const aggObject = this._aggregations.get(name) ?? { };
        aggObject.value = ValueAggregation.sum;
        this._aggregations.set(name, aggObject);
        return this;
    }

    [ValueAggregation.min](field: keyof T, as?: string): AggregationFrame<T> {
        const { name, type } = this._ensureColumn(field, as);
        if (!isNumberLike(type)) {
            throw new Error(`${ValueAggregation.min} requires a numeric field type`);
        }
        const aggObject = this._aggregations.get(name) ?? { };
        aggObject.value = ValueAggregation.min;
        this._aggregations.set(name, aggObject);
        return this;
    }

    [ValueAggregation.max](field: keyof T, as?: string): AggregationFrame<T> {
        const { name, type } = this._ensureColumn(field, as);
        if (!isNumberLike(type)) {
            throw new Error(`${ValueAggregation.max} requires a numeric field type`);
        }
        const aggObject = this._aggregations.get(name) ?? { };
        aggObject.value = ValueAggregation.max;
        this._aggregations.set(name, aggObject);
        return this;
    }

    [ValueAggregation.count](field: keyof T, as?: string): AggregationFrame<T> {
        const { name } = this._ensureColumn(field, as);
        const aggObject = this._aggregations.get(name) ?? { };
        aggObject.value = ValueAggregation.count;
        this._aggregations.set(name, aggObject);
        return this;
    }

    [KeyAggregation.unique](field: keyof T, as?: string): AggregationFrame<T> {
        const { name } = this._ensureColumn(field, as);
        const aggObject = this._aggregations.get(name) ?? { };
        aggObject.key = KeyAggregation.unique;
        this._aggregations.set(name, aggObject);
        return this;
    }

    [KeyAggregation.hourly](field: keyof T, as?: string): AggregationFrame<T> {
        const { name, type } = this._ensureColumn(field, as);
        if (type !== FieldType.Date) {
            throw new Error(`${KeyAggregation.hourly} requires a ${FieldType.Date} field type`);
        }
        const aggObject = this._aggregations.get(name) ?? { };
        aggObject.key = KeyAggregation.hourly;
        this._aggregations.set(name, aggObject);
        return this;
    }

    [KeyAggregation.daily](field: keyof T, as?: string): AggregationFrame<T> {
        const { name, type } = this._ensureColumn(field, as);
        if (type !== FieldType.Date) {
            throw new Error(`${KeyAggregation.daily} requires a ${FieldType.Date} field type`);
        }
        const aggObject = this._aggregations.get(name) ?? { };
        aggObject.key = KeyAggregation.daily;
        this._aggregations.set(name, aggObject);
        return this;
    }

    [KeyAggregation.monthly](field: keyof T, as?: string): AggregationFrame<T> {
        const { name, type } = this._ensureColumn(field, as);
        if (type !== FieldType.Date) {
            throw new Error(`${KeyAggregation.monthly} requires a ${FieldType.Date} field type`);
        }
        const aggObject = this._aggregations.get(name) ?? { };
        aggObject.key = KeyAggregation.monthly;
        this._aggregations.set(name, aggObject);
        return this;
    }

    [KeyAggregation.yearly](field: keyof T, as?: string): AggregationFrame<T> {
        const { name, type } = this._ensureColumn(field, as);
        if (type !== FieldType.Date) {
            throw new Error(`${KeyAggregation.yearly} requires a ${FieldType.Date} field type`);
        }
        const aggObject = this._aggregations.get(name) ?? { };
        aggObject.key = KeyAggregation.yearly;
        this._aggregations.set(name, aggObject);
        return this;
    }

    private _ensureColumn(field: keyof T, as: string|undefined): { name: string, type: FieldType } {
        const col = this.columns.find((c) => c.name === field);
        if (!col) throw new Error(`Unknown column named "${field}"`);

        if (as) {
            const columns: Column<any>[] = [];
            for (const c of this.columns) {
                columns.push(c);
                if (c === col) {
                    const newCol = c.fork();
                    newCol.name = as;
                    columns.push(newCol);
                }
            }
            this.columns = Object.freeze(columns);
            return {
                name: as,
                type: col.config.type as FieldType
            };
        }

        return {
            name: col.name,
            type: col.config.type as FieldType
        };
    }

    /**
     * Run aggregations and flatten the grouped data into a DataFrame
     * @returns the new columns
    */
    async run(): Promise<Column[]> {
        const buckets = new Map<string, any[]>();
        const count = this.columns[0].count();
        const {
            builders, fieldAggs, keyAggs, otherCols
        } = this._builders();

        for (let i = 0; i < count; i++) {
            const row: Record<string, any> = {};

            let key = '';
            for (const [field, getKey] of keyAggs) {
                const res = getKey(i);
                if (res.key) key += res.key;
                row[field] = res.value;
            }

            for (const [field, col] of otherCols) {
                row[field] = col.vector.get(i);
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
        const otherCols = new Map<string, Column<any>>();

        for (const col of this.columns) {
            const agg = this._aggregations.get(col.name);
            let addToOther = true;
            const builder = getBuilderForField(col, agg?.key, agg?.value);
            builders.set(col.name, builder);

            if (agg) {
                if (agg.value) {
                    fieldAggs.set(col.name, valueAggMap[agg.value](col.vector));
                }
                if (agg.key) {
                    keyAggs.set(col.name, keyAggMap[agg.key](col.vector));
                    addToOther = false;
                }
            }

            if (addToOther) {
                otherCols.set(col.name, col);
            }
        }

        return {
            builders, fieldAggs, keyAggs, otherCols
        };
    }

    clear(): void {
        this._aggregations.clear();
    }
}

type AggObject = {
    key?: KeyAggregation; value?: ValueAggregation
};
