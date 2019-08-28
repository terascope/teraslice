export type TYPE_IS_ENTITY_KEY = '__isDataEntity';
export type TYPE_METADATA_KEY = '___DataEntityMetadata';
export type TYPE_RAWDATA_KEY = '___DataEntityRawData';

export const IS_ENTITY_KEY: TYPE_IS_ENTITY_KEY = '__isDataEntity';
export const METADATA_KEY: TYPE_METADATA_KEY = '___DataEntityMetadata';
export const RAWDATA_KEY: TYPE_RAWDATA_KEY = '___DataEntityRawData';

export interface DataEntityMetadata {
    /** The time at which this entity was created */
    readonly _createTime: number;

    /** The time at which the data was ingested into the source data */
    _ingestTime?: number;

    /** The time at which the data was consumed by the reader */
    _processTime?: number;

    /**
     * The time associated with this data entity,
     * usually off of a specific field on source data or message
     */
    _eventTime?: number;

    /** A unique key for the data which will be can be used to key the data */
    _key?: string;

    // Add the ability to specify any additional properties
    [prop: string]: any;
}

/**
 * available data encoding types
 */
export enum DataEncoding {
    JSON = 'json',
    RAW = 'raw',
}

/** an encoding focused interfaces */
export interface EncodingConfig {
    _op?: string;
    _encoding?: DataEncoding;
}

/** A list of supported encoding formats */
export const dataEncodings: readonly DataEncoding[] = Object.values(DataEncoding);
