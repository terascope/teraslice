---
title: Data Frame
---

## Components

### DataFrame

```ts
/**
 * An immutable columnar table with APIs for data pipelines.
*/
export class DataFrame {
    /**
     * Create a DataFrame from an array of JSON objects
    */
    static fromJSON(
        config: DataTypeConfig|ReadonlyDataTypeConfig,
        records: any[] = [],
        options?: DataFrameOptions
    ): DataFrame;

    /**
     * The name of the DataFrame
    */
    name?: string;

    /**
     * The list of columns
    */
    readonly columns: readonly Column[];

    /**
     * Metadata about the DataFrame
    */
    readonly metadata: M;

    constructor(
        columns: Column[],
        options?: DataFrameOptions
    ): DataFrame

    * [Symbol.iterator](): IterableIterator<T>;

    /**
     * A Unique ID for the DataFrame
     * The ID will only change if the columns or data change
    */
    id: string;

    /**
     * Count of the number rows in the DataFrame
    */
    size: number;

    /**
     * Get the DataType config from the columns.
    */
    config: DataTypeConfig;

    /**
     * Create a fork of the DataFrame
    */
    fork(columns: Column[]): DataFrame;


    /**
     * Get a column, or columns by name, returns a new DataFrame
    */
    select(...fields: string[]): DataFrame;

    /**
     * Get a column, or columns by index, returns a new DataFrame
    */
    selectAt(...indices: number[]): DataFrame;

    /**
     * Group DataFrame by columns and return a AggregationFrame instance
     * which can be used to run aggregations
    */
    groupBy(fields: string[]): AggregationFrame;

    /**
     * Create a AggregationFrame instance which can be used to run aggregations
    */
    aggregate(): AggregationFrame;

    /**
     * Order the rows by fields, format of is `field:asc` or `field:desc`.
     * Defaults to `asc` if none specified
    */
    orderBy(field: string, direction?: SortOrder): DataFrame;

    /**
     * Filter the DataFrame by fields, all fields must return true
     * for a given row to returned in the filtered DataType
     *
     * @example
     *
     *     dataFrame.filter({
     *         name(val) {
     *             return val != null;
     *         },
     *         age(val) {
     *             return val != null && val >= 20;
     *         }
     *     });
    */
    filterBy(filters: {
        [field: string]: (value: any) => boolean>
    }): DataFrame;

    /**
     * Assign new columns to a new DataFrame. If given a column already exists,
     * the column will replace the existing one.
    */
    assign<R extends Record<string, unknown> = Record<string, any>>(
        columns: readonly Column<any>[]
    ): DataFrame<T & R> {
        const newColumns = columns.filter((col) => {
            if (this.getColumn(col.name)) return false;
            return true;
        });

        return this.fork<T & R>(
            this.columns.map((col) => {
                const replaceCol = columns.find((c) => c.name === col.name);
                if (replaceCol) return replaceCol;
                return col;
            }).concat(newColumns) as Column<any>[],
        );
    }

    /**
     * Concat rows, or columns, to the end of the existing Columns
    */
    concat(columns: Column[]): DataFrame;
    concat(columns: Column[]): DataFrame;

    /**
     * Rename an existing column
    */
    rename(name: string, renameTo: string): DataFrame;

    /**
     * Get a column by name
    */
    getColumn(name: string): Column|undefined;

    /**
     * Get a column by index
    */
    getColumnAt(index: number): Column|undefined;

    /**
     * Get a row by index, if the row has only null values, returns undefined
    */
    getRow(index: number, json = false): any|undefined;

    /**
     * Create a new DataFrame with a range of rows
    */
    slice(start?: number, end?: number): DataFrame;

    /**
     * Convert the DataFrame an array of object (the output is JSON compatible)
    */
    toJSON(): T[];
}

/**
 * DataFrame options
*/
export interface DataFrameOptions {
    name?: string;
    metadata?: Record<string, any>;
}
```

### Column

