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

export interface BaseTransformConfig {
    /**
     * The type of transformation
    */
    type: TransformType;

    /**
     * Description of the transformation
    */
    description: string;

    /**
     * The argument type config, used for validation
    */
    argument_schema: DataTypeFields;

    /**
     * The types of Vectors this can work with.
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
}

/**
 * A created transformation function
*/
export type ColumnTransformFn<
    T,
    R,
> = {
    mode: TransformMode.EACH;
    fn: (value: Maybe<T|Vector<T>>) => Maybe<R|Vector<R>>;
}|{
    mode: TransformMode.EACH_VALUE,
    skipNulls: false;
    fn: (value: Maybe<T>) => Maybe<R>;
}|{
    mode: TransformMode.EACH_VALUE,
    skipNulls?: true|undefined;
    fn: (value: T) => Maybe<R>;
}|{
    mode: TransformMode.NONE,
};

export interface ColumnTransformConfig<
    T,
    R = T,
    A extends Record<string, any> = Record<string, unknown>,
> extends BaseTransformConfig {
    type: TransformType.TRANSFORM;

    /**
     * A transform function
    */
    create: (vector: Vector<T>, args: A) => ColumnTransformFn<T, R>;
}

/**
 * A created validation function
*/
export type ColumnValidateFn<
    T,
> = {
    mode: TransformMode.EACH;
    fn: (value: Maybe<T|Vector<T>>) => boolean;
}|{
    mode: TransformMode.EACH_VALUE;
    skipNulls: false;
    fn: (value: Maybe<T>) => boolean;
}|{
    mode: TransformMode.EACH_VALUE;
    skipNulls?: true|undefined;
    fn: (value: T) => boolean;
}|{
    mode: TransformMode.NONE;
};

export interface ColumnValidateConfig<
    T,
    A extends Record<string, any> = Record<string, unknown>,
> extends BaseTransformConfig {
    type: TransformType.VALIDATE;

    /**
     * Creates a validator function
    */
    create: (vector: Vector<T>, args: A) => ColumnValidateFn<T>;
}
