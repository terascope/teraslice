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

* [mapping](indexschema.md#mapping)
* [rollover_frequency](indexschema.md#optional-rollover_frequency)
* [strict](indexschema.md#optional-strict)
* [template](indexschema.md#optional-template)
* [timeseries](indexschema.md#optional-timeseries)
* [version](indexschema.md#optional-version)

## Properties

###  mapping

• **mapping**: *`ESTypeMappings`*

*Defined in [interfaces.ts:85](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/elasticsearch-store/src/interfaces.ts#L85)*

The ElasticSearch index mapping

___

### `Optional` rollover_frequency

• **rollover_frequency**? : *[TimeSeriesFormat](../overview.md#timeseriesformat)*

*Defined in [interfaces.ts:108](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/elasticsearch-store/src/interfaces.ts#L108)*

Rollover Frequency for the Timeseries Index.
This is only valid if timeseries is set to true

**`default`** monthly

___

### `Optional` strict

• **strict**? : *undefined | false | true*

*Defined in [interfaces.ts:116](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/elasticsearch-store/src/interfaces.ts#L116)*

If enabled and the index does not match the version and mapping.
Additionally this will prevent any mapping changes to automatically happen.

**`default`** false

___

### `Optional` template

• **template**? : *undefined | false | true*

*Defined in [interfaces.ts:95](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/elasticsearch-store/src/interfaces.ts#L95)*

Use a Templated Index

___

### `Optional` timeseries

• **timeseries**? : *undefined | false | true*

*Defined in [interfaces.ts:100](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/elasticsearch-store/src/interfaces.ts#L100)*

Use a Timeseries Index

___

### `Optional` version

• **version**? : *undefined | number*

*Defined in [interfaces.ts:90](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/elasticsearch-store/src/interfaces.ts#L90)*

The version of this particular Schema definition