```ts
/**
 * Column options
 */
interface ColumnOptions<T> {
    name: string;
    config: DataTypeFieldConfig;
    values: Vector<T>|(Maybe<T>[]);
}

/**
 * A single column of values with the same data type.
 *
 * Changing the values is safe as long the size doesn't change.
 * When adding or removing values it is better to create a new Column.
*/
interface Column<T = unknown> {
    readonly version: DataTypeVersion;
    readonly name: string;
    readonly config: DataTypeFieldConfig;

    constructor(options: ColumnOptions<T>): Column<T>;

    * [Symbol.iterator](): IterableIterator<Maybe<T>>;

    /**
     * Get the size of the values in the Vector
    */
    readonly size: number;

    /**
     * Create a fork of the Column
    */
    fork(): Column<T>;

    /**
     * Get the underling Vector.
     * Use with caution since it can cause this Column/DataFrame to be out-of-sync
    */
    readonly vector: Vector<T>;

    /**
     * Get value by index
    */
    get(index: number): Maybe<T>;

    /**
     * Set a value by index
    */
    set(index: number, value: Maybe<T>): void;

    /**
     * Get the distinct values in column
    */
    distinct(): number;

    /**
     * Map over the values and mutate them (must keep the same data type)
     *
     * @note this mutates the values but doesn't change the size
     * @returns the current column so it works like fluent API
    */
    map(fn: (value: Maybe<T>, index: number) => Maybe<T>): Column<T>;

    /**
     * Reduce the column to particular value.
     *
     * In the future we will have optimized reducers
     * depending on the data type reducer.
     *
     * @returns the accumulated values
    */
    reduce<R>(fn: (acc: R, value: Maybe<T>, index: number) => R, initial: R): R;

    /**
     * Creates a new column, you can optionally transform the values
     * but shouldn't change the size.
     *
     * This can be used to change the name, type of column.
     * Useful for replacing a column in a DataFrame.
     *
     * @returns the new column so it works like fluent API
    */
    rename<R = T>(
        columnOptions: ColumnOptions<R>,
        fn?: (value: Maybe<T>, index: number) => Maybe<R>
    ): Column<R>;

    /**
     * Creates a new column, you can optionally transform the values
     * but shouldn't change the size.
     *
     * @returns the new column so it works like fluent API
    */
    filter(fn: (value: Maybe<T>, index: number) => boolean): Column<T>;

    /**
     * Convert the Column an array of values (the output is JSON compatible)
     *
     * @note probably only useful for debugging
    */
    toJSON<V>(): Maybe<V>[];
}
```

### Vector

```ts
/**
 * The Vector Type, this will change how the data is stored and read
*/
enum VectorType {
    /**
     * Currently this operates like String
     * but I imagine will be expanding it.
     * But will need to add format options
    */
    Date = 'Date',
    String = 'String',
    Int = 'Int',
    Float = 'Float',
    BigInt = 'BigInt',
    Boolean = 'Boolean',
    /** @todo */
    Geo = 'Geo',
    /** @todo */
    Object = 'Object',
    /**
     * Arbitrary data can be stored with this
    */
    Any = 'Any',
    /**
     * The list type is used for fields marked as Arrays
     * where each item in the Vector is a child element
    */
    List = 'List',
}

/**
 * Coerce a value so it can be stored in the vector
*/
type ValueFromFn<T> = (value: unknown, thisArg?: Vector<T>) => Maybe<T>;
/**
 * Serialize a value to a JSON compatible format (so it can be JSON stringified)
*/
type ValueToJSONFn<T> = (value: Maybe<T>, thisArg?: Vector<T>) => any;

/**
 * A list of Vector Options
 */
interface VectorOptions<T> {
    fieldType: FieldType;
    values: Maybe<T>[];
    valueFrom?: ValueFromFn<T>;
    valueToJSON?: ValueToJSONFn<T>;
}

/**
 * An immutable typed Array class with a constrained API.
 *
 * @note null/undefined values are treated the same
*/
interface Vector<T = unknown> {
    readonly type: VectorType;
    readonly fieldType: FieldType;
    readonly valueFrom?: ValueFromFn<T>;
    readonly valueToJSON?: ValueToJSONFn<T>;

    constructor(
        /**
         * This will be set automatically by specific Vector classes
         */
        type: VectorType,
        options: VectorOptions<T>
    ): Vector<T>;

    * [Symbol.iterator](): IterableIterator<Maybe<T>>;

    /**
     * Returns the number items in the Vector
    */
    readonly size: number;

    /**
     * Create a fork of the Vector
    */
    fork(): Vector<T>;

    /**
     * Gets the number distinct values in the Vector
    */
    distinct(): number;

    /**
     * Get value by index
    */
    get(index: number): Maybe<T>;

    /**
     * Set a value by index
    */
    set(index: number, value: Maybe<T>): void;

    /**
     * Slice get select values from vector
    */
    slice(start?: number, end?: number): Maybe<T>[];

    /**
     * Convert the Vector an array of values (the output should be JSON compatible)
    */
    toJSON<V = T>(): Maybe<V>[];
}
```


## Examples

**TODO**
