/** A versioned Index Configuration */
export interface IndexConfig {
    /**
     * The ElasticSearch index that stores your data.
     * The index name cannot include any dashes.
    */
    index: string;

    /**
     * Data Version, this allows multiple versions of an index to exist with the same Schema
    */
    version?: string;

    /**
     * ElasticSearch Index Settings
    */
    indexSettings?: IndexSettings;

    /**
     * Schema Specification for the Data and ES
    */
    indexSchema?: IndexSchemaConfig;

    /**
     * The data schema format
    */
    dataSchema?: DataSchema;
}

export type IndexSchemaConfig = SimpleIndexSchema|TemplatedIndexSchema|TimeSeriesIndexSchema;

/** ElasticSearch Index Schema, Mapping and Version */
export interface IndexSchema {
    /**
     * The version of this particular Schema definition
     */
    version: string;

   /**
     * If enabled and the index does not match the version and mapping.
     * Additionally this will prevent any mapping changes to automatically happen.
     *
     * @default false
    */
    strict?: boolean;
}

/** A non-templated ElaticSearch Index Mapping */
export interface SimpleIndexSchema extends IndexSchema {
    /**
     * The ElasticSearch index mapping
    */
    mapping: any;
}

/** A Templated Index Schema Configuration */
export interface TemplatedIndexSchema extends IndexSchema {
    /**
     * The ElasticSearch index template
    */
    template: any;
}

/** TimeSeries Index Configuration */
export interface TimeSeriesIndexSchema extends TemplatedIndexSchema {
    /**
     * Use a Timeseries Index
     */
    timeseries: true;

    /**
     * Rollover Frequency for the Timeseries Index
    */
    rollover_frequency: 'daily'|'montly'|'yearly';
}

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
    version: string;

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
}

export interface ESError extends Error {
    statusCode: number;
}
