import {
    DataTypeFieldConfig, DataTypeVersion, Maybe,
    ReadonlyDataTypeFields
} from '@terascope/types';

/**
 * Column options
 */
export interface ColumnOptions<N extends (number|string|symbol) = string> {
    name: N;
    version?: DataTypeVersion;
}

/**
 * A mode to describe which value to pass when iterating over a Vector
*/
export enum TransformMode {
    /**
     * Just the values from Vector, automatically deals with ListVectors and skips nulls.
     * This is probably the most common.
     *
     * @todo This will be called with only unique values.
    */
    EACH_VALUE = 'EACH_VALUE',

    /**
     * A values from the Vector
    */
    EACH = 'EACH',

    /**
     * Just change the Vector type or field config
    */
    NONE = 'NONE',
}

export enum TransformType {
    TRANSFORM = 'TRANSFORM',
    VALIDATE = 'VALIDATE',
}

/**
 * A created transformation function
*/
export type ColumnTransformFn<
    T,
    R,
> = {
    mode: TransformMode.EACH;
    fn: (value: Maybe<T|readonly Maybe<T>[]>) => Maybe<R|readonly Maybe<R>[]>;
}|{
    mode: TransformMode.EACH_VALUE;
    fn: (value: T) => Maybe<R>;
}|{
    mode: TransformMode.NONE;
};

/**
 * A created validation function
*/
export type ColumnValidateFn<
    T,
> = {
    mode: TransformMode.EACH;
    fn: (value: Maybe<T|readonly Maybe<T>[]>) => boolean;
}|{
    mode: TransformMode.EACH_VALUE;
    fn: (value: T) => boolean;
}|{
    mode: TransformMode.NONE;
};

/**
 * The metadata used when serializing a column
*/
export interface ColumnConfig<T> {
    /**
     * The name of the column
    */
    readonly name: string;

    /**
     * DataFrame version
    */
    readonly version?: DataTypeVersion;

    /**
     * The size of the column
    */
    readonly size: number;

    /**
     * The field type configuration for the column
    */
    readonly config: Readonly<DataTypeFieldConfig>;

    /**
     * The child field configuration for Object and Tuple types
    */
    readonly childConfig?: ReadonlyDataTypeFields;

    /**
     * The values associated to the column
    */
    readonly values: readonly Maybe<T>[];
}
