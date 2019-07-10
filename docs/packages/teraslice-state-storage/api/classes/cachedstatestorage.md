---
title: Teraslice State Storage: `CachedStateStorage`
sidebar_label: CachedStateStorage
---

# Class: CachedStateStorage

## Hierarchy

* **CachedStateStorage**

### Index

#### Constructors

* [constructor](cachedstatestorage.md#constructor)

#### Properties

* [IDField](cachedstatestorage.md#protected-idfield)

#### Methods

* [count](cachedstatestorage.md#count)
* [delete](cachedstatestorage.md#delete)
* [get](cachedstatestorage.md#get)
* [has](cachedstatestorage.md#has)
* [initialize](cachedstatestorage.md#initialize)
* [mdelete](cachedstatestorage.md#mdelete)
* [mget](cachedstatestorage.md#mget)
* [mset](cachedstatestorage.md#mset)
* [set](cachedstatestorage.md#set)
* [shutdown](cachedstatestorage.md#shutdown)

## Constructors

###  constructor

\+ **new CachedStateStorage**(`config`: *[CacheConfig](../interfaces/cacheconfig.md)*): *[CachedStateStorage](cachedstatestorage.md)*

*Defined in [cached-state-storage/index.ts:8](https://github.com/terascope/teraslice/blob/a3992c27/packages/teraslice-state-storage/src/cached-state-storage/index.ts#L8)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | [CacheConfig](../interfaces/cacheconfig.md) |

**Returns:** *[CachedStateStorage](cachedstatestorage.md)*

## Properties

### `Protected` IDField

• **IDField**: *string*

*Defined in [cached-state-storage/index.ts:7](https://github.com/terascope/teraslice/blob/a3992c27/packages/teraslice-state-storage/src/cached-state-storage/index.ts#L7)*

## Methods

###  count

▸ **count**(): *number*

*Defined in [cached-state-storage/index.ts:58](https://github.com/terascope/teraslice/blob/a3992c27/packages/teraslice-state-storage/src/cached-state-storage/index.ts#L58)*

**Returns:** *number*

___

###  delete

▸ **delete**(`doc`: *`DataEntity`*): *void*

*Defined in [cached-state-storage/index.ts:49](https://github.com/terascope/teraslice/blob/a3992c27/packages/teraslice-state-storage/src/cached-state-storage/index.ts#L49)*

**Parameters:**

Name | Type |
------ | ------ |
`doc` | `DataEntity` |

**Returns:** *void*

___

###  get

▸ **get**(`doc`: *`DataEntity`*): *`DataEntity<object>` | undefined*

*Defined in [cached-state-storage/index.ts:26](https://github.com/terascope/teraslice/blob/a3992c27/packages/teraslice-state-storage/src/cached-state-storage/index.ts#L26)*

**Parameters:**

Name | Type |
------ | ------ |
`doc` | `DataEntity` |

**Returns:** *`DataEntity<object>` | undefined*

___

###  has

▸ **has**(`doc`: *`DataEntity`*): *boolean*

*Defined in [cached-state-storage/index.ts:62](https://github.com/terascope/teraslice/blob/a3992c27/packages/teraslice-state-storage/src/cached-state-storage/index.ts#L62)*

**Parameters:**

Name | Type |
------ | ------ |
`doc` | `DataEntity` |

**Returns:** *boolean*

___

###  initialize

▸ **initialize**(): *void*

*Defined in [cached-state-storage/index.ts:67](https://github.com/terascope/teraslice/blob/a3992c27/packages/teraslice-state-storage/src/cached-state-storage/index.ts#L67)*

**Returns:** *void*

___

###  mdelete

▸ **mdelete**(`docArray`: *`DataEntity`[]*): *void*

*Defined in [cached-state-storage/index.ts:54](https://github.com/terascope/teraslice/blob/a3992c27/packages/teraslice-state-storage/src/cached-state-storage/index.ts#L54)*

**Parameters:**

Name | Type |
------ | ------ |
`docArray` | `DataEntity`[] |

**Returns:** *void*

___

###  mget

▸ **mget**(`docArray`: *`DataEntity`[]*): *[MGetCacheResponse](../interfaces/mgetcacheresponse.md)*

*Defined in [cached-state-storage/index.ts:31](https://github.com/terascope/teraslice/blob/a3992c27/packages/teraslice-state-storage/src/cached-state-storage/index.ts#L31)*

**Parameters:**

Name | Type |
------ | ------ |
`docArray` | `DataEntity`[] |

**Returns:** *[MGetCacheResponse](../interfaces/mgetcacheresponse.md)*

___

###  mset

▸ **mset**(`docArray`: *`DataEntity`[]*): *void*

*Defined in [cached-state-storage/index.ts:45](https://github.com/terascope/teraslice/blob/a3992c27/packages/teraslice-state-storage/src/cached-state-storage/index.ts#L45)*

**Parameters:**

Name | Type |
------ | ------ |
`docArray` | `DataEntity`[] |

**Returns:** *void*

___

###  set

▸ **set**(`doc`: *`DataEntity`*): *void*

*Defined in [cached-state-storage/index.ts:40](https://github.com/terascope/teraslice/blob/a3992c27/packages/teraslice-state-storage/src/cached-state-storage/index.ts#L40)*

**Parameters:**

Name | Type |
------ | ------ |
`doc` | `DataEntity` |

**Returns:** *void*

___

###  shutdown

▸ **shutdown**(): *void*

*Defined in [cached-state-storage/index.ts:69](https://github.com/terascope/teraslice/blob/a3992c27/packages/teraslice-state-storage/src/cached-state-storage/index.ts#L69)*

**Returns:** *void*
