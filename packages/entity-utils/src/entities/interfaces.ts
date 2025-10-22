export type TYPE_IS_DATAENTITY_KEY = '__isDataEntity';
export type TYPE_ENTITY_METADATA_KEY = '___EntityMetadata';

export const __IS_DATAENTITY_KEY: TYPE_IS_DATAENTITY_KEY = '__isDataEntity';

export const __ENTITY_METADATA_KEY: TYPE_ENTITY_METADATA_KEY = '___EntityMetadata';

export type _DataEntityMetadataType = DataEntityMetadata | Record<string, any>;
export type _DataEntityMetadata<M> = M & DataEntityMetadata & Record<string, any>;

export type DataEntityMetadataValue<M>
    = (keyof DataEntityMetadata)
        | (keyof M)
        | string
        | number;

export type EntityMetadataValue<M, K>
    = K extends (keyof DataEntityMetadata)
        ? DataEntityMetadata[K] : (
            K extends (keyof M)
                ? M[K]
                : any);

/**
 * DataEntities have conventional metadata properties
 * that can track source, destination and other process
 * information.
 *
 * **NOTE** Time values are set in UNIX Epoch time,
 * to reduce memory footput, the DataEntity has convenience
 * apis for getting and setting the time given and handling
 * the conversion between unix milliseconds to Date format.
*/
export interface DataEntityMetadata {
    /**
     * The time at which this entity was created
     * (this is automatically set on DataEntity creation)
     * @readonly
    */
    _createTime?: number;

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
    _key?: string | number;
}

/**
 * Available data encoding types for a DataEntity
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
