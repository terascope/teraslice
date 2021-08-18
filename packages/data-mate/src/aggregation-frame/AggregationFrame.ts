import { DataTypeConfig, FieldType } from '@terascope/types';
import { BigMap } from '@terascope/utils';
import {
    Column,
    KeyAggregation, ValueAggregation, valueAggMap,
    FieldAgg, KeyAggFn, keyAggMap, makeUniqueKeyAgg
} from '../column';
import { getCommonTupleType, isNumberLike, Vector } from '../vector';
import { Builder } from '../builder';
import { getBuilderForField, getMaxColumnSize } from './utils';
import {
    FieldArg, flattenStringArg, freezeArray, getFieldsFromArg
} from '../core';
import { columnsToDataTypeConfig, makeKeyForRow } from '../data-frame/utils';

/**
 * A deferred execution frame dedicated to running a aggregations.
 *
 * This is different from a DataFrame for a few reasons:
 *  - GroupBy and aggregations have to run at the same time in-order to get the correctly results.
 *  - The operations are added to an instruction set and in one optimized execution.
 *  - All methods in the AggregationFrame will mutate the execution
 *    instructions instead of return a new instance with the applied changes.
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
     * An array of the column names
    */
    fields: readonly (keyof T)[];

    /**
     * Metadata about the Frame
    */
    readonly metadata: Record<string, any>;

    /**
     * The field to sort by
     * @internal
    */
    protected _sortFields?: (readonly (keyof T)[])|(readonly string[]);

    /**
     * The number of records to limit the result by
    */
    protected _limit?: number;

    /**
     * The Aggregations to run
    */
    protected readonly _aggregations = new Map<keyof T, AggObject>();

    /**
     * Group By fields
    */
    protected _groupByFields: readonly (keyof T)[];

    /**
     * The field to sort by
    */
    protected _selectFields?: readonly (keyof T)[];

    constructor(
        columns: Column<any, keyof T>[]|readonly Column<any, keyof T>[],
        options: AggregationFrameOptions
    ) {
        this.columns = freezeArray(columns);
        this.fields = Object.freeze(this.columns.map((col) => col.name));
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
    groupBy(...fieldArg: FieldArg<keyof T>[]): this {
        this._groupByFields = Object.freeze(this._groupByFields.concat(
            Array.from(getFieldsFromArg(this.fields, fieldArg))
        ));
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
        const { name } = this._ensureColumn(field, as);
        this._ensureNumericLike(name, ValueAggregation.avg);

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
        const { name } = this._ensureColumn(field, as);
        this._ensureNumericLike(name, ValueAggregation.sum);

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
        const { name } = this._ensureColumn(field, as);
        this._ensureNumericLike(name, ValueAggregation.min);

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
        const { name } = this._ensureColumn(field, as);
        this._ensureNumericLike(name, ValueAggregation.max);

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
    [ValueAggregation.count](field: keyof T): this;
    [ValueAggregation.count]<A extends string>(
        field: keyof T, as: A
    ): AggregationFrame<WithAlias<T, A, number>>;
    [ValueAggregation.count]<A extends string>(
        field: keyof T,
        as?: A
    ): this|AggregationFrame<WithAlias<T, A, number>> {
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
    orderBy(...fieldArgs: FieldArg<string>[]): this;
    orderBy(...fieldArgs: FieldArg<keyof T>[]): this;
    orderBy(...fieldArgs: (FieldArg<keyof T>[]|FieldArg<string>[])): this {
        const fields = flattenStringArg(fieldArgs);
        if (fields.size > 1) {
            throw new Error('AggregationFrame.orderBy can only works with one field currently');
        }

        this._sortFields = Object.freeze([...fields]);
        return this;
    }

    /**
     * Sort the records by a field, an alias of orderBy.
     *
     * @see orderBy
    */
    sort(...fieldArgs: FieldArg<string>[]): this;
    sort(...fieldArgs: FieldArg<keyof T>[]): this;
    sort(...fieldArgs: (FieldArg<keyof T>[]|FieldArg<string>[])): this {
        return this.orderBy(...fieldArgs);
    }

    /**
     * Limit the number of results being returned
    */
    limit(num: number): this {
        this._limit = num;
        return this;
    }

    /**
     * After the aggregations run, return only these selected fields
    */
    select<K extends keyof T>(...fieldArg: FieldArg<K>[]): AggregationFrame<Pick<T, K>> {
        this._selectFields = Object.freeze([...getFieldsFromArg(this.fields, fieldArg)]);
        return this as any;
    }

    /**
     * Get a column by name
    */
    getColumn<P extends keyof T>(field: P): Column<T[P], P>|undefined {
        const index = this.columns.findIndex((col) => col.name === field);
        return this.getColumnAt<P>(index);
    }

    /**
     * Get a column by name or throw if not found
    */
    getColumnOrThrow<P extends keyof T>(field: P): Column<T[P], P> {
        const column = this.getColumn(field);
        if (!column) {
            throw new Error(`Unknown column ${field} in${
                this.name ? ` ${this.name}` : ''
            } ${this.constructor.name}`);
        }
        return column;
    }

    /**
     * Get a column by index
    */
    getColumnAt<P extends keyof T>(index: number): Column<T[P], P>|undefined {
        return this.columns[index] as Column<any, P>|undefined;
    }

    /**
     * Rename an existing column
    */
    rename<K extends keyof T, R extends string>(
        name: K,
        renameTo: R,
    ): AggregationFrame<Omit<T, K> & Record<R, T[K]>> {
        this.columns = Object.freeze(
            this.columns.map((col): Column<any, any> => {
                if (col.name !== name) return col;
                return col.rename(renameTo);
            })
        );

        this.fields = Object.freeze(this.fields.map((field) => {
            if (field === name) return renameTo;
            return field;
        }));

        this._sortFields = this._sortFields ? Object.freeze(
            (this._sortFields as string[]).map((field) => {
                if (field === name) return renameTo;
                if (field.startsWith(`${name}:`)) {
                    return field.replace(`${name}:`, `${renameTo}:`);
                }
                return field;
            }) as any[]
        ) : this._sortFields;

        this._selectFields = this._selectFields ? Object.freeze(
            this._selectFields.map((field) => {
                if (field === name) return renameTo;
                return field;
            })
        ) : this._selectFields;

        this._groupByFields = Object.freeze(
            this._groupByFields.map((field) => {
                if (field === name) return renameTo;
                return field;
            })
        );

        const agg = this._aggregations.get(name);
        if (agg) {
            this._aggregations.delete(name);
            this._aggregations.set(renameTo, agg);
        }

        return this as any;
    }

    /**
     * Assign new columns, if given a column already exists,
     * the column will replace the existing one.
    */
    assign<R extends Record<string, unknown> = Record<string, any>>(
        columns: readonly Column<any>[]
    ): AggregationFrame<T & R> {
        const newColumns = columns.filter((col) => {
            if (this.getColumn(col.name)) return false;
            return true;
        });

        this.columns = Object.freeze(this.columns.map((col) => {
            const replaceCol = columns.find((c) => c.name === col.name);
            if (replaceCol) return replaceCol;
            return col;
        }).concat(newColumns)) as readonly Column<any>[];

        this.fields = Object.freeze(
            this.fields.concat(newColumns.map((col) => col.name))
        );

        return this as any;
    }

    private _ensureColumn(field: keyof T, as?: string): {
        name: keyof T,
        type: FieldType
    } {
        const col = this.getColumnOrThrow(field);

        if (as) {
            const columns: Column<any, keyof T>[] = [];
            for (const c of this.columns) {
                columns.push(c);
                if (c === col) {
                    columns.push(c.rename(as));
                    this.fields = Object.freeze(this.fields.concat(as));
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

    private _ensureNumericLike(field: keyof T, ctx: string): void {
        const column = this.getColumnOrThrow(field);
        let fieldType: FieldType;
        if (column.config.type === FieldType.Tuple) {
            fieldType = getCommonTupleType(
                field as string, column.vector.childConfig
            );
        } else {
            fieldType = column.config.type as FieldType;
        }

        if (!isNumberLike(fieldType)) {
            throw new Error(`${ctx} requires a numeric field type`);
        }
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

        const buckets = this._generateBuckets(
            this._aggregationBuilders()
        );
        const builders = this._generateBuilders(buckets.size);

        for (const [key, bucket] of buckets) {
            this._buildBucket(builders, bucket);
            // free up that memory
            buckets.delete(key);
        }

        this.columns = Object.freeze([...builders].map(([name, builder]) => {
            const column = this.getColumnOrThrow(name);
            return column.fork(builder.toVector());
        }));
        return this;
    }

    /**
     * Reset the Aggregations
    */
    reset(): this {
        this._limit = undefined;
        this._sortFields = undefined;
        this._selectFields = undefined;
        this._groupByFields = Object.freeze([]);
        this._aggregations.clear();
        return this;
    }

    private _generateBuckets(
        { keyAggs, fieldAggMakers }: AggBuilders<T>
    ): BigMap<string, Bucket<T>> {
        const buckets = new BigMap<string, Bucket<T>>();
        const getFieldAggs = makeGetFieldAggs(buckets);

        for (let i = 0; i < this.size; i++) {
            const res = makeKeyForRow(keyAggs, i);
            if (res) {
                const fieldAggs = getFieldAggs(res.key, i);
                fieldAggMakers.forEach(
                    makeProcessFieldAgg(fieldAggs, i)
                );
            }
        }

        return buckets;
    }

    private _generateBuilders(size: number): Map<keyof T, Builder<any>> {
        const builders = new Map<keyof T, Builder<any>>();
        for (const col of this.columns) {
            if (!this._selectFields?.length || this._selectFields.includes(col.name)) {
                const agg = this._aggregations.get(col.name);
                const builder = getBuilderForField(
                    col, size, agg?.key, agg?.value
                );
                builders.set(col.name, builder);
            }
        }
        return builders;
    }

    private _buildBucket(
        builders: Map<keyof T, Builder<any>>,
        [fieldAggs, startIndex]: Bucket<T>,
    ): void {
        if (fieldAggs.adjustsSelectedRow) {
            return this._buildBucketWithAdjustedRowIndex(builders, [fieldAggs, startIndex]);
        }

        for (const [field, builder] of builders) {
            const agg = fieldAggs.get(field);
            if (agg != null) {
                builder.append(agg.flush().value);
            } else {
                const col = this.getColumnOrThrow(field);
                builders.get(field)!.append(col.vector.get(startIndex));
            }
        }
    }

    /**
     * this is slower version of the aggregation
     * that will select a specific row that shows more
     * correct information, like for min and max
    */
    private _buildBucketWithAdjustedRowIndex(
        builders: Map<keyof T, Builder<any>>,
        [fieldAggs, startIndex]: Bucket<T>,
    ): void {
        let useIndex = startIndex;
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
            const col = this.getColumnOrThrow(field);
            builders.get(field)!.append(col.vector.get(useIndex));
        }
    }

    private _aggregationBuilders(): AggBuilders<T> {
        const fieldAggMakers = new Map<keyof T, FieldAggMaker>();
        const keyAggs = new Map<keyof T, KeyAggFn>();

        for (const col of this.columns) {
            const agg = this._aggregations.get(col.name);

            const isInGroupBy = this._groupByFields.includes(col.name);
            if (isInGroupBy) {
                keyAggs.set(col.name, makeUniqueKeyAgg(col.vector));
            }

            if (agg) {
                if (agg.value) {
                    fieldAggMakers.set(col.name, curryFieldAgg(agg.value, col.vector));
                }
                if (agg.key) {
                    if (isInGroupBy) {
                        throw new Error(
                            `Invalid to combination of groupBy and ${agg.key} for field ${col.name}`
                        );
                    }
                    keyAggs.set(col.name, keyAggMap[agg.key](col.vector));
                }
            }
        }

        return {
            fieldAggMakers, keyAggs
        };
    }
}

type AggObject = {
    key?: KeyAggregation; value?: ValueAggregation
};

type WithAlias<T extends Record<string, unknown>, A extends string, V> = {
    [P in (keyof T)|A]: V;
}

type FieldAggMaker = [fieldAgg: () => FieldAgg, vector: Vector<any>];

type FieldAggsMap<T extends Record<string, unknown>> = Map<keyof T, FieldAgg> & {
    adjustsSelectedRow: boolean
};
type Bucket<T extends Record<string, unknown>> = [
    fieldAggs: FieldAggsMap<T>, startIndex: number
];

interface AggBuilders<T extends Record<string, any>> {
    fieldAggMakers: Map<keyof T, FieldAggMaker>;
    keyAggs: Map<keyof T, KeyAggFn>;
}

/**
 * AggregationFrame options
*/
export interface AggregationFrameOptions {
    name?: string;
    metadata?: Record<string, any>;
}

function curryFieldAgg(
    valueAgg: ValueAggregation,
    vector: Vector<any>
): FieldAggMaker {
    return [() => valueAggMap[valueAgg](vector), vector];
}

function makeGetFieldAggs<T extends Record<string, any>>(buckets: BigMap<string, Bucket<T>>) {
    return function getFieldAggs(key: string, index: number): FieldAggsMap<T> {
        const fieldAggRes = buckets.get(key);

        if (!fieldAggRes) {
            const fieldAggs = new Map() as FieldAggsMap<T>;
            fieldAggs.adjustsSelectedRow = false;
            buckets.set(key, [fieldAggs, index]);
            return fieldAggs;
        }
        return fieldAggRes[0];
    };
}

function makeProcessFieldAgg<T extends Record<string, any>>(
    fieldAggs: FieldAggsMap<T>, index: number
) {
    return function processFieldAgg(maker: FieldAggMaker, field: keyof T) {
        let agg = fieldAggs.get(field);
        if (!agg) {
            agg = maker[0]();
            fieldAggs.set(field, agg);
        }
        if (agg.adjustsSelectedRow) {
            // if it is already set to true, the outcome
            // will probably be wrong so lets ignore that
            if (fieldAggs.adjustsSelectedRow) {
                fieldAggs.adjustsSelectedRow = false;
            } else {
                fieldAggs.adjustsSelectedRow = true;
            }
        }
        agg.push(maker[1].get(index), index);
    };
}
