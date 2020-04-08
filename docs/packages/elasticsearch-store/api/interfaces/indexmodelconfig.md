---
title: Elasticsearch Store: `IndexModelConfig`
sidebar_label: IndexModelConfig
---

# Interface: IndexModelConfig <**T**>

## Type parameters

▪ **T**: *[IndexModelRecord](indexmodelrecord.md)*

## Hierarchy

* **IndexModelConfig**

## Index

### Properties

* [data_type](indexmodelconfig.md#data_type)
* [default_sort](indexmodelconfig.md#optional-default_sort)
* [name](indexmodelconfig.md#name)
* [sanitize_fields](indexmodelconfig.md#optional-sanitize_fields)
* [schema](indexmodelconfig.md#schema)
* [strict_mode](indexmodelconfig.md#optional-strict_mode)
* [unique_fields](indexmodelconfig.md#optional-unique_fields)
* [version](indexmodelconfig.md#version)

## Properties

###  data_type

• **data_type**: *DataType*

*Defined in [interfaces.ts:230](https://github.com/terascope/teraslice/blob/b843209f9/packages/elasticsearch-store/src/interfaces.ts#L230)*

The DataType of the model

___

### `Optional` default_sort

• **default_sort**? : *undefined | string*

*Defined in [interfaces.ts:245](https://github.com/terascope/teraslice/blob/b843209f9/packages/elasticsearch-store/src/interfaces.ts#L245)*

The default sort field and direction

___

###  name

• **name**: *string*

*Defined in [interfaces.ts:227](https://github.com/terascope/teraslice/blob/b843209f9/packages/elasticsearch-store/src/interfaces.ts#L227)*

Name of the Model/Data Type

___

### `Optional` sanitize_fields

• **sanitize_fields**? : *[SanitizeFields](../overview.md#sanitizefields)*

*Defined in [interfaces.ts:239](https://github.com/terascope/teraslice/blob/b843209f9/packages/elasticsearch-store/src/interfaces.ts#L239)*

Sanitize / cleanup fields mapping, like trim or trimAndToLower

___

###  schema

• **schema**: *any*

*Defined in [interfaces.ts:233](https://github.com/terascope/teraslice/blob/b843209f9/packages/elasticsearch-store/src/interfaces.ts#L233)*

JSON Schema

___

### `Optional` strict_mode

• **strict_mode**? : *undefined | false | true*

*Defined in [interfaces.ts:242](https://github.com/terascope/teraslice/blob/b843209f9/packages/elasticsearch-store/src/interfaces.ts#L242)*

Specify whether the data should be strictly validated, defaults to true

___

### `Optional` unique_fields

• **unique_fields**? : *keyof T[]*

*Defined in [interfaces.ts:236](https://github.com/terascope/teraslice/blob/b843209f9/packages/elasticsearch-store/src/interfaces.ts#L236)*

Unqiue fields across on Index

___

###  version

• **version**: *number*

*Defined in [interfaces.ts:224](https://github.com/terascope/teraslice/blob/b843209f9/packages/elasticsearch-store/src/interfaces.ts#L224)*

Schema Version
