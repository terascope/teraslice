---
title: Elasticsearch Store: `IndexSchema`
sidebar_label: IndexSchema
---

# Interface: IndexSchema

Elasticsearch Index Schema, Mapping and Version

## Hierarchy

* **IndexSchema**

## Index

### Properties

* [rollover_frequency](indexschema.md#optional-rollover_frequency)
* [strict](indexschema.md#optional-strict)
* [template](indexschema.md#optional-template)
* [timeseries](indexschema.md#optional-timeseries)
* [version](indexschema.md#optional-version)

## Properties

### `Optional` rollover_frequency

• **rollover_frequency**? : *[TimeSeriesFormat](../overview.md#timeseriesformat)*

*Defined in [interfaces.ts:109](https://github.com/terascope/teraslice/blob/78714a985/packages/elasticsearch-store/src/interfaces.ts#L109)*

Rollover Frequency for the Timeseries Index.
This is only valid if timeseries is set to true

**`default`** monthly

___

### `Optional` strict

• **strict**? : *undefined | false | true*

*Defined in [interfaces.ts:117](https://github.com/terascope/teraslice/blob/78714a985/packages/elasticsearch-store/src/interfaces.ts#L117)*

If enabled and the index does not match the version and mapping.
Additionally this will prevent any mapping changes to automatically happen.

**`default`** false

___

### `Optional` template

• **template**? : *undefined | false | true*

*Defined in [interfaces.ts:96](https://github.com/terascope/teraslice/blob/78714a985/packages/elasticsearch-store/src/interfaces.ts#L96)*

Use a Templated Index

___

### `Optional` timeseries

• **timeseries**? : *undefined | false | true*

*Defined in [interfaces.ts:101](https://github.com/terascope/teraslice/blob/78714a985/packages/elasticsearch-store/src/interfaces.ts#L101)*

Use a Timeseries Index

___

### `Optional` version

• **version**? : *undefined | number*

*Defined in [interfaces.ts:91](https://github.com/terascope/teraslice/blob/78714a985/packages/elasticsearch-store/src/interfaces.ts#L91)*

The version of this particular Schema definition
