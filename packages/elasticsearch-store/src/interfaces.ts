/** A versioned Index Configuration */
export interface IndexConfig {
    /**
     * The ElasticSearch index that stores your data.
     * The index name cannot include any dashes.
    */
    name: string;

    /**
     * Data Version, this allows multiple versions of an index to exist with the same Schema
    */
    version?: number;

    /**
     * ElasticSearch Index Settings
    */
    indexSettings?: IndexSettings;

    /**
     * Schema Specification for the Data and ES
    */
    indexSchema?: IndexSchema;

    /**
     * The data schema format
    */
    dataSchema?: DataSchema;

     /**
     * The maximum amount of time to wait for before send the bulk request
    */
    bulkMaxWait?: number;

    /**
     * The number of records to accumulate before sending the bulk request
    */
    bulkMaxSize?: number;
}

/** ElasticSearch Index Schema, Mapping and Version */
export interface IndexSchema {
    /**
     * The version of this particular Schema definition
     */
    version: number;

    /**
     * The ElasticSearch index mapping
    */
    mapping: any;

    /**
     * Use a Templated Index
     */
    template?: boolean;

    /**
     * Use a Timeseries Index
     */
    timeseries?: boolean;

    /**
     * Rollover Frequency for the Timeseries Index.
     * This is only valid if timeseries is set to true
     *
     * @default monthly
    */
    rollover_frequency?: TimeSeriesFormat;

   /**
     * If enabled and the index does not match the version and mapping.
     * Additionally this will prevent any mapping changes to automatically happen.
     *
     * @default false
    */
    strict?: boolean;
}

export type TimeSeriesFormat = 'daily'|'monthly'|'yearly';

export interface IndexSettings {
    'index.number_of_shards': number;
    'index.number_of_replicas': number;
    [key: string]: string|number|boolean;
}

/** Data Schema and Version */
export interface DataSchema {
    /**
     * The version of this particular Schema definition
     */
    version: number;

    /**
     * The Data Schema in JSON Schema format
    */
    schema: any;

    /**
     * If enabled and the data fails to match the schema or version
     * an error will thrown
     *
     * @default false
    */
    strict?: boolean;

    /**
     * If enabled this will allow the use of some of
     * the slower but more correct JSON Schema's formatters:
     *
     * - "date"
     * - "time"
     * - "date-time"
     * - "uri"
     * - "uri-reference"
     * - "hostname"
     * - "email"
    */
    allFormatters?: boolean;
}

export type AsyncFn<T> = () => Promise<T>;

// export enum BulkAction {
//     Index = 'index',
//     Create = 'create',
//     Delete = 'delete',
//     Update = 'update',
// }

export type BulkAction = 'index'|'create'|'delete'|'update';
