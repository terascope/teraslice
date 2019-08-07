---
title: Teraslice State Storage API Overview
sidebar_label: API
---

### Classes

* [CachedStateStorage](classes/cachedstatestorage.md)
* [ESCachedStateStorage](classes/escachedstatestorage.md)

### Interfaces

* [CacheConfig](interfaces/cacheconfig.md)
* [ESQUery](interfaces/esquery.md)
* [ESQuery](interfaces/esquery.md)
* [ESStateStorageConfig](interfaces/esstatestorageconfig.md)
* [EvictedEvent](interfaces/evictedevent.md)
* [MGetCacheResponse](interfaces/mgetcacheresponse.md)
* [MGetDoc](interfaces/mgetdoc.md)
* [MGetResponse](interfaces/mgetresponse.md)
* [SetTuple](interfaces/settuple.md)

### Type aliases

* [ESBulkQuery](overview.md#esbulkquery)
* [ValuesFn](overview.md#valuesfn)

## Type aliases

###  ESBulkQuery

Ƭ **ESBulkQuery**: *[ESQuery](interfaces/esquery.md) | `DataEntity`*

*Defined in [interfaces.ts:24](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/teraslice-state-storage/src/interfaces.ts#L24)*

___

###  ValuesFn

Ƭ **ValuesFn**: *function*

*Defined in [interfaces.ts:55](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/teraslice-state-storage/src/interfaces.ts#L55)*

#### Type declaration:

▸ (`doc`: `T`): *void*

**Parameters:**

Name | Type |
------ | ------ |
`doc` | `T` |
