---
title: Data Frame
---

## Components

### DataFrame

```ts
/**
 * An immutable columnar table with APIs for data pipelines
 * Rows with only null/undefined values are ignored
*/
interface DataFrame<T extends Record<string, unknown> = Record<string, any>> {
    /**
     * Create a DataFrame from an array of JSON objects
    */
    static fromJSON<R extends Record<string, unknown> = Record<string, any>>(
        config: DataTypeConfig, records: R[]
    ): DataFrame<R>;

    readonly columns: Column[];
    /**
     * Metadata about the DataFrame
    */
    readonly metadata?: Record<string, any>;

    constructor(columns: Column[], metadata?: Record<string, any>): DataFrame<T>

    * [Symbol.iterator](): IterableIterator<T>;

    /**
     * Get the size of the DataFrame
    */
    get size(): number;

    /**
     * Get a column by name
     * @returns a new DataFrame
    */
    select<K extends keyof T>(fields: K[]): DataFrame<Pick<T, K>>|undefined;

    /**
     * Assign new columns to a new DataFrame
     * This will eventually handle DataFrame input
    */
    assign<R extends Record<string, unknown> = Record<string, any>>(
        columns: Column[]
    ): DataFrame<T & R>;

    /**
     * Concat values to columns to this existing columns to a new DataFrame
     * This will eventually handle DataFrame, Vector or JSON input
    */
    concat(columns: Column[]): DataFrame<T>;

    /**
     * Get a column by name
    */
    getColumn<P extends keyof T>(name: P): Column<T[P]>|undefined;

    /**
     * Get a column by index
    */
    getColumnAt<P extends keyof T>(index: number): Column<T[P]>|undefined;

    /**
     * Get a row by index
    */
    getRow(index: number, returnJSON = false): T|undefined;

    /**
     * Convert the DataFrame an array of object (the output is JSON compatible)
    */
    toJSON(): T[];
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
    protected readonly _vector: Vector<T>;
    readonly name: string;
    readonly config: DataTypeFieldConfig;

    constructor(options: ColumnOptions<T>): Column<T>;

    * [Symbol.iterator](): IterableIterator<Maybe<T>>;

    /**
     * Get the size of the values in the Vector
    */
    get size(): number;

    /**
     * Get the underling Vector.
     * Use with caution since it can cause this Column/DataFrame to be out-of-sync
    */
    get vector(): Vector<T>;

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
 * A typed, fixed-length Array class with a constrained API.
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
 * A append-only typed Array class with a constrained API
 *
 * @note null/undefined values are treated the same
*/
interface Vector<T = unknown> {
    readonly type: VectorType;
    readonly fieldType: FieldType;
    readonly valueFrom?: ValueFromFn<T>;
    readonly valueToJSON?: ValueToJSONFn<T>;

    protected readonly _values: Maybe<T>[];

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
    get size(): number;

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
    slice(start: number, end?: number): Maybe<T>[];

    /**
     * Convert the Vector an array of values (the output should be JSON compatible)
    */
    toJSON<V = T>(): Maybe<V>[];
}
```


## Examples

**TODO**
