import { DataTypeConfig } from '@terascope/types';
import { SimpleFieldMatchTuple } from '../vector';

/**
 * The serialized format version
*/
export type DataFrameFormatVersion = 1;

/**
 * The metadata used when serializing a DataFrame
*/
export interface DataFrameHeaderConfig {
    /**
     * The serialized format version, if any breaking
     * changes are required for the json structure, this
     * number should be increased
    */
    readonly v: DataFrameFormatVersion;

    /**
     * The optional name associated to a DataFrame
    */
    readonly name?: string;

    /**
     * The number of records within a DataFrame
    */
    readonly size: number;

    /**
     * The metadata associated to DataFrame
    */
    readonly metadata: Record<string, unknown>;

    /**
     * The data type configuration with all of the fields,
     * normally you don't have deal with this since the columns
     * also contain their own configuration so they are independent
    */
    readonly config: DataTypeConfig;
}

export type SimpleMatchCriteria = ReadonlyMap<string, readonly SimpleFieldMatchTuple[]>;
