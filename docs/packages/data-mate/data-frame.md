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
     * The name of the Frame
    */
    name?: string;

    /**
     * The list of columns
    */
    readonly columns: readonly Column[];

    /**
     * Metadata about the Frame
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
     * Create a new DataFrame with the same metadata but with different data
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
     * An alias to orderBy
    */
    sort(field: string, direction?: SortOrder): DataFrame;

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
    assign(columns: readonly Column[]): DataFrame;

    /**
     * Concat rows, or columns, to the end of the existing Columns
    */
    concat(columns: Column[]): DataFrame;
    concat(rows: AnyObject[]): DataFrame;

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
     * Returns a DataFrame with a limited number of rows
    */
    limit(num: number): DataFrame;

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
    metadata?: AnyObject;
}
```

### Column

```ts
/**
 * A single column of values with the same data type.
 *
 * Changing the values is safe as long the length doesn't change.
 * When adding or removing values it is better to create a new Column.
*/
export class Column {
    /**
     * Create a Column from an array of values
    */
    static fromJSON(
        name: string,
        config: DataTypeFieldConfig,
        values: any[] = [],
    ): Column;

    /**
     * The field name for the column
    */
    name: string;

    /**
     * The DataType version to use for the field definition
    */
    readonly version: DataTypeVersion;

    constructor(
        vector: Vector,
        options: ColumnOptions
    ): Column;

    /**
     * Iterate over each value, this is returned in the stored value format.
     * And may not be compatible with the JSON spec.
    */
    * [Symbol.iterator](): IterableIterator<any>;

    /**
     * A Unique ID for the Column.
     * The ID should only change if the data vector changes.
    */
    id: string;

    /**
     * Get the size of the column
    */
    size: number;

    /**
     * Get the underling Vector.
    */
    vector: Vector;

    /**
     * Get the Data Type field configuration.
    */
    config: DataTypeFieldConfig;

    /**
     * Create a new Column with the same metadata but with different data
    */
    fork(vector: Vector): Column;

    /**
     * Transform the values with in a column.
     *
     * @note this will always keep the same length
    */
    transform(config: ColumnTransformConfig, args?: AnyObject): Column;

    /**
     * Creates a new column, if the function returns false
     * then the value is set to null.
     *
     * @note this will always keep the same length
    */
    validate(validateConfig: ColumnValidateConfig, args?: AnyObject): Column;

    /**
     * Sort the column
    */
    sort(direction?: SortOrder): Column;

    /**
     * Average all of the values in the Column
    */
    avg(): number|bigint;

    /**
     * Sum all of the values in the Column
    */
    sum(): number|bigint;

    /**
     * Find the minimum value in the Column
    */
    min(): number|bigint;

    /**
     * Find the maximum value in the Column
    */
    max(): number|bigint;

    /**
     * Convert the Column an array of values (the output is JSON compatible)
     *
     * @note probably only useful for debugging
    */
    toJSON(): any[];
}
```

### Vector

```ts
/**
 * The Vector Type, this will change how the data is stored and read
*/
export enum VectorType {
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
    GeoPoint = 'GeoPoint',
    GeoJSON = 'GeoJSON',
    IP = 'IP',
    IPRange = 'IPRange',
    Object = 'Object',
    /**
     * Arbitrary data can be stored with this. Not recommended for use.
    */
    Any = 'Any',
    /**
     * The list type is used for fields marked as Arrays
     * where each item in the Vector is a child element
    */
    List = 'List',
}

/**
 * An immutable typed Array class with a constrained API.
*/
export abstract class Vector {
    /**
     * Make an instance of a Vector from a config
    */
    static make(
        config: DataTypeFieldConfig,
        data: ReadableData,
        childConfig?: DataTypeFields
    ): Vector;

    /**
     * The type of Vector, this should only be set the specific Vector type classes.
    */
    readonly type: VectorType;

    /**
     * The field type configuration
    */
    readonly config: DataTypeFieldConfig;

    /**
     * A function for converting a value to an JSON spec compatible format.
     * This is specific on the vector type classes via a static method usually.
    */
    readonly valueToJSON?: ValueToJSONFn;

    /**
     * When Vector is an object type, this will be the data type fields
     * for the object
    */
    readonly childConfig?: ReadonlyDataTypeFields;

