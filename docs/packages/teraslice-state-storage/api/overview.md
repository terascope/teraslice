---
title: Teraslice State Storage API Overview
sidebar_label: API
---

## Index

### Classes

* [CachedStateStorage](classes/cachedstatestorage.md)
* [ESCachedStateStorage](classes/escachedstatestorage.md)

### Interfaces

* [CacheConfig](interfaces/cacheconfig.md)
* [ESGetParams](interfaces/esgetparams.md)
* [ESGetResponse](interfaces/esgetresponse.md)
* [ESMGetParams](interfaces/esmgetparams.md)
* [ESMGetResponse](interfaces/esmgetresponse.md)
* [ESQuery](interfaces/esquery.md)
* [ESStateStorageConfig](interfaces/esstatestorageconfig.md)
* [EvictedEvent](interfaces/evictedevent.md)
* [MGetCacheResponse](interfaces/mgetcacheresponse.md)
* [SetTuple](interfaces/settuple.md)

### Type aliases

* [ESBulkQuery](overview.md#esbulkquery)
* [UpdateCacheFn](overview.md#updatecachefn)
* [ValuesFn](overview.md#valuesfn)

## Type aliases

###  ESBulkQuery

Ƭ **ESBulkQuery**: *[ESQuery](interfaces/esquery.md) | DataEntity*

*Defined in [elasticsearch-state-storage/index.ts:312](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-state-storage/src/elasticsearch-state-storage/index.ts#L312)*

___

###  UpdateCacheFn

Ƭ **UpdateCacheFn**: *function*

*Defined in [elasticsearch-state-storage/index.ts:296](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-state-storage/src/elasticsearch-state-storage/index.ts#L296)*

#### Type declaration:

▸ (`key`: string, `current`: DataEntity, `prev?`: DataEntity): *DataEntity | boolean*

**Parameters:**

Name | Type |
------ | ------ |
`key` | string |
`current` | DataEntity |
`prev?` | DataEntity |

___

###  ValuesFn

Ƭ **ValuesFn**: *function*

*Defined in [interfaces.ts:22](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-state-storage/src/interfaces.ts#L22)*

#### Type declaration:

▸ (`doc`: T): *void*

**Parameters:**

Name | Type |
------ | ------ |
`doc` | T |
