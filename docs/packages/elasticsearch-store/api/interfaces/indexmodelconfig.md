---
title: Elasticsearch Store: `IndexModelConfig`
sidebar_label: IndexModelConfig
---

# Interface: IndexModelConfig <**T**>

## Type parameters

▪ **T**: *[IndexModelRecord](indexmodelrecord.md)*

## Hierarchy

* **IndexModelConfig**

### Index

#### Properties

* [mapping](indexmodelconfig.md#mapping)
* [name](indexmodelconfig.md#name)
* [sanitizeFields](indexmodelconfig.md#optional-sanitizefields)
* [schema](indexmodelconfig.md#schema)
* [storeOptions](indexmodelconfig.md#optional-storeoptions)
* [strictMode](indexmodelconfig.md#optional-strictmode)
* [uniqueFields](indexmodelconfig.md#optional-uniquefields)
* [version](indexmodelconfig.md#version)

## Properties

###  mapping

• **mapping**: *any*

*Defined in [interfaces.ts:208](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/elasticsearch-store/src/interfaces.ts#L208)*

ElasticSearch Mapping

___

###  name

• **name**: *string*

*Defined in [interfaces.ts:205](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/elasticsearch-store/src/interfaces.ts#L205)*

Name of the Model/Data Type

___

### `Optional` sanitizeFields

• **sanitizeFields**? : *[SanitizeFields](../overview.md#sanitizefields)*

*Defined in [interfaces.ts:220](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/elasticsearch-store/src/interfaces.ts#L220)*

Sanitize / cleanup fields mapping, like trim or trimAndToLower

___

###  schema

• **schema**: *any*

*Defined in [interfaces.ts:211](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/elasticsearch-store/src/interfaces.ts#L211)*

JSON Schema

___

### `Optional` storeOptions

• **storeOptions**? : *`Partial<IndexConfig>`*

*Defined in [interfaces.ts:214](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/elasticsearch-store/src/interfaces.ts#L214)*

Additional IndexStore configuration

___

### `Optional` strictMode

• **strictMode**? : *undefined | false | true*

*Defined in [interfaces.ts:223](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/elasticsearch-store/src/interfaces.ts#L223)*

Specify whether the data should be strictly validated, defaults to true

___

### `Optional` uniqueFields

• **uniqueFields**? : *`keyof T`[]*

*Defined in [interfaces.ts:217](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/elasticsearch-store/src/interfaces.ts#L217)*

Unqiue fields across on Index

___

###  version

• **version**: *number*

*Defined in [interfaces.ts:202](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/elasticsearch-store/src/interfaces.ts#L202)*

Schema Version

