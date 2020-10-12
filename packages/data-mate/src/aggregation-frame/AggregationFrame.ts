import { DataTypeConfig, FieldType, SortOrder } from '@terascope/types';
import { pImmediate } from '@terascope/utils';
import {
    Column,
    KeyAggregation, ValueAggregation, valueAggMap,
    FieldAgg, KeyAggFn, keyAggMap, makeUniqueKeyAgg
} from '../column';
import { isNumberLike } from '../vector';
import { Builder } from '../builder';
import { getBuilderForField, getMaxColumnSize } from './utils';
import { createHashCode, freezeArray } from '../core';
import { columnsToDataTypeConfig } from '../data-frame/utils';

/**
 * A deferred execution frame dedicated to running a aggregations.
 *
 * This is different from a DataFrame for a few reasons:
 *  - GroupBy and aggregations have to run at the same time in-order to get the correctly results.
 *  - The operations are added to an instruction set and in one optimized execution.
 *  - All methods in the AggregationFrame will mutate the execution
 *    instructions instead of return a new instance with the applied changes.
 *
 * @todo verify the use of unique
*/
export class AggregationFrame<
    T extends Record<string, any>
> {
    /**
     * The name of the Frame
    */
    name?: string;

    /**
     * The list of columns
    */
    columns: readonly Column<any, keyof T>[];

    /**
     * Metadata about the Frame
    */
    readonly metadata: Record<string, any>;

    /**
     * The field to sort by
     * @internal
    */
    _sortField?: keyof T;

    /**
     * When _sortField is set, this will determine the direction to sort the fields
     * @internal
    */
    _sortDirection?: SortOrder;

    /**
     * The number of records to limit the result by
     * @internal
    */
    _limit?: number;

    protected readonly _aggregations = new Map<keyof T, AggObject>();

    /**
     * Group By fields
    */
    protected readonly _groupByFields: (keyof T)[];

    constructor(
        columns: Column<any, keyof T>[]|readonly Column<any, keyof T>[],
        options: AggregationFrameOptions
    ) {
        this.columns = freezeArray(columns);
        this.name = options?.name;
        this.metadata = options?.metadata ? { ...options.metadata } : {};
        this._groupByFields = [];
    }

    /**
     * Get the number of records in the AggregationFrame
    */
    get size(): number {
        return getMaxColumnSize(this.columns);
    }

    /**
     * Generate the DataType config from the columns.
    */
    get config(): DataTypeConfig {
        return columnsToDataTypeConfig(this.columns);
    }

    get id(): string {
        throw new Error(`${this.constructor.name}.id is currently unsupported`);
    }

    /**
     * GroupBy fields
    */
    groupBy(fields: (keyof T)[]): this {
        this._groupByFields.push(...fields);
        return this;
    }

    /**
     * Calculate the average value in a column
     *
     * @note only works numeric data types
     *
     * @param field the name of the column to run the aggregation on
     * @param as a optional name for the new column with the aggregated values
    */
    [ValueAggregation.avg](field: keyof T): this;
    [ValueAggregation.avg]<A extends string>(
        field: keyof T, as: A
    ): AggregationFrame<WithAlias<T, A, number>>;
    [ValueAggregation.avg]<A extends string>(
        field: keyof T,
        as?: A
    ): this|AggregationFrame<WithAlias<T, A, number>> {
        const { name, type } = this._ensureColumn(field, as);
        if (!isNumberLike(type)) {
            throw new Error(`${ValueAggregation.avg} requires a numeric field type`);
        }
        const aggObject = this._aggregations.get(name) ?? { };
        aggObject.value = ValueAggregation.avg;
        this._aggregations.set(name, aggObject);
        return this as AggregationFrame<T|WithAlias<T, A, number>>;
    }

    /**
     * Add all of the values in a column together
     *
     * @note only works numeric data types
     *
     * @param field the name of the column to run the aggregation on
     * @param as a optional name for the new column with the aggregated values
    */
    [ValueAggregation.sum](field: keyof T): this;
    [ValueAggregation.sum]<A extends string>(
        field: keyof T, as: A
    ): AggregationFrame<WithAlias<T, A, number>>;
    [ValueAggregation.sum]<A extends string>(
        field: keyof T,
        as?: A
    ): this|AggregationFrame<WithAlias<T, A, number>> {
        const { name, type } = this._ensureColumn(field, as);
        if (!isNumberLike(type)) {
            throw new Error(`${ValueAggregation.sum} requires a numeric field type`);
        }
        const aggObject = this._aggregations.get(name) ?? { };
        aggObject.value = ValueAggregation.sum;
        this._aggregations.set(name, aggObject);
        return this as AggregationFrame<T|WithAlias<T, A, number>>;
    }

    /**
     * Find the minimum value in a column
     *
     * @note only works numeric data types
     *
     * @param field the name of the column to run the aggregation on
     * @param as a optional name for the new column with the aggregated values
    */
    [ValueAggregation.min](field: keyof T): this;
    [ValueAggregation.min]<A extends string>(
        field: keyof T, as: A
    ): AggregationFrame<WithAlias<T, A, number>>;
    [ValueAggregation.min]<A extends string>(
        field: keyof T,
        as?: A
    ): this|AggregationFrame<WithAlias<T, A, number>> {
        const { name, type } = this._ensureColumn(field, as);
        if (!isNumberLike(type)) {
            throw new Error(`${ValueAggregation.min} requires a numeric field type`);
        }
        const aggObject = this._aggregations.get(name) ?? { };
        aggObject.value = ValueAggregation.min;
        this._aggregations.set(name, aggObject);
        return this as AggregationFrame<T|WithAlias<T, A, number>>;
    }

    /**
     * Find the maximum value in a column
     *
     * @note only works numeric data types
     *
     * @param field the name of the column to run the aggregation on
     * @param as a optional name for the new column with the aggregated values
    */
    [ValueAggregation.max](field: keyof T): this;
    [ValueAggregation.max]<A extends string>(
        field: keyof T, as: A
    ): AggregationFrame<WithAlias<T, A, number>>;
    [ValueAggregation.max]<A extends string>(
        field: keyof T,
        as?: A
    ): this|AggregationFrame<WithAlias<T, A, number>> {
        const { name, type } = this._ensureColumn(field, as);
        if (!isNumberLike(type)) {
            throw new Error(`${ValueAggregation.max} requires a numeric field type`);
        }
        const aggObject = this._aggregations.get(name) ?? { };
        aggObject.value = ValueAggregation.max;
        this._aggregations.set(name, aggObject);
        return this as AggregationFrame<T|WithAlias<T, A, number>>;
    }

    /**
     * Count all of the values in a column
     *
     * @param field the name of the column to run the aggregation on
     * @param as a optional name for the new column with the aggregated values
    */
    [ValueAggregation.count](field: keyof T): AggregationFrame<T>;
    [ValueAggregation.count]<A extends string>(
        field: keyof T, as: A
    ): AggregationFrame<WithAlias<T, A, number>>;
    [ValueAggregation.count]<A extends string>(
        field: keyof T,
        as?: A
    ): AggregationFrame<T>|AggregationFrame<WithAlias<T, A, number>> {
        const { name } = this._ensureColumn(field, as);
        const aggObject = this._aggregations.get(name) ?? { };
        aggObject.value = ValueAggregation.count;
        this._aggregations.set(name, aggObject);
        return this as AggregationFrame<T|WithAlias<T, A, number>>;
    }

    /**
     * Group the data in hourly buckets
     *
     * @note only works Date data types
     *
     * @param field the name of the column to run the aggregation on
    */
    [KeyAggregation.hourly](field: keyof T): this {
        const { name, type } = this._ensureColumn(field);
        if (type !== FieldType.Date) {
            throw new Error(`${KeyAggregation.hourly} requires a ${FieldType.Date} field type`);
        }
        const aggObject = this._aggregations.get(name) ?? { };
        aggObject.key = KeyAggregation.hourly;
        this._aggregations.set(name, aggObject);
        return this;
    }

    /**
     * Group the data in daily buckets
     *
     * @note only works Date data types
     *
     * @param field the name of the column to run the aggregation on
    */
    [KeyAggregation.daily](field: keyof T): this {
        const { name, type } = this._ensureColumn(field);
        if (type !== FieldType.Date) {
            throw new Error(`${KeyAggregation.daily} requires a ${FieldType.Date} field type`);
        }
        const aggObject = this._aggregations.get(name) ?? { };
        aggObject.key = KeyAggregation.daily;
        this._aggregations.set(name, aggObject);
        return this;
    }

    /**
     * Group the data in monthly buckets
     *
     * @note only works Date data types
     *
     * @param field the name of the column to run the aggregation on
    */
    [KeyAggregation.monthly](field: keyof T): this {
        const { name, type } = this._ensureColumn(field);
        if (type !== FieldType.Date) {
            throw new Error(`${KeyAggregation.monthly} requires a ${FieldType.Date} field type`);
        }
        const aggObject = this._aggregations.get(name) ?? { };
        aggObject.key = KeyAggregation.monthly;
        this._aggregations.set(name, aggObject);
        return this;
    }

    /**
     * Group the data in yearly buckets
     *
     * @note only works Date data types
     *
     * @param field the name of the column to run the aggregation on
    */
    [KeyAggregation.yearly](field: keyof T): this {
        const { name, type } = this._ensureColumn(field);
        if (type !== FieldType.Date) {
            throw new Error(`${KeyAggregation.yearly} requires a ${FieldType.Date} field type`);
        }
        const aggObject = this._aggregations.get(name) ?? { };
        aggObject.key = KeyAggregation.yearly;
        this._aggregations.set(name, aggObject);
        return this;
    }

    /**
     * Order the rows by fields, format of is `field:asc` or `field:desc`.
     * Defaults to `asc` if none specified
    */
    orderBy(field: keyof T, direction?: SortOrder): this {
        if (!field) throw new Error('Missing required field to sort on');

        this._sortField = field;
        this._sortDirection = direction;
        return this;
    }

    /**
     * Sort the records by a field, an alias of orderBy.
     *
     * @see orderBy
    */
    sort(field: keyof T, direction?: SortOrder): this {
        return this.orderBy(field, direction);
    }

    /**
     * Limit the number of results being returned
    */
    limit(num: number): this {
        this._limit = num;
        return this;
    }

    /**
     * Get a column by name
    */
    getColumn<P extends keyof T>(name: P): Column<T[P], P>|undefined {
        const index = this.columns.findIndex((col) => col.name === name);
        return this.getColumnAt<P>(index);
    }

    /**
     * Get a column by index
    */
    getColumnAt<P extends keyof T>(index: number): Column<T[P], P>|undefined {
        return this.columns[index] as Column<any, P>|undefined;
    }

    private _ensureColumn(field: keyof T, as?: string): {
        name: keyof T,
        type: FieldType
    } {
        const col = this.getColumn(field);
        if (!col) throw new Error(`Unknown column named "${field}"`);

        if (as) {
            const columns: Column<any, keyof T>[] = [];
            for (const c of this.columns) {
                columns.push(c);
                if (c === col) {
                    columns.push(c.rename(as));
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
     * Execute the aggregations and flatten the grouped data.
     * Assigns the new columns to this.
     *
     * @todo move the limit and sort logic to here
    */
    async execute(): Promise<this> {
        if (!this._aggregations.size && !this._groupByFields.length) {
            throw new Error('No aggregations specified to run');
        }

        const {
            fieldAggs, keyAggs, otherCols
        } = this._aggregationBuilders();

        const buckets = await this._generateBuckets(keyAggs, otherCols);
        const builders = this._generateBuilders(buckets);

        for (const bucket of buckets.values()) {
            await this._runBucket(builders, fieldAggs, bucket);
        }
        await pImmediate();

        this.columns = Object.freeze([...builders].map(([name, builder]) => {
            const column = this.getColumn(name)!;
            return column.fork(builder.toVector());
        }));
        return this;
    }

    /**
     * Reset the Aggregations
    */
    reset(): this {
        this._limit = undefined;
        this._sortField = undefined;
        this._sortDirection = undefined;
        this._groupByFields.length = 0;
        this._aggregations.clear();
        return this;
    }

    private async _generateBuckets(
        keyAggs: Map<keyof T, KeyAggFn>,
        otherCols: Map<keyof T, Column<any, keyof T>>
    ): Promise<Map<string, any[]>> {
        const buckets = new Map<string, any[]>();

        const count = this.size;
        for (let i = 0; i < count; i++) {
            const row: Partial<T> = {};

            let key = '';
            for (const [field, getKey] of keyAggs) {
                const res = getKey(i);
                if (res.key) key += res.key;
                row[field] = res.value as any;
            }

            if (!key && keyAggs.size) continue;

            for (const [field, col] of otherCols) {
                row[field] = col.vector.get(i);
            }

            const groupKey = createHashCode(key) as string;
            const bucket = buckets.get(groupKey) || [];
            bucket.push(row);
            buckets.set(groupKey, bucket);
        }
        await pImmediate();
        return buckets;
    }

    private _generateBuilders(buckets: Map<string, any[]>): Map<keyof T, Builder<any>> {
        const builders = new Map<keyof T, Builder<any>>();
        for (const col of this.columns) {
            const agg = this._aggregations.get(col.name);
            const builder = getBuilderForField(
                col, buckets.size, agg?.key, agg?.value
            );
            builders.set(col.name, builder);
        }
        return builders;
    }

    private async _runBucket(
        builders: Map<keyof T, Builder<any>>,
        fieldAggs: Map<keyof T, FieldAgg>,
        bucket: any[]
    ): Promise<void> {
        const len = bucket.length;
        for (let i = 0; i < len; i++) {
            for (const [field, agg] of fieldAggs) {
                agg.push(bucket[i][field], [i]);
            }
        }

        let useIndex = 0;
        const remainingFields: (keyof T)[] = [];
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

    private _aggregationBuilders() {
        const fieldAggs = new Map<keyof T, FieldAgg>();
        const keyAggs = new Map<keyof T, KeyAggFn>();
        const otherCols = new Map<keyof T, Column<any, keyof T>>();

        for (const col of this.columns) {
            const agg = this._aggregations.get(col.name);
            let addToOther = true;

            const isInGroupBy = this._groupByFields.includes(col.name);
            if (isInGroupBy) {
                keyAggs.set(col.name, makeUniqueKeyAgg(col.vector));
                addToOther = false;
            }

            if (agg) {
                if (agg.value) {
                    fieldAggs.set(col.name, valueAggMap[agg.value](col.vector));
                }
                if (agg.key) {
                    if (isInGroupBy) {
                        throw new Error(
                            `Invalid to combination of groupBy and ${agg.key} for field ${col.name}`
                        );
                    }
                    keyAggs.set(col.name, keyAggMap[agg.key](col.vector));
                    addToOther = false;
                }
            }

            if (addToOther) {
                otherCols.set(col.name, col);
            }
        }

        return {
            fieldAggs, keyAggs, otherCols
        };
    }
}

type AggObject = {
    key?: KeyAggregation; value?: ValueAggregation
};

type WithAlias<T extends Record<string, unknown>, A extends string, V> = {
    [P in (keyof T)|A]: V;
}

/**
 * AggregationFrame options
*/
export interface AggregationFrameOptions {
    name?: string;
    metadata?: Record<string, any>;
}
