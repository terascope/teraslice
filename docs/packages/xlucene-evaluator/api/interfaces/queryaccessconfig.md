---
title: xLucene Evaluator: `QueryAccessConfig`
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

*Defined in [query-access/interfaces.ts:27](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/query-access/interfaces.ts#L27)*

___

### `Optional` allow_implicit_queries

• **allow_implicit_queries**? : *undefined | false | true*

*Defined in [query-access/interfaces.ts:26](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/query-access/interfaces.ts#L26)*

___

### `Optional` constraint

• **constraint**? : *undefined | string*

*Defined in [query-access/interfaces.ts:24](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/query-access/interfaces.ts#L24)*

___

### `Optional` default_geo_field

• **default_geo_field**? : *undefined | string*

*Defined in [query-access/interfaces.ts:28](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/query-access/interfaces.ts#L28)*

___

### `Optional` default_geo_sort_order

• **default_geo_sort_order**? : *[SortOrder](../overview.md#sortorder)*

*Defined in [query-access/interfaces.ts:29](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/query-access/interfaces.ts#L29)*

___

### `Optional` default_geo_sort_unit

• **default_geo_sort_unit**? : *[GeoDistanceUnit](../overview.md#geodistanceunit) | string*

*Defined in [query-access/interfaces.ts:30](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/query-access/interfaces.ts#L30)*

___

### `Optional` excludes

• **excludes**? : *keyof T[]*

*Defined in [query-access/interfaces.ts:22](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/query-access/interfaces.ts#L22)*

___

### `Optional` includes

• **includes**? : *keyof T[]*

*Defined in [query-access/interfaces.ts:23](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/query-access/interfaces.ts#L23)*

___

### `Optional` prevent_prefix_wildcard

• **prevent_prefix_wildcard**? : *undefined | false | true*

*Defined in [query-access/interfaces.ts:25](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/query-access/interfaces.ts#L25)*

___

### `Optional` type_config

• **type_config**? : *[TypeConfig](typeconfig.md)*

*Defined in [query-access/interfaces.ts:31](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/query-access/interfaces.ts#L31)*
