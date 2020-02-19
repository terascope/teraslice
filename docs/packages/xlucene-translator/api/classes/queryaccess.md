---
title: xLucene Translator: `QueryAccess`
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
* [constraints](queryaccess.md#optional-constraints)
* [defaultGeoField](queryaccess.md#optional-defaultgeofield)
* [defaultGeoSortOrder](queryaccess.md#optional-defaultgeosortorder)
* [defaultGeoSortUnit](queryaccess.md#optional-defaultgeosortunit)
* [excludes](queryaccess.md#excludes)
* [includes](queryaccess.md#includes)
* [logger](queryaccess.md#logger)
* [parsedTypeConfig](queryaccess.md#parsedtypeconfig)
* [preventPrefixWildcard](queryaccess.md#preventprefixwildcard)
* [typeConfig](queryaccess.md#typeconfig)
* [variables](queryaccess.md#variables)

### Methods

* [clearCache](queryaccess.md#clearcache)
* [restrict](queryaccess.md#restrict)
* [restrictSearchQuery](queryaccess.md#restrictsearchquery)
* [restrictSourceFields](queryaccess.md#restrictsourcefields)

## Constructors

###  constructor

\+ **new QueryAccess**(`config`: [QueryAccessConfig](../interfaces/queryaccessconfig.md)‹T›, `options`: [QueryAccessOptions](../interfaces/queryaccessoptions.md)): *[QueryAccess](queryaccess.md)*

*Defined in [xlucene-translator/src/query-access/query-access.ts:32](https://github.com/terascope/teraslice/blob/653cf7530/packages/xlucene-translator/src/query-access/query-access.ts#L32)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`config` | [QueryAccessConfig](../interfaces/queryaccessconfig.md)‹T› |  {} |
`options` | [QueryAccessOptions](../interfaces/queryaccessoptions.md) |  {} |

**Returns:** *[QueryAccess](queryaccess.md)*

## Properties

###  allowEmpty

• **allowEmpty**: *boolean*

*Defined in [xlucene-translator/src/query-access/query-access.ts:25](https://github.com/terascope/teraslice/blob/653cf7530/packages/xlucene-translator/src/query-access/query-access.ts#L25)*

___

###  allowImplicitQueries

• **allowImplicitQueries**: *boolean*

*Defined in [xlucene-translator/src/query-access/query-access.ts:21](https://github.com/terascope/teraslice/blob/653cf7530/packages/xlucene-translator/src/query-access/query-access.ts#L21)*

___

### `Optional` constraints

• **constraints**? : *string[]*

*Defined in [xlucene-translator/src/query-access/query-access.ts:19](https://github.com/terascope/teraslice/blob/653cf7530/packages/xlucene-translator/src/query-access/query-access.ts#L19)*

___

### `Optional` defaultGeoField

• **defaultGeoField**? : *undefined | string*

*Defined in [xlucene-translator/src/query-access/query-access.ts:22](https://github.com/terascope/teraslice/blob/653cf7530/packages/xlucene-translator/src/query-access/query-access.ts#L22)*

___

### `Optional` defaultGeoSortOrder

• **defaultGeoSortOrder**? : *SortOrder*

*Defined in [xlucene-translator/src/query-access/query-access.ts:23](https://github.com/terascope/teraslice/blob/653cf7530/packages/xlucene-translator/src/query-access/query-access.ts#L23)*

___

### `Optional` defaultGeoSortUnit

• **defaultGeoSortUnit**? : *GeoDistanceUnit | string*

*Defined in [xlucene-translator/src/query-access/query-access.ts:24](https://github.com/terascope/teraslice/blob/653cf7530/packages/xlucene-translator/src/query-access/query-access.ts#L24)*

___

###  excludes

• **excludes**: *keyof T[]*

*Defined in [xlucene-translator/src/query-access/query-access.ts:17](https://github.com/terascope/teraslice/blob/653cf7530/packages/xlucene-translator/src/query-access/query-access.ts#L17)*

___

###  includes

• **includes**: *keyof T[]*

*Defined in [xlucene-translator/src/query-access/query-access.ts:18](https://github.com/terascope/teraslice/blob/653cf7530/packages/xlucene-translator/src/query-access/query-access.ts#L18)*

___

###  logger

• **logger**: *Logger*

*Defined in [xlucene-translator/src/query-access/query-access.ts:29](https://github.com/terascope/teraslice/blob/653cf7530/packages/xlucene-translator/src/query-access/query-access.ts#L29)*

___

###  parsedTypeConfig

• **parsedTypeConfig**: *XluceneTypeConfig*

*Defined in [xlucene-translator/src/query-access/query-access.ts:27](https://github.com/terascope/teraslice/blob/653cf7530/packages/xlucene-translator/src/query-access/query-access.ts#L27)*

___

###  preventPrefixWildcard

• **preventPrefixWildcard**: *boolean*

*Defined in [xlucene-translator/src/query-access/query-access.ts:20](https://github.com/terascope/teraslice/blob/653cf7530/packages/xlucene-translator/src/query-access/query-access.ts#L20)*

___

###  typeConfig

• **typeConfig**: *XluceneTypeConfig*

*Defined in [xlucene-translator/src/query-access/query-access.ts:26](https://github.com/terascope/teraslice/blob/653cf7530/packages/xlucene-translator/src/query-access/query-access.ts#L26)*

___

###  variables

• **variables**: *XluceneVariables*

*Defined in [xlucene-translator/src/query-access/query-access.ts:28](https://github.com/terascope/teraslice/blob/653cf7530/packages/xlucene-translator/src/query-access/query-access.ts#L28)*

## Methods

###  clearCache

▸ **clearCache**(): *void*

*Defined in [xlucene-translator/src/query-access/query-access.ts:65](https://github.com/terascope/teraslice/blob/653cf7530/packages/xlucene-translator/src/query-access/query-access.ts#L65)*

**Returns:** *void*

___

###  restrict

▸ **restrict**(`q`: string, `options`: [RestrictOptions](../interfaces/restrictoptions.md)): *string*

*Defined in [xlucene-translator/src/query-access/query-access.ts:75](https://github.com/terascope/teraslice/blob/653cf7530/packages/xlucene-translator/src/query-access/query-access.ts#L75)*

Validate and restrict a xlucene query

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`q` | string | - |
`options` | [RestrictOptions](../interfaces/restrictoptions.md) |  {} |

**Returns:** *string*

a restricted xlucene query

___

###  restrictSearchQuery

▸ **restrictSearchQuery**(`query`: string, `opts`: [RestrictSearchQueryOptions](../interfaces/restrictsearchqueryoptions.md)): *Promise‹SearchParams›*

*Defined in [xlucene-translator/src/query-access/query-access.ts:187](https://github.com/terascope/teraslice/blob/653cf7530/packages/xlucene-translator/src/query-access/query-access.ts#L187)*

Converts a restricted xlucene query to an elasticsearch search query

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`query` | string | - |
`opts` | [RestrictSearchQueryOptions](../interfaces/restrictsearchqueryoptions.md) |  {} |

**Returns:** *Promise‹SearchParams›*

a restricted elasticsearch search query

___

###  restrictSourceFields

▸ **restrictSourceFields**(`includes?`: keyof T[], `excludes?`: keyof T[]): *object*

*Defined in [xlucene-translator/src/query-access/query-access.ts:248](https://github.com/terascope/teraslice/blob/653cf7530/packages/xlucene-translator/src/query-access/query-access.ts#L248)*

Restrict requested source to all or subset of the ones available

**NOTE:** this will remove restricted fields and will not throw

**Parameters:**

Name | Type |
------ | ------ |
`includes?` | keyof T[] |
`excludes?` | keyof T[] |

**Returns:** *object*
