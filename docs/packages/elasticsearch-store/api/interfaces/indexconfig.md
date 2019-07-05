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

### Index

#### Properties

* [bulkMaxSize](indexconfig.md#optional-bulkmaxsize)
* [bulkMaxWait](indexconfig.md#optional-bulkmaxwait)
* [dataSchema](indexconfig.md#optional-dataschema)
* [defaultSort](indexconfig.md#optional-defaultsort)
* [eventTimeField](indexconfig.md#optional-eventtimefield)
* [idField](indexconfig.md#optional-idfield)
* [indexSchema](indexconfig.md#optional-indexschema)
* [indexSettings](indexconfig.md#optional-indexsettings)
* [ingestTimeField](indexconfig.md#optional-ingesttimefield)
* [logger](indexconfig.md#optional-logger)
* [name](indexconfig.md#name)
* [namespace](indexconfig.md#optional-namespace)
* [version](indexconfig.md#optional-version)

## Properties

### `Optional` bulkMaxSize

• **bulkMaxSize**? : *undefined | number*

*Defined in [interfaces.ts:44](https://github.com/terascope/teraslice/blob/d3a803c3/packages/elasticsearch-store/src/interfaces.ts#L44)*

The number of records to accumulate before sending the bulk request

___

### `Optional` bulkMaxWait

• **bulkMaxWait**? : *undefined | number*

*Defined in [interfaces.ts:39](https://github.com/terascope/teraslice/blob/d3a803c3/packages/elasticsearch-store/src/interfaces.ts#L39)*

The maximum amount of time to wait for before send the bulk request

___

### `Optional` dataSchema

• **dataSchema**? : *[DataSchema](dataschema.md)*

*Defined in [interfaces.ts:34](https://github.com/terascope/teraslice/blob/d3a803c3/packages/elasticsearch-store/src/interfaces.ts#L34)*

The data schema format

___

### `Optional` defaultSort

• **defaultSort**? : *undefined | string*

*Defined in [interfaces.ts:56](https://github.com/terascope/teraslice/blob/d3a803c3/packages/elasticsearch-store/src/interfaces.ts#L56)*

Default sort

___

### `Optional` eventTimeField

• **eventTimeField**? : *keyof T*

*Defined in [interfaces.ts:71](https://github.com/terascope/teraslice/blob/d3a803c3/packages/elasticsearch-store/src/interfaces.ts#L71)*

Event Time field from the source record

___

### `Optional` idField

• **idField**? : *keyof T*

*Defined in [interfaces.ts:61](https://github.com/terascope/teraslice/blob/d3a803c3/packages/elasticsearch-store/src/interfaces.ts#L61)*

ID field

___

### `Optional` indexSchema

• **indexSchema**? : *[IndexSchema](indexschema.md)*

*Defined in [interfaces.ts:29](https://github.com/terascope/teraslice/blob/d3a803c3/packages/elasticsearch-store/src/interfaces.ts#L29)*

Schema Specification for the Data and ES

___

### `Optional` indexSettings

• **indexSettings**? : *[IndexSettings](indexsettings.md)*

*Defined in [interfaces.ts:24](https://github.com/terascope/teraslice/blob/d3a803c3/packages/elasticsearch-store/src/interfaces.ts#L24)*

Elasticsearch Index Settings

___

### `Optional` ingestTimeField

• **ingestTimeField**? : *keyof T*

*Defined in [interfaces.ts:66](https://github.com/terascope/teraslice/blob/d3a803c3/packages/elasticsearch-store/src/interfaces.ts#L66)*

Ingest Time field on the source record

___

### `Optional` logger

• **logger**? : *`Logger`*

*Defined in [interfaces.ts:51](https://github.com/terascope/teraslice/blob/d3a803c3/packages/elasticsearch-store/src/interfaces.ts#L51)*

Logger to use for debugging and certian internal errors

**`defaults`** to a debug logger

___

###  name

• **name**: *string*

*Defined in [interfaces.ts:8](https://github.com/terascope/teraslice/blob/d3a803c3/packages/elasticsearch-store/src/interfaces.ts#L8)*

This is the data type and base name of the index

___

### `Optional` namespace

• **namespace**? : *undefined | string*

*Defined in [interfaces.ts:14](https://github.com/terascope/teraslice/blob/d3a803c3/packages/elasticsearch-store/src/interfaces.ts#L14)*

The namespace that will be prefixed to the name value when generating
the index name or anything else that needs to be namespaced.

___

### `Optional` version

• **version**? : *undefined | number*

*Defined in [interfaces.ts:19](https://github.com/terascope/teraslice/blob/d3a803c3/packages/elasticsearch-store/src/interfaces.ts#L19)*

Data Version, this allows multiple versions of an index to exist with the same Schema

