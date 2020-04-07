---
title: xLucene Translator: `RestrictSearchQueryOptions`
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

*Defined in [xlucene-translator/src/query-access/interfaces.ts:24](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-translator/src/query-access/interfaces.ts#L24)*

The elasticsearch version (to format the request properly)

**`default`** 6

___

### `Optional` geo_sort_order

• **geo_sort_order**? : *SortOrder*

*Inherited from void*

Defined in types/dist/src/elasticsearch-interfaces.d.ts:8

___

### `Optional` geo_sort_point

• **geo_sort_point**? : *geo.GeoPoint*

*Inherited from void*

Defined in types/dist/src/elasticsearch-interfaces.d.ts:7

If a default_geo_field is set, this is required to enable sorting

___

### `Optional` geo_sort_unit

• **geo_sort_unit**? : *geo.GeoDistanceUnit*

*Inherited from void*

Defined in types/dist/src/elasticsearch-interfaces.d.ts:9

___

### `Optional` params

• **params**? : *Partial‹SearchParams›*

*Defined in [xlucene-translator/src/query-access/interfaces.ts:19](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-translator/src/query-access/interfaces.ts#L19)*

Elasticsearch search parameters
_sourceInclude and _sourceExclude will be filtered based
on the excludes and includes fields specified in the config

___

### `Optional` variables

• **variables**? : *xLuceneVariables*

*Defined in [xlucene-translator/src/query-access/interfaces.ts:13](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-translator/src/query-access/interfaces.ts#L13)*
