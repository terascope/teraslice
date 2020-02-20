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

*Defined in [interfaces.ts:115](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/interfaces.ts#L115)*

Rollover Frequency for the Timeseries Index.
This is only valid if timeseries is set to true

**`default`** monthly

___

### `Optional` strict

• **strict**? : *undefined | false | true*

*Defined in [interfaces.ts:123](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/interfaces.ts#L123)*

If enabled and the index does not match the version and mapping.
Additionally this will prevent any mapping changes to automatically happen.

**`default`** false

___

### `Optional` template

• **template**? : *undefined | false | true*

*Defined in [interfaces.ts:102](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/interfaces.ts#L102)*

Use a Templated Index

___

### `Optional` timeseries

• **timeseries**? : *undefined | false | true*

*Defined in [interfaces.ts:107](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/interfaces.ts#L107)*

Use a Timeseries Index

___

### `Optional` version

• **version**? : *undefined | number*

*Defined in [interfaces.ts:97](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/interfaces.ts#L97)*

The version of this particular Schema definition