    /**
     * A data type agnostic in-memory representation of the data
     * for a Vector and potential indices/unique values.
     *
     * This should be generated by the builder and
     * should NOT be mutated one created.
     *
     * @internal
    */
    readonly data: ReadableData;

    constructor(options: VectorOptions): Vector;

    * [Symbol.iterator](): IterableIterator<any>;

    /**
     * Returns the number items in the Vector
    */
    size: number;

    /**
     * Gets the number distinct values in the Vector
    */
    distinct(): number;

    /**
     * Get value by index
    */
    get(index: number, json?: boolean): any;

    /**
     * Create a new Vector with the same metadata but with different data
    */
    fork(data: ReadableData): Vector;

    /**
     * Create a new Vector with the range of values
    */
    slice(start?: number, end?: number): Vector;

    /**
     * Sort the values in a Vector and return
     * an array with the updated indices.
    */
    getSortedIndices(direction?: SortOrder): number[];

    /**
     * Compare two different values on the Vector type.
     * This can be used for equality or sorted.
    */
    compare(a: Maybe<any>, b: Maybe<any>): -1|0|1;

    /**
     * Convert the Vector an array of values (the output is JSON compatible)
    */
    toJSON(): any[];
}
```


### Builder

```ts
/**
 * Since Vectors are immutable, a Builder can be to construct a
 * Vector. When values are inserted they are coerced and validated.
*/
export abstract class Builder {
    /**
     * Make a instance of a Builder from a DataTypeField config
    */
    static make(
        config: DataTypeFieldConfig,
        data?: WritableData,
        childConfig?: DataTypeFields
    ): Builder;

    /**
     * Convert a Vector to a Builder with current values
     * populated depending on the length populated
    */
    static makeFromVector(
        vector: Vector,
        size: number
    ): Builder;

     /**
     * The type of Vector, this should only be set the specific Vector type classes.
    */
    readonly type: VectorType;

    /**
     * The field type configuration
    */
    readonly config: DataTypeFieldConfig;

    /**
     * A function for converting a value to an JSON spec compatible format.
     * This is specific on the vector type classes via a static method usually.
    */
    readonly valueFrom?: ValueFromFn;

    /**
     * When Vector is an object type, this will be the data type fields
     * for the object
    */
    readonly childConfig?: DataTypeFields;

    /**
     * @internal
    */
    readonly data: WritableData;

    /**
     * The current insertion index (used for append)
    */
    currentIndex = 0;

    constructor(options: BuilderOptions): Builder;

    /**
     * Returns the number items in the Builder
    */
    size: number;

    /**
     * Set value by index
    */
    set(index: number, value: unknown): Builder;

    /**
     * Set a single unique value on multiple indices
    */
    mset(value: unknown, indices: number[]): Builder;

    /**
     * Append a value to the end
    */
    append(value: unknown): Builder;

    /**
     * Flush and convert the result to a Vector
    */
    toVector(): Vector;
}
```

### AggregationFrame

```ts
/**
 * A deferred execution frame dedicated to running a aggregations.
 *
 * This is different from a DataFrame for a few reasons:
 *  - GroupBy and aggregations have to run at the same time in-order to get the correctly results.
 *  - The operations are added to an instruction set and in one optimized execution.
 *  - All methods in the AggregationFrame will mutate the execution
 *    instructions instead of return a new instance with the applied changes.
*/
export class AggregationFrame {
    /**
     * The name of the Frame
    */
    name?: string;

    /**
     * The list of columns
    */
    columns: readonly Column[];

    /**
     * Metadata about the Frame
    */
    readonly metadata: Record<string, any>;

    constructor(
        columns: Column[],
        options?: DataFrameOptions
    ): AggregationFrame;

    /**
     * Calculate the average value in a column
     *
     * @note only works numeric data types
     *
     * @param field the name of the column to run the aggregation on
     * @param as a optional name for the new column with the aggregated values
    */
    avg(field: string, as?: string): this;

    /**
     * Add all of the values in a column together
     *
     * @note only works numeric data types
     *
     * @param field the name of the column to run the aggregation on
     * @param as a optional name for the new column with the aggregated values
    */
    sum(field: string, as?: string): this;

