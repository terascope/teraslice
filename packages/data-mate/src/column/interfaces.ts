import {
    DataTypeFieldConfig, DataTypeFields, DataTypeVersion, Maybe
} from '@terascope/types';
import { Vector, VectorType } from '../vector';

/**
 * Column options
 */
export interface ColumnOptions {
    name: string;
    version?: DataTypeVersion;
    config: DataTypeFieldConfig;
}

/**
 * A mode to describe which value to pass when iterating over a Column/Vector
*/
export enum ColumnFnMode {
    /**
     * Just the values from Vector, automatically deals with ListVectors and skips nulls.
     * This is probably the most common.
     *
     * @todo This will be called with only unique values.
    */
    EACH_VALUE,

    /**
     * A values from the Vector
    */
    EACH,

    /**
     * The entire Vector be passed
    */
    ALL,
}

/**
 * A created transformation function
*/
export type ColumnTransformFn<
    T,
    R = T,
> = {
    mode: ColumnFnMode.EACH,
    fn: (value: Maybe<T|Vector<T>>) => Maybe<R|Vector<R>>;
}|{
    mode: ColumnFnMode.EACH_VALUE,
    skipNulls?: false,
    fn: (value: Maybe<T>) => Maybe<R>;
}|{
    mode: ColumnFnMode.EACH_VALUE,
    skipNulls: true,
    fn: (value: T) => Maybe<R>;
}|{
    mode: ColumnFnMode.ALL,
    fn: (value: Vector<T>) => Vector<R>;
};

export type ColumnTransformConfig<
    T,
    A extends Record<string, unknown> = Record<string, unknown>,
    R = T,
> = {
    /**
     * A transform function
    */
    create: (args: A) => ColumnTransformFn<T, R>;

    /**
     * The description of the Column transformation
    */
    description: string;

    /**
     * The argument type config, used for validation
    */
    argument_schema: DataTypeFields;

    /**
     * The types of Vectors this Transformation can work with.
     * You don't have to specify VectorType.LIST (this is automatic)
     *
     * If none is specified, it will work with any Vector type
    */
    accepts: VectorType[];

    /**
     * The output column options, this will change the values
     * If none specified the output data type will stay the same
    */
    output?: DataTypeFieldConfig;
};

/**
 * A created validation function
*/
export type ColumnValidateFn<
    T,
> = {
    mode: ColumnFnMode.EACH,
    fn: (value: Maybe<T|Vector<T>>) => boolean;
}|{
    mode: ColumnFnMode.EACH_VALUE,
    skipNulls?: false,
    fn: (value: Maybe<T>) => boolean;
}|{
    mode: ColumnFnMode.EACH_VALUE,
    skipNulls: true,
    fn: (value: T) => boolean;
}|{
    mode: ColumnFnMode.ALL,
    fn: (value: Vector<T>) => Vector<T>;
};

export type ColumnValidateConfig<
    T,
    A extends Record<string, unknown> = Record<string, unknown>,
> = {
    /**
     * Creates a validator function
    */
    create: (args: A) => ColumnValidateFn<T>;

    /**
     * The description of the Column transformation
    */
    description: string;

    /**
     * The argument type config, used for validation
    */
    argument_schema: DataTypeFields;

    /**
     * The types of Vectors this validation can work with.
     * You don't have to specify VectorType.LIST (this is automatic)
     *
     * If none is specified, it will work with any Vector type
    */
    accepts: VectorType[];
};
