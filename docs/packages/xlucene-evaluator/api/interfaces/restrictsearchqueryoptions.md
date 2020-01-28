---
title: xLucene Evaluator: `RestrictSearchQueryOptions`
sidebar_label: RestrictSearchQueryOptions
---

# Interface: RestrictSearchQueryOptions

## Hierarchy

* object

  ↳ **RestrictSearchQueryOptions**

## Index

### Properties

* [elasticsearch_version](restrictsearchqueryoptions.md#optional-elasticsearch_version)
* [geo_sort_order](restrictsearchqueryoptions.md#optional-geo_sort_order)
* [geo_sort_point](restrictsearchqueryoptions.md#optional-geo_sort_point)
* [geo_sort_unit](restrictsearchqueryoptions.md#optional-geo_sort_unit)
* [params](restrictsearchqueryoptions.md#optional-params)
* [variables](restrictsearchqueryoptions.md#optional-variables)

## Properties

### `Optional` elasticsearch_version

• **elasticsearch_version**? : *undefined | number*

*Defined in [packages/xlucene-evaluator/src/query-access/interfaces.ts:19](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/query-access/interfaces.ts#L19)*

The elasticsearch version (to format the request properly)

**`default`** 6

___

### `Optional` geo_sort_order

• **geo_sort_order**? : *[SortOrder](../overview.md#sortorder)*

*Inherited from void*

*Defined in [packages/xlucene-evaluator/src/translator/interfaces.ts:36](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/translator/interfaces.ts#L36)*

___

### `Optional` geo_sort_point

• **geo_sort_point**? : *[GeoPoint](geopoint.md)*

*Inherited from void*

*Defined in [packages/xlucene-evaluator/src/translator/interfaces.ts:35](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/translator/interfaces.ts#L35)*

If a default_geo_field is set, this is required to enable sorting

___

### `Optional` geo_sort_unit

• **geo_sort_unit**? : *[GeoDistanceUnit](../overview.md#geodistanceunit)*

*Inherited from void*

*Defined in [packages/xlucene-evaluator/src/translator/interfaces.ts:37](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/translator/interfaces.ts#L37)*

___

### `Optional` params

• **params**? : *Partial‹SearchParams›*

*Defined in [packages/xlucene-evaluator/src/query-access/interfaces.ts:14](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/query-access/interfaces.ts#L14)*

Elasticsearch search parameters
_sourceInclude and _sourceExclude will be filtered based
on the excludes and includes fields specified in the config

___

### `Optional` variables

• **variables**? : *[Variables](variables.md)*

*Defined in [packages/xlucene-evaluator/src/query-access/interfaces.ts:8](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/query-access/interfaces.ts#L8)*
