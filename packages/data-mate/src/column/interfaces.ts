import {
    DataTypeFieldConfig, DataTypeFields, DataTypeVersion, Maybe,
} from '@terascope/types';
import {
    ListVector, Vector, VectorJSON, VectorType
} from '../vector';

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
     * A list of required args
    */
    required_args?: string[];

    /**
     * The types of Vectors this can work with.
     * You don't have to specify VectorType.LIST (this is automatic)
     *
     * If none is specified, it will work with any Vector type
    */
    accepts: VectorType[];
}

/**
 * A created transformation function
*/
export type ColumnTransformFn<
    T,
    R,
> = {
    mode: TransformMode.EACH;
    output?: Partial<DataTypeFieldConfig>;
    fn: (value: Maybe<T|readonly Maybe<T>[]>) => Maybe<R|readonly Maybe<R>[]>;
}|{
    mode: TransformMode.EACH_VALUE;
    output?: Partial<DataTypeFieldConfig>;
    fn: (value: T) => Maybe<R>;
}|{
    mode: TransformMode.NONE;
    output?: Partial<DataTypeFieldConfig>;
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
    create: (vector: Vector<T>|ListVector<T>, args: A) => ColumnTransformFn<T, R>;

    /**
     * The output column options, this will change the values
     * If none specified the output data type will stay the same
    */
    output?: DataTypeFieldConfig;
}

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

export interface ColumnJSON<T = any> extends VectorJSON<T> {
    readonly name: string;
    /**
     * DataFrame version
    */
    readonly version?: DataTypeVersion;
}
