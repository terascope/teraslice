import {
    DataTypeFieldConfig, DataTypeFields, DataTypeVersion, Maybe
} from '@terascope/types';
import { Vector, VectorType } from '../vector';

/**
 * Column transformation fns
*/
export type ColumnTransformFn<
    T,
    R = T,
> = {
    mode: ColumnFnMode.EACH,
    fn: (value: Maybe<T|Vector<T>>) => Maybe<R|Vector<R>>;
}|{
    mode: ColumnFnMode.EACH_VALUE,
    fn: (value: T) => Maybe<R>;
}|{
    mode: ColumnFnMode.ALL,
    fn: (value: Vector<T>) => Vector<R>;
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

export type ColumnTransformConfig<
    T,
    A extends Record<string, unknown> = Record<string, unknown>,
    R = T,
> = {
    /**
     * A transform function
    */
    fn: (args: A) => ColumnTransformFn<T, R>;

    /**
     * The description of the Column transformation
    */
    description: string;

    /**
     * The argument type config, used for validation
    */
    argument_schema?: DataTypeFields;

    /**
     * The types of Vectors this Transformation can work with.
     * You don't have to specify VectorType.LIST (this is automatic)
    */
    accepts: VectorType[];

    /**
     * The output column options, this will change the values
     * If none specified the output data type will stay the same
    */
    output?: DataTypeFieldConfig;
};

/**
 * Column options
 */
export interface ColumnOptions {
    name: string;
    version?: DataTypeVersion;
    config: DataTypeFieldConfig;
}
