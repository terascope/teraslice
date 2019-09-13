// this file cannot depend on any other files
// in this folder besides ./entity

import { AnyObject } from '../interfaces';
import { EntityMetadata } from './entity';

export type TYPE_IS_DATAENTITY_KEY = '__isDataEntity';
export type TYPE_ENTITY_METADATA_KEY = '___EntityMetadata';
export type TYPE_IS_WINDOW_KEY = '__isDataWindow';

// eslint-disable-next-line @typescript-eslint/naming-convention
export const __IS_DATAENTITY_KEY: TYPE_IS_DATAENTITY_KEY = '__isDataEntity';
// eslint-disable-next-line @typescript-eslint/naming-convention
export const __ENTITY_METADATA_KEY: TYPE_ENTITY_METADATA_KEY = '___EntityMetadata';
// eslint-disable-next-line @typescript-eslint/naming-convention
export const __IS_WINDOW_KEY: TYPE_IS_WINDOW_KEY = '__isDataWindow';

export type _DataEntityMetadataType = DataEntityMetadata | AnyObject;
export type _DataEntityMetadata<M> = M & DataEntityMetadata & AnyObject;

export type DataEntityMetadataKey<M> =
    (keyof DataEntityMetadata)
    | (keyof M)
    | string
    | number;

export type DataEntityMetadataValue<M, K> =
    K extends (keyof DataEntityMetadata) ?
        DataEntityMetadata[K] : (
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
export interface DataEntityMetadata extends EntityMetadata {
    /** The time at which the data was ingested into the source data */
    _ingestTime?: number;

    /** The time at which the data was consumed by the reader */
    _processTime?: number;

    /**
     * The time associated with this data entity,
     * usually off of a specific field on source data or message
     */
    _eventTime?: number;
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

/**
 * DataWindows have conventional metadata properties
 * that can track process and key information around
 * a DataWindow
 *
 * **NOTE** Time values are set in UNIX Epoch time,
 * to reduce memory footput, the DataWindow has convenience
 * apis for getting and setting the time given and handling
 * the conversion between unix milliseconds to Date format.
*/
export interface DataWindowMetadata extends EntityMetadata {
    /**
     * The time at which a window was started to collect data
    */
    _startTime?: number;

    /**
     * The time at which a window completed collecting data
    */
    _finishTime?: number;
}
