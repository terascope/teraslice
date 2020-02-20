---
title: Elasticsearch Store: `DataSchema`
sidebar_label: DataSchema
---

# Interface: DataSchema

Data Schema and Version

## Hierarchy

* **DataSchema**

## Index

### Properties

* [all_formatters](dataschema.md#optional-all_formatters)
* [schema](dataschema.md#schema)
* [strict](dataschema.md#optional-strict)

## Properties

### `Optional` all_formatters

• **all_formatters**? : *undefined | false | true*

*Defined in [interfaces.ts:155](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/interfaces.ts#L155)*

If enabled this will allow the use of some of
the slower but more correct JSON Schema's formatters:

- "date"
- "time"
- "date-time"
- "uri"
- "uri-reference"
- "hostname"
- "email"

___

###  schema

• **schema**: *any*

*Defined in [interfaces.ts:133](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/interfaces.ts#L133)*

The Data Schema in JSON Schema format

___

### `Optional` strict

• **strict**? : *undefined | false | true*

*Defined in [interfaces.ts:141](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/interfaces.ts#L141)*

If enabled and the data fails to match the schema or version
an error will thrown

**`default`** false
