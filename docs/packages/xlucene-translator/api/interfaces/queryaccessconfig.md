---
title: xLucene Translator: `QueryAccessConfig`
sidebar_label: QueryAccessConfig
---

# Interface: QueryAccessConfig <**T**>

## Type parameters

▪ **T**: *AnyObject*

## Hierarchy

* **QueryAccessConfig**

## Index

### Properties

* [allow_empty_queries](queryaccessconfig.md#optional-allow_empty_queries)
* [allow_implicit_queries](queryaccessconfig.md#optional-allow_implicit_queries)
* [constraint](queryaccessconfig.md#optional-constraint)
* [default_geo_field](queryaccessconfig.md#optional-default_geo_field)
* [default_geo_sort_order](queryaccessconfig.md#optional-default_geo_sort_order)
* [default_geo_sort_unit](queryaccessconfig.md#optional-default_geo_sort_unit)
* [excludes](queryaccessconfig.md#optional-excludes)
* [includes](queryaccessconfig.md#optional-includes)
* [prevent_prefix_wildcard](queryaccessconfig.md#optional-prevent_prefix_wildcard)
* [type_config](queryaccessconfig.md#optional-type_config)

## Properties

### `Optional` allow_empty_queries

• **allow_empty_queries**? : *undefined | false | true*

*Defined in [xlucene-translator/src/query-access/interfaces.ts:37](https://github.com/terascope/teraslice/blob/653cf7530/packages/xlucene-translator/src/query-access/interfaces.ts#L37)*

___

### `Optional` allow_implicit_queries

• **allow_implicit_queries**? : *undefined | false | true*

*Defined in [xlucene-translator/src/query-access/interfaces.ts:36](https://github.com/terascope/teraslice/blob/653cf7530/packages/xlucene-translator/src/query-access/interfaces.ts#L36)*

___

### `Optional` constraint

• **constraint**? : *string | string[]*

*Defined in [xlucene-translator/src/query-access/interfaces.ts:34](https://github.com/terascope/teraslice/blob/653cf7530/packages/xlucene-translator/src/query-access/interfaces.ts#L34)*

___

### `Optional` default_geo_field

• **default_geo_field**? : *undefined | string*

*Defined in [xlucene-translator/src/query-access/interfaces.ts:38](https://github.com/terascope/teraslice/blob/653cf7530/packages/xlucene-translator/src/query-access/interfaces.ts#L38)*

___

### `Optional` default_geo_sort_order

• **default_geo_sort_order**? : *SortOrder*

*Defined in [xlucene-translator/src/query-access/interfaces.ts:39](https://github.com/terascope/teraslice/blob/653cf7530/packages/xlucene-translator/src/query-access/interfaces.ts#L39)*

___

### `Optional` default_geo_sort_unit

• **default_geo_sort_unit**? : *GeoDistanceUnit | string*

*Defined in [xlucene-translator/src/query-access/interfaces.ts:40](https://github.com/terascope/teraslice/blob/653cf7530/packages/xlucene-translator/src/query-access/interfaces.ts#L40)*

___

### `Optional` excludes

• **excludes**? : *keyof T[]*

*Defined in [xlucene-translator/src/query-access/interfaces.ts:32](https://github.com/terascope/teraslice/blob/653cf7530/packages/xlucene-translator/src/query-access/interfaces.ts#L32)*

___

### `Optional` includes

• **includes**? : *keyof T[]*

*Defined in [xlucene-translator/src/query-access/interfaces.ts:33](https://github.com/terascope/teraslice/blob/653cf7530/packages/xlucene-translator/src/query-access/interfaces.ts#L33)*

___

### `Optional` prevent_prefix_wildcard

• **prevent_prefix_wildcard**? : *undefined | false | true*

*Defined in [xlucene-translator/src/query-access/interfaces.ts:35](https://github.com/terascope/teraslice/blob/653cf7530/packages/xlucene-translator/src/query-access/interfaces.ts#L35)*

___

### `Optional` type_config

• **type_config**? : *XluceneTypeConfig*

*Defined in [xlucene-translator/src/query-access/interfaces.ts:41](https://github.com/terascope/teraslice/blob/653cf7530/packages/xlucene-translator/src/query-access/interfaces.ts#L41)*
