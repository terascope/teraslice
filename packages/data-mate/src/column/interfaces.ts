import {
    DataTypeFieldConfig, Maybe,
    ReadonlyDataTypeFields
} from '@terascope/types';

/**
 * Column options
 */
export interface ColumnOptions<N extends (number|string|symbol) = string> {
    name: N;
    version?: number;
}

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
    readonly version?: number;

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
