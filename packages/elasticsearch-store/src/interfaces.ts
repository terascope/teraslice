import * as es from 'elasticsearch';

/** A versioned Index Configuration */
export interface IndexConfig {
    /**
     * The ElasticSearch index that stores your data
    */
    index: string;

    /**
     * Schema Specification for the Data and ES
    */
    indexSchema: IndexSchema;

    /**
     * The default index type, when using ElasticSearch v6,
     * use this index type.
    */
    indexType: es.NameList;

    /**
     * The data schema format
    */
    dataSchema?: DataSchema;
}

/** ElasticSearch Index Schema, Mapping and Version */
export interface IndexSchema {
    /**
     * The version of this particular Schema definition
     */
    version: string;

    /**
     * The ElasticSearch index mapping
    */
    mapping: any;

    /**
     * If enabled and the index does not match the version and mapping.
     * Additionally this will prevent any mapping changes to automatically happen.
     *
     * @default false
    */
    strict?: boolean;
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
