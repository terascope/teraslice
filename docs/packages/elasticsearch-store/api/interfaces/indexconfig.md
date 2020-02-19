---
title: Elasticsearch Store: `IndexConfig`
sidebar_label: IndexConfig
---

# Interface: IndexConfig <**T**>

A versioned Index Configuration

## Type parameters

▪ **T**

## Hierarchy

* **IndexConfig**

## Index

### Properties

* [bulk_max_size](indexconfig.md#optional-bulk_max_size)
* [bulk_max_wait](indexconfig.md#optional-bulk_max_wait)
* [data_schema](indexconfig.md#optional-data_schema)
* [data_type](indexconfig.md#data_type)
* [default_query_access](indexconfig.md#optional-default_query_access)
* [default_sort](indexconfig.md#optional-default_sort)
* [event_time_field](indexconfig.md#optional-event_time_field)
* [id_field](indexconfig.md#optional-id_field)
* [index_schema](indexconfig.md#optional-index_schema)
* [index_settings](indexconfig.md#optional-index_settings)
* [ingest_time_field](indexconfig.md#optional-ingest_time_field)
* [is_master](indexconfig.md#optional-is_master)
* [logger](indexconfig.md#optional-logger)
* [name](indexconfig.md#name)
* [namespace](indexconfig.md#optional-namespace)
* [version](indexconfig.md#optional-version)

## Properties

### `Optional` bulk_max_size

• **bulk_max_size**? : *undefined | number*

*Defined in [interfaces.ts:57](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/interfaces.ts#L57)*

The number of records to accumulate before sending the bulk request

___

### `Optional` bulk_max_wait

• **bulk_max_wait**? : *undefined | number*

*Defined in [interfaces.ts:52](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/interfaces.ts#L52)*

The maximum amount of time to wait for before send the bulk request

___

### `Optional` data_schema

• **data_schema**? : *[DataSchema](dataschema.md)*

*Defined in [interfaces.ts:42](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/interfaces.ts#L42)*

The data schema format

___

###  data_type

• **data_type**: *DataType*

*Defined in [interfaces.ts:27](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/interfaces.ts#L27)*

The DataType of the index (used for generating the mappings)

___

### `Optional` default_query_access

• **default_query_access**? : *QueryAccess‹T›*

*Defined in [interfaces.ts:89](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/interfaces.ts#L89)*

The default query access to use

___

### `Optional` default_sort

• **default_sort**? : *undefined | string*

*Defined in [interfaces.ts:69](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/interfaces.ts#L69)*

Default sort

___

### `Optional` event_time_field

• **event_time_field**? : *keyof T*

*Defined in [interfaces.ts:84](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/interfaces.ts#L84)*

Event Time field from the source record

___

### `Optional` id_field

• **id_field**? : *keyof T*

*Defined in [interfaces.ts:74](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/interfaces.ts#L74)*

ID field

___

### `Optional` index_schema

• **index_schema**? : *[IndexSchema](indexschema.md)*

*Defined in [interfaces.ts:37](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/interfaces.ts#L37)*

Schema Specification for the Data and ES

___

### `Optional` index_settings

• **index_settings**? : *ESIndexSettings*

*Defined in [interfaces.ts:32](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/interfaces.ts#L32)*

Elasticsearch Index Settings

___

### `Optional` ingest_time_field

• **ingest_time_field**? : *keyof T*

*Defined in [interfaces.ts:79](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/interfaces.ts#L79)*

Ingest Time field on the source record

___

### `Optional` is_master

• **is_master**? : *undefined | false | true*

*Defined in [interfaces.ts:47](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/interfaces.ts#L47)*

When false this will disable the ability to create or migrate an index

___

### `Optional` logger

• **logger**? : *Logger*

*Defined in [interfaces.ts:64](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/interfaces.ts#L64)*

Logger to use for debugging and certian internal errors

**`defaults`** to a debug logger

___

###  name

• **name**: *string*

*Defined in [interfaces.ts:11](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/interfaces.ts#L11)*

This is the data type and base name of the index

___

### `Optional` namespace

• **namespace**? : *undefined | string*

*Defined in [interfaces.ts:17](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/interfaces.ts#L17)*

The namespace that will be prefixed to the name value when generating
the index name or anything else that needs to be namespaced.

___

### `Optional` version

• **version**? : *undefined | number*

*Defined in [interfaces.ts:22](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/interfaces.ts#L22)*

Data Version, this allows multiple versions of an index to exist with the same Schema
