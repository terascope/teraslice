export type TYPE_IS_ENTITY_KEY = '__isDataEntity';
export type TYPE_DATAENTITY_METADATA_KEY = '___DataEntityMetadata';

export const __IS_ENTITY_KEY: TYPE_IS_ENTITY_KEY = '__isDataEntity';
export const __DATAENTITY_METADATA_KEY: TYPE_DATAENTITY_METADATA_KEY = '___DataEntityMetadata';

export type __DataEntityProps<M extends object> = {
    metadata: M & DataEntityMetadata;
    rawData: Buffer|null;
};

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
