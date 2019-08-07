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

*Defined in [interfaces.ts:236](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/elasticsearch-store/src/interfaces.ts#L236)*

The default sort field and direction

___

###  mapping

• **mapping**: *`ESTypeMappings`*

*Defined in [interfaces.ts:221](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/elasticsearch-store/src/interfaces.ts#L221)*

the elasticsearch type mappings

___

###  name

• **name**: *string*

*Defined in [interfaces.ts:218](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/elasticsearch-store/src/interfaces.ts#L218)*

Name of the Model/Data Type

___

### `Optional` sanitize_fields

• **sanitize_fields**? : *[SanitizeFields](../overview.md#sanitizefields)*

*Defined in [interfaces.ts:230](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/elasticsearch-store/src/interfaces.ts#L230)*

Sanitize / cleanup fields mapping, like trim or trimAndToLower

___

###  schema

• **schema**: *any*

*Defined in [interfaces.ts:224](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/elasticsearch-store/src/interfaces.ts#L224)*

JSON Schema

___

### `Optional` strict_mode

• **strict_mode**? : *undefined | false | true*

*Defined in [interfaces.ts:233](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/elasticsearch-store/src/interfaces.ts#L233)*

Specify whether the data should be strictly validated, defaults to true

___

### `Optional` unique_fields

• **unique_fields**? : *`keyof T`[]*

*Defined in [interfaces.ts:227](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/elasticsearch-store/src/interfaces.ts#L227)*

Unqiue fields across on Index

___

###  version

• **version**: *number*

*Defined in [interfaces.ts:215](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/elasticsearch-store/src/interfaces.ts#L215)*

Schema Version
