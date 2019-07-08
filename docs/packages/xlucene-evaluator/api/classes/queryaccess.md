---
title: Xlucene Evaluator: `QueryAccess`
sidebar_label: QueryAccess
---

# Class: QueryAccess <**T**>

## Type parameters

▪ **T**: *`AnyObject`*

## Hierarchy

* **QueryAccess**

### Index

#### Constructors

* [constructor](queryaccess.md#constructor)

#### Properties

* [allowEmpty](queryaccess.md#allowempty)
* [allowImplicitQueries](queryaccess.md#allowimplicitqueries)
* [constraint](queryaccess.md#optional-constraint)
* [excludes](queryaccess.md#excludes)
* [includes](queryaccess.md#includes)
* [logger](queryaccess.md#logger)
* [preventPrefixWildcard](queryaccess.md#preventprefixwildcard)
* [typeConfig](queryaccess.md#typeconfig)

#### Methods

* [clearCache](queryaccess.md#clearcache)
* [restrict](queryaccess.md#restrict)
* [restrictSearchQuery](queryaccess.md#restrictsearchquery)
* [restrictSourceFields](queryaccess.md#restrictsourcefields)

## Constructors

###  constructor

\+ **new QueryAccess**(`config`: *[QueryAccessConfig](../interfaces/queryaccessconfig.md)‹*`T`*›*, `logger?`: *`ts.Logger`*): *[QueryAccess](queryaccess.md)*

*Defined in [query-access/query-access.ts:22](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/xlucene-evaluator/src/query-access/query-access.ts#L22)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`config` | [QueryAccessConfig](../interfaces/queryaccessconfig.md)‹*`T`*› |  {} |
`logger?` | `ts.Logger` | - |

**Returns:** *[QueryAccess](queryaccess.md)*

## Properties

###  allowEmpty

• **allowEmpty**: *boolean*

*Defined in [query-access/query-access.ts:17](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/xlucene-evaluator/src/query-access/query-access.ts#L17)*

___

###  allowImplicitQueries

• **allowImplicitQueries**: *boolean*

*Defined in [query-access/query-access.ts:16](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/xlucene-evaluator/src/query-access/query-access.ts#L16)*

___

### `Optional` constraint

• **constraint**? : *undefined | string*

*Defined in [query-access/query-access.ts:14](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/xlucene-evaluator/src/query-access/query-access.ts#L14)*

___

###  excludes

• **excludes**: *`keyof T`[]*

*Defined in [query-access/query-access.ts:12](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/xlucene-evaluator/src/query-access/query-access.ts#L12)*

___

###  includes

• **includes**: *`keyof T`[]*

*Defined in [query-access/query-access.ts:13](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/xlucene-evaluator/src/query-access/query-access.ts#L13)*

___

###  logger

• **logger**: *`Logger`*

*Defined in [query-access/query-access.ts:19](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/xlucene-evaluator/src/query-access/query-access.ts#L19)*

___

###  preventPrefixWildcard

• **preventPrefixWildcard**: *boolean*

*Defined in [query-access/query-access.ts:15](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/xlucene-evaluator/src/query-access/query-access.ts#L15)*

___

###  typeConfig

• **typeConfig**: *[TypeConfig](../interfaces/typeconfig.md)*

*Defined in [query-access/query-access.ts:18](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/xlucene-evaluator/src/query-access/query-access.ts#L18)*

## Methods

###  clearCache

▸ **clearCache**(): *void*

*Defined in [query-access/query-access.ts:45](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/xlucene-evaluator/src/query-access/query-access.ts#L45)*

**Returns:** *void*

___

###  restrict

▸ **restrict**(`query`: *string*): *string*

*Defined in [query-access/query-access.ts:55](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/xlucene-evaluator/src/query-access/query-access.ts#L55)*

Validate and restrict a xlucene query

**Parameters:**

Name | Type |
------ | ------ |
`query` | string |

**Returns:** *string*

a restricted xlucene query

___

###  restrictSearchQuery

▸ **restrictSearchQuery**(`query`: *string*, `params`: *`Partial<SearchParams>`*): *`SearchParams`*

*Defined in [query-access/query-access.ts:110](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/xlucene-evaluator/src/query-access/query-access.ts#L110)*

Converts a restricted xlucene query to an elasticsearch search query

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`query` | string | - |
`params` | `Partial<SearchParams>` |  {} |

**Returns:** *`SearchParams`*

a restricted elasticsearch search query

___

###  restrictSourceFields

▸ **restrictSourceFields**(`includes?`: *`keyof T`[]*, `excludes?`: *`keyof T`[]*): *object*

*Defined in [query-access/query-access.ts:143](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/xlucene-evaluator/src/query-access/query-access.ts#L143)*

Restrict requested source to all or subset of the ones available

**NOTE:** this will remove restricted fields and will not throw

**Parameters:**

Name | Type |
------ | ------ |
`includes?` | `keyof T`[] |
`excludes?` | `keyof T`[] |

**Returns:** *object*

