---
title: Xlucene Evaluator: `QueryAccess`
sidebar_label: QueryAccess
---

# Class: QueryAccess <**T**>

## Type parameters

▪ **T**: *AnyObject*

## Hierarchy

* **QueryAccess**

## Index

### Constructors

* [constructor](queryaccess.md#constructor)

### Properties

* [allowEmpty](queryaccess.md#allowempty)
* [allowImplicitQueries](queryaccess.md#allowimplicitqueries)
* [constraint](queryaccess.md#optional-constraint)
* [defaultGeoField](queryaccess.md#optional-defaultgeofield)
* [defaultGeoSortOrder](queryaccess.md#optional-defaultgeosortorder)
* [defaultGeoSortUnit](queryaccess.md#optional-defaultgeosortunit)
* [excludes](queryaccess.md#excludes)
* [includes](queryaccess.md#includes)
* [logger](queryaccess.md#logger)
* [preventPrefixWildcard](queryaccess.md#preventprefixwildcard)
* [typeConfig](queryaccess.md#typeconfig)

### Methods

* [clearCache](queryaccess.md#clearcache)
* [restrict](queryaccess.md#restrict)
* [restrictSearchQuery](queryaccess.md#restrictsearchquery)
* [restrictSourceFields](queryaccess.md#restrictsourcefields)

## Constructors

###  constructor

\+ **new QueryAccess**(`config`: [QueryAccessConfig](../interfaces/queryaccessconfig.md)‹T›, `options`: [QueryAccessOptions](../interfaces/queryaccessoptions.md)): *[QueryAccess](queryaccess.md)*

*Defined in [query-access/query-access.ts:24](https://github.com/terascope/teraslice/blob/d2d877b60/packages/xlucene-evaluator/src/query-access/query-access.ts#L24)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`config` | [QueryAccessConfig](../interfaces/queryaccessconfig.md)‹T› |  {} |
`options` | [QueryAccessOptions](../interfaces/queryaccessoptions.md) |  {} |

**Returns:** *[QueryAccess](queryaccess.md)*

## Properties

###  allowEmpty

• **allowEmpty**: *boolean*

*Defined in [query-access/query-access.ts:19](https://github.com/terascope/teraslice/blob/d2d877b60/packages/xlucene-evaluator/src/query-access/query-access.ts#L19)*

___

###  allowImplicitQueries

• **allowImplicitQueries**: *boolean*

*Defined in [query-access/query-access.ts:15](https://github.com/terascope/teraslice/blob/d2d877b60/packages/xlucene-evaluator/src/query-access/query-access.ts#L15)*

___

### `Optional` constraint

• **constraint**? : *undefined | string*

*Defined in [query-access/query-access.ts:13](https://github.com/terascope/teraslice/blob/d2d877b60/packages/xlucene-evaluator/src/query-access/query-access.ts#L13)*

___

### `Optional` defaultGeoField

• **defaultGeoField**? : *undefined | string*

*Defined in [query-access/query-access.ts:16](https://github.com/terascope/teraslice/blob/d2d877b60/packages/xlucene-evaluator/src/query-access/query-access.ts#L16)*

___

### `Optional` defaultGeoSortOrder

• **defaultGeoSortOrder**? : *[SortOrder](../overview.md#sortorder)*

*Defined in [query-access/query-access.ts:17](https://github.com/terascope/teraslice/blob/d2d877b60/packages/xlucene-evaluator/src/query-access/query-access.ts#L17)*

___

### `Optional` defaultGeoSortUnit

• **defaultGeoSortUnit**? : *p.GeoDistanceUnit | string*

*Defined in [query-access/query-access.ts:18](https://github.com/terascope/teraslice/blob/d2d877b60/packages/xlucene-evaluator/src/query-access/query-access.ts#L18)*

___

###  excludes

• **excludes**: *keyof T[]*

*Defined in [query-access/query-access.ts:11](https://github.com/terascope/teraslice/blob/d2d877b60/packages/xlucene-evaluator/src/query-access/query-access.ts#L11)*

___

###  includes

• **includes**: *keyof T[]*

*Defined in [query-access/query-access.ts:12](https://github.com/terascope/teraslice/blob/d2d877b60/packages/xlucene-evaluator/src/query-access/query-access.ts#L12)*

___

###  logger

• **logger**: *Logger*

*Defined in [query-access/query-access.ts:21](https://github.com/terascope/teraslice/blob/d2d877b60/packages/xlucene-evaluator/src/query-access/query-access.ts#L21)*

___

###  preventPrefixWildcard

• **preventPrefixWildcard**: *boolean*

*Defined in [query-access/query-access.ts:14](https://github.com/terascope/teraslice/blob/d2d877b60/packages/xlucene-evaluator/src/query-access/query-access.ts#L14)*

___

###  typeConfig

• **typeConfig**: *[TypeConfig](../interfaces/typeconfig.md)*

*Defined in [query-access/query-access.ts:20](https://github.com/terascope/teraslice/blob/d2d877b60/packages/xlucene-evaluator/src/query-access/query-access.ts#L20)*

## Methods

###  clearCache

▸ **clearCache**(): *void*

*Defined in [query-access/query-access.ts:50](https://github.com/terascope/teraslice/blob/d2d877b60/packages/xlucene-evaluator/src/query-access/query-access.ts#L50)*

**Returns:** *void*

___

###  restrict

▸ **restrict**(`q`: string): *string*

*Defined in [query-access/query-access.ts:60](https://github.com/terascope/teraslice/blob/d2d877b60/packages/xlucene-evaluator/src/query-access/query-access.ts#L60)*

Validate and restrict a xlucene query

**Parameters:**

Name | Type |
------ | ------ |
`q` | string |

**Returns:** *string*

a restricted xlucene query

___

###  restrictSearchQuery

▸ **restrictSearchQuery**(`query`: string, `opts`: [RestrictSearchQueryOptions](../interfaces/restrictsearchqueryoptions.md)): *SearchParams*

*Defined in [query-access/query-access.ts:150](https://github.com/terascope/teraslice/blob/d2d877b60/packages/xlucene-evaluator/src/query-access/query-access.ts#L150)*

Converts a restricted xlucene query to an elasticsearch search query

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`query` | string | - |
`opts` | [RestrictSearchQueryOptions](../interfaces/restrictsearchqueryoptions.md) |  {} |

**Returns:** *SearchParams*

a restricted elasticsearch search query

___

###  restrictSourceFields

▸ **restrictSourceFields**(`includes?`: keyof T[], `excludes?`: keyof T[]): *object*

*Defined in [query-access/query-access.ts:212](https://github.com/terascope/teraslice/blob/d2d877b60/packages/xlucene-evaluator/src/query-access/query-access.ts#L212)*

Restrict requested source to all or subset of the ones available

**NOTE:** this will remove restricted fields and will not throw

**Parameters:**

Name | Type |
------ | ------ |
`includes?` | keyof T[] |
`excludes?` | keyof T[] |

**Returns:** *object*