    /**
     * Find the minimum value in a column
     *
     * @note only works numeric data types
     *
     * @param field the name of the column to run the aggregation on
     * @param as a optional name for the new column with the aggregated values
    */
    min(field: string, as?: string): this;

    /**
     * Find the maximum value in a column
     *
     * @note only works numeric data types
     *
     * @param field the name of the column to run the aggregation on
     * @param as a optional name for the new column with the aggregated values
    */
    max(field: string, as?: string): this;

    /**
     * Count all of the values in a column
     *
     * @param field the name of the column to run the aggregation on
     * @param as a optional name for the new column with the aggregated values
    */
    count(field: string, as?: string): this;

    /**
     * Create a groups of unique values
     *
     * @param field the name of the column to run the aggregation on
     * @param as a optional name for the new column with the aggregated values
    */
    unique(field: string): this;

    /**
     * Group the data in hourly buckets
     *
     * @note only works Date data types
     *
     * @param field the name of the column to run the aggregation on
    */
    hourly(field: string): this;

    /**
     * Group the data in daily buckets
     *
     * @note only works Date data types
     *
     * @param field the name of the column to run the aggregation on
    */
    daily(field: string): this;

    /**
     * Group the data in monthly buckets
     *
     * @note only works Date data types
     *
     * @param field the name of the column to run the aggregation on
    */
    monthly(field: string): this;

    /**
     * Group the data in yearly buckets
     *
     * @note only works Date data types
     *
     * @param field the name of the column to run the aggregation on
    */
    yearly(field: string): this;

    /**
     * Execute and run aggregations and flatten the grouped data into a DataFrame
     * @returns the new columns
    */
    run(): Promise<DataFrame>;

    /**
     * Execute the aggregations and flatten the grouped data.
     * Assigns the new columns to this.
    */
    execute(): Promise<this>;

    /**
     * Order the rows by fields, format of is `field:asc` or `field:desc`.
     * Defaults to `asc` if none specified
    */
    orderBy(field: string, direction?: SortOrder): this;

    /**
     * Sort the records by a field, an alias of orderBy.
     *
     * @see orderBy
    */
    sort(field: string, direction?: SortOrder): this;

    /**
     * Limit the number of results being returned
    */
    limit(num: number): this;

    /**
     * Get a column by name
    */
    getColumn(name: string): Column|undefined;

    /**
     * Get a column by index
    */
    getColumnAt(index: number): Column|undefined;

    /**
     * Reset the Aggregations
    */
    clear(): this;
}
```


## Examples

```ts
const dataTypeConfig = {
    version: 1,
    fields: {
        name: {
            type: FieldType.Keyword,
        },
        age: {
            type: FieldType.Short,
        },
        gender: {
            type: FieldType.Keyword
        },
        birth_date: {
            type: FieldType.Date
        }
    }
};

let dataFrame = DataFrame.fromJSON(dataTypeConfig, [
    {
        name: 'Jill',
        age: 39,
        gender: 'F',
        birth_date: '1981-08-20T07:00:00.000Z',
    },
    {
        name: 'Billy',
        age: 47,
        gender: 'M',
        birth_date: '1973-06-05T07:00:00.000Z',
    },
    {
        name: 'Frank',
        age: 20,
        gender: 'M',
        date: '2000-03-05T07:00:00.000Z'
    },
]);

// ...
// Get the number of rows
// ...
dataFrame.size;
// => 3

// ...
// Calculate the sum of a field
// ...
dataFrame.getColumn('age').sum();
// => 106

// ...
// Transform a column
// ...
const upperCaseName = dataFrame
    .getColumn('name')
    .transform(ColumnTransform.toUpperCase);
// => Column(name)['JILL', 'BILLY', 'FRANK']

// ...
// Replace the existing name column with the transformed one
// ...
dataFrame = dataFrame.assign([upperCaseName]);

// ...
// Count the number of records for each gender
// ...
const resultFrame = await dataFrame
    .select('name', 'gender')
    .groupBy(['gender'])
    .count('gender', 'count_per_gender')
    .orderBy('count_per_gender')
    .run();
// => [
//       { name: 'JILL', gender: 'F', count_per_gender: 1 },
//       { name: 'BILLY', gender: 'M', count_per_gender: 2 }
//    ]
```
