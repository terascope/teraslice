---
title: Xlucene Evaluator: `CachedQueryAccess`
sidebar_label: CachedQueryAccess
---

# Class: CachedQueryAccess

## Hierarchy

* **CachedQueryAccess**

### Index

#### Constructors

* [constructor](cachedqueryaccess.md#constructor)

#### Methods

* [make](cachedqueryaccess.md#make)
* [reset](cachedqueryaccess.md#reset)
* [resetInstances](cachedqueryaccess.md#resetinstances)

## Constructors

###  constructor

\+ **new CachedQueryAccess**(): *[CachedQueryAccess](cachedqueryaccess.md)*

*Defined in [query-access/cached-query-access.ts:8](https://github.com/terascope/teraslice/blob/a2250fb9/packages/xlucene-evaluator/src/query-access/cached-query-access.ts#L8)*

**Returns:** *[CachedQueryAccess](cachedqueryaccess.md)*

## Methods

###  make

▸ **make**<**T**>(`config`: *[QueryAccessConfig](../interfaces/queryaccessconfig.md)‹*`T`*›*, `logger?`: *`Logger`*): *[QueryAccess](queryaccess.md)‹*`T`*›*

*Defined in [query-access/cached-query-access.ts:13](https://github.com/terascope/teraslice/blob/a2250fb9/packages/xlucene-evaluator/src/query-access/cached-query-access.ts#L13)*

**Type parameters:**

▪ **T**

**Parameters:**

Name | Type |
------ | ------ |
`config` | [QueryAccessConfig](../interfaces/queryaccessconfig.md)‹*`T`*› |
`logger?` | `Logger` |

**Returns:** *[QueryAccess](queryaccess.md)‹*`T`*›*

___

###  reset

▸ **reset**(): *void*

*Defined in [query-access/cached-query-access.ts:26](https://github.com/terascope/teraslice/blob/a2250fb9/packages/xlucene-evaluator/src/query-access/cached-query-access.ts#L26)*

**Returns:** *void*

___

###  resetInstances

▸ **resetInstances**(): *void*

*Defined in [query-access/cached-query-access.ts:33](https://github.com/terascope/teraslice/blob/a2250fb9/packages/xlucene-evaluator/src/query-access/cached-query-access.ts#L33)*

**Returns:** *void*
