---
title: xLucene Evaluator: `QueryAccess`
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

*Defined in [query-access/query-access.ts:25](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/query-access/query-access.ts#L25)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`config` | [QueryAccessConfig](../interfaces/queryaccessconfig.md)‹T› |  {} |
`options` | [QueryAccessOptions](../interfaces/queryaccessoptions.md) |  {} |

**Returns:** *[QueryAccess](queryaccess.md)*

## Properties

###  allowEmpty

• **allowEmpty**: *boolean*

*Defined in [query-access/query-access.ts:20](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/query-access/query-access.ts#L20)*

___

###  allowImplicitQueries

• **allowImplicitQueries**: *boolean*

*Defined in [query-access/query-access.ts:16](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/query-access/query-access.ts#L16)*

___

### `Optional` constraint

• **constraint**? : *undefined | string*

*Defined in [query-access/query-access.ts:14](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/query-access/query-access.ts#L14)*

___

### `Optional` defaultGeoField

• **defaultGeoField**? : *undefined | string*

*Defined in [query-access/query-access.ts:17](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/query-access/query-access.ts#L17)*

___

### `Optional` defaultGeoSortOrder

• **defaultGeoSortOrder**? : *[SortOrder](../overview.md#sortorder)*

*Defined in [query-access/query-access.ts:18](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/query-access/query-access.ts#L18)*

___

### `Optional` defaultGeoSortUnit

• **defaultGeoSortUnit**? : *[GeoDistanceUnit](../overview.md#geodistanceunit) | string*

*Defined in [query-access/query-access.ts:19](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/query-access/query-access.ts#L19)*

___

###  excludes

• **excludes**: *keyof T[]*

*Defined in [query-access/query-access.ts:12](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/query-access/query-access.ts#L12)*

___

###  includes

• **includes**: *keyof T[]*

*Defined in [query-access/query-access.ts:13](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/query-access/query-access.ts#L13)*

___

###  logger

• **logger**: *Logger*

*Defined in [query-access/query-access.ts:22](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/query-access/query-access.ts#L22)*

___

###  preventPrefixWildcard

• **preventPrefixWildcard**: *boolean*

*Defined in [query-access/query-access.ts:15](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/query-access/query-access.ts#L15)*

___

###  typeConfig

• **typeConfig**: *[TypeConfig](../interfaces/typeconfig.md)*

*Defined in [query-access/query-access.ts:21](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/query-access/query-access.ts#L21)*

## Methods

###  clearCache

▸ **clearCache**(): *void*

*Defined in [query-access/query-access.ts:51](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/query-access/query-access.ts#L51)*

**Returns:** *void*

___

###  restrict

▸ **restrict**(`q`: string): *string*

*Defined in [query-access/query-access.ts:61](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/query-access/query-access.ts#L61)*

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

*Defined in [query-access/query-access.ts:151](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/query-access/query-access.ts#L151)*

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

*Defined in [query-access/query-access.ts:213](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/query-access/query-access.ts#L213)*

Restrict requested source to all or subset of the ones available

**NOTE:** this will remove restricted fields and will not throw

**Parameters:**

Name | Type |
------ | ------ |
`includes?` | keyof T[] |
`excludes?` | keyof T[] |

**Returns:** *object*
