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

* [default_sort](indexmodelconfig.md#optional-default_sort)
* [mapping](indexmodelconfig.md#mapping)
* [name](indexmodelconfig.md#name)
* [sanitize_fields](indexmodelconfig.md#optional-sanitize_fields)
* [schema](indexmodelconfig.md#schema)
* [strict_mode](indexmodelconfig.md#optional-strict_mode)
* [unique_fields](indexmodelconfig.md#optional-unique_fields)
* [version](indexmodelconfig.md#version)

## Properties

### `Optional` default_sort

• **default_sort**? : *undefined | string*

*Defined in [interfaces.ts:238](https://github.com/terascope/teraslice/blob/d8feecc03/packages/elasticsearch-store/src/interfaces.ts#L238)*

The default sort field and direction

___

###  mapping

• **mapping**: *ESTypeMappings*

*Defined in [interfaces.ts:223](https://github.com/terascope/teraslice/blob/d8feecc03/packages/elasticsearch-store/src/interfaces.ts#L223)*

the elasticsearch type mappings

___

###  name

• **name**: *string*

*Defined in [interfaces.ts:220](https://github.com/terascope/teraslice/blob/d8feecc03/packages/elasticsearch-store/src/interfaces.ts#L220)*

Name of the Model/Data Type

___

### `Optional` sanitize_fields

• **sanitize_fields**? : *[SanitizeFields](../overview.md#sanitizefields)*

*Defined in [interfaces.ts:232](https://github.com/terascope/teraslice/blob/d8feecc03/packages/elasticsearch-store/src/interfaces.ts#L232)*

Sanitize / cleanup fields mapping, like trim or trimAndToLower

___

###  schema

• **schema**: *any*

*Defined in [interfaces.ts:226](https://github.com/terascope/teraslice/blob/d8feecc03/packages/elasticsearch-store/src/interfaces.ts#L226)*

JSON Schema

___

### `Optional` strict_mode

• **strict_mode**? : *undefined | false | true*

*Defined in [interfaces.ts:235](https://github.com/terascope/teraslice/blob/d8feecc03/packages/elasticsearch-store/src/interfaces.ts#L235)*

Specify whether the data should be strictly validated, defaults to true

___

### `Optional` unique_fields

• **unique_fields**? : *keyof T[]*

*Defined in [interfaces.ts:229](https://github.com/terascope/teraslice/blob/d8feecc03/packages/elasticsearch-store/src/interfaces.ts#L229)*

Unqiue fields across on Index

___

###  version

• **version**: *number*

*Defined in [interfaces.ts:217](https://github.com/terascope/teraslice/blob/d8feecc03/packages/elasticsearch-store/src/interfaces.ts#L217)*

Schema Version
