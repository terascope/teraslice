---
title: Xlucene Evaluator: `RestrictSearchQueryOptions`
sidebar_label: RestrictSearchQueryOptions
---

# Interface: RestrictSearchQueryOptions

## Hierarchy

* object

  * **RestrictSearchQueryOptions**

## Index

### Properties

* [elasticsearch_version](restrictsearchqueryoptions.md#optional-elasticsearch_version)
* [geo_sort_order](restrictsearchqueryoptions.md#optional-geo_sort_order)
* [geo_sort_point](restrictsearchqueryoptions.md#optional-geo_sort_point)
* [geo_sort_unit](restrictsearchqueryoptions.md#optional-geo_sort_unit)
* [params](restrictsearchqueryoptions.md#optional-params)

## Properties

### `Optional` elasticsearch_version

• **elasticsearch_version**? : *undefined | number*

*Defined in [query-access/interfaces.ts:17](https://github.com/terascope/teraslice/blob/d2d877b60/packages/xlucene-evaluator/src/query-access/interfaces.ts#L17)*

The elasticsearch version (to format the request properly)

**`default`** 6

___

### `Optional` geo_sort_order

• **geo_sort_order**? : *[SortOrder](../overview.md#sortorder)*

*Inherited from void*

*Defined in [translator/interfaces.ts:27](https://github.com/terascope/teraslice/blob/d2d877b60/packages/xlucene-evaluator/src/translator/interfaces.ts#L27)*

___

### `Optional` geo_sort_point

• **geo_sort_point**? : *p.GeoPoint*

*Inherited from void*

*Defined in [translator/interfaces.ts:26](https://github.com/terascope/teraslice/blob/d2d877b60/packages/xlucene-evaluator/src/translator/interfaces.ts#L26)*

If a default_geo_field is set, this is required to enable sorting

___

### `Optional` geo_sort_unit

• **geo_sort_unit**? : *p.GeoDistanceUnit*

*Inherited from void*

*Defined in [translator/interfaces.ts:28](https://github.com/terascope/teraslice/blob/d2d877b60/packages/xlucene-evaluator/src/translator/interfaces.ts#L28)*

___

### `Optional` params

• **params**? : *Partial‹SearchParams›*

*Defined in [query-access/interfaces.ts:12](https://github.com/terascope/teraslice/blob/d2d877b60/packages/xlucene-evaluator/src/query-access/interfaces.ts#L12)*

Elasticsearch search parameters
_sourceInclude and _sourceExclude will be filtered based
on the excludes and includes fields specified in the config
