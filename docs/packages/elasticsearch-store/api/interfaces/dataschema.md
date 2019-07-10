---
title: Elasticsearch Store: `DataSchema`
sidebar_label: DataSchema
---

# Interface: DataSchema

Data Schema and Version

## Hierarchy

* **DataSchema**

### Index

#### Properties

* [allFormatters](dataschema.md#optional-allformatters)
* [log_level](dataschema.md#optional-log_level)
* [schema](dataschema.md#schema)
* [strict](dataschema.md#optional-strict)

## Properties

### `Optional` allFormatters

• **allFormatters**? : *undefined | false | true*

*Defined in [interfaces.ts:153](https://github.com/terascope/teraslice/blob/a3992c27/packages/elasticsearch-store/src/interfaces.ts#L153)*

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

### `Optional` log_level

• **log_level**? : *`Logger.LogLevel` | "none"*

*Defined in [interfaces.ts:139](https://github.com/terascope/teraslice/blob/a3992c27/packages/elasticsearch-store/src/interfaces.ts#L139)*

When logging invalid record, optionally set the log level

___

###  schema

• **schema**: *any*

*Defined in [interfaces.ts:126](https://github.com/terascope/teraslice/blob/a3992c27/packages/elasticsearch-store/src/interfaces.ts#L126)*

The Data Schema in JSON Schema format

___

### `Optional` strict

• **strict**? : *undefined | false | true*

*Defined in [interfaces.ts:134](https://github.com/terascope/teraslice/blob/a3992c27/packages/elasticsearch-store/src/interfaces.ts#L134)*

If enabled and the data fails to match the schema or version
an error will thrown

**`default`** false
