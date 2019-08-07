---
title: Teraslice State Storage: `ESCachedStateStorage`
sidebar_label: ESCachedStateStorage
---

# Class: ESCachedStateStorage

## Hierarchy

* **ESCachedStateStorage**

## Index

### Constructors

* [constructor](escachedstatestorage.md#constructor)

### Properties

* [cache](escachedstatestorage.md#cache)

### Methods

* [count](escachedstatestorage.md#count)
* [get](escachedstatestorage.md#get)
* [getFromCache](escachedstatestorage.md#getfromcache)
* [initialize](escachedstatestorage.md#initialize)
* [isCached](escachedstatestorage.md#iscached)
* [mget](escachedstatestorage.md#mget)
* [mset](escachedstatestorage.md#mset)
* [set](escachedstatestorage.md#set)
* [shutdown](escachedstatestorage.md#shutdown)
* [sync](escachedstatestorage.md#sync)

## Constructors

###  constructor

\+ **new ESCachedStateStorage**(`client`: `Client`, `logger`: `Logger`, `config`: [ESStateStorageConfig](../interfaces/esstatestorageconfig.md)): *[ESCachedStateStorage](escachedstatestorage.md)*

*Defined in [elasticsearch-state-storage/index.ts:21](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/teraslice-state-storage/src/elasticsearch-state-storage/index.ts#L21)*

**Parameters:**

Name | Type |
------ | ------ |
`client` | `Client` |
`logger` | `Logger` |
`config` | [ESStateStorageConfig](../interfaces/esstatestorageconfig.md) |

**Returns:** *[ESCachedStateStorage](escachedstatestorage.md)*

## Properties

###  cache

• **cache**: *[CachedStateStorage](cachedstatestorage.md)‹*`DataEntity`*›*

*Defined in [elasticsearch-state-storage/index.ts:21](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/teraslice-state-storage/src/elasticsearch-state-storage/index.ts#L21)*

## Methods

###  count

▸ **count**(): *number*

*Defined in [elasticsearch-state-storage/index.ts:191](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/teraslice-state-storage/src/elasticsearch-state-storage/index.ts#L191)*

**Returns:** *number*

___

###  get

▸ **get**(`doc`: `DataEntity`): *`Promise<DataEntity<object>>`*

*Defined in [elasticsearch-state-storage/index.ts:108](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/teraslice-state-storage/src/elasticsearch-state-storage/index.ts#L108)*

**Parameters:**

Name | Type |
------ | ------ |
`doc` | `DataEntity` |

**Returns:** *`Promise<DataEntity<object>>`*

___

###  getFromCache

▸ **getFromCache**(`doc`: `DataEntity`): *undefined | `DataEntity<object>`*

*Defined in [elasticsearch-state-storage/index.ts:98](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/teraslice-state-storage/src/elasticsearch-state-storage/index.ts#L98)*

**Parameters:**

Name | Type |
------ | ------ |
`doc` | `DataEntity` |

**Returns:** *undefined | `DataEntity<object>`*

___

###  initialize

▸ **initialize**(): *`Promise<void>`*

*Defined in [elasticsearch-state-storage/index.ts:195](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/teraslice-state-storage/src/elasticsearch-state-storage/index.ts#L195)*

**Returns:** *`Promise<void>`*

___

###  isCached

▸ **isCached**(`doc`: `DataEntity`): *boolean*

*Defined in [elasticsearch-state-storage/index.ts:103](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/teraslice-state-storage/src/elasticsearch-state-storage/index.ts#L103)*

**Parameters:**

Name | Type |
------ | ------ |
`doc` | `DataEntity` |

**Returns:** *boolean*

___

###  mget

▸ **mget**(`docArray`: `DataEntity`[]): *`Promise<object>`*

*Defined in [elasticsearch-state-storage/index.ts:169](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/teraslice-state-storage/src/elasticsearch-state-storage/index.ts#L169)*

**Parameters:**

Name | Type |
------ | ------ |
`docArray` | `DataEntity`[] |

**Returns:** *`Promise<object>`*

___

###  mset

▸ **mset**(`docArray`: `DataEntity`[]): *`Promise<void>`*

*Defined in [elasticsearch-state-storage/index.ts:182](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/teraslice-state-storage/src/elasticsearch-state-storage/index.ts#L182)*

**Parameters:**

Name | Type |
------ | ------ |
`docArray` | `DataEntity`[] |

**Returns:** *`Promise<void>`*

___

###  set

▸ **set**(`doc`: `DataEntity`): *void*

*Defined in [elasticsearch-state-storage/index.ts:176](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/teraslice-state-storage/src/elasticsearch-state-storage/index.ts#L176)*

**Parameters:**

Name | Type |
------ | ------ |
`doc` | `DataEntity` |

**Returns:** *void*

___

###  shutdown

▸ **shutdown**(): *`Promise<void>`*

*Defined in [elasticsearch-state-storage/index.ts:199](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/teraslice-state-storage/src/elasticsearch-state-storage/index.ts#L199)*

**Returns:** *`Promise<void>`*

___

###  sync

▸ **sync**(`docArray`: `DataEntity`[], `fn?`: `CB`): *`Promise<void>`*

*Defined in [elasticsearch-state-storage/index.ts:161](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/teraslice-state-storage/src/elasticsearch-state-storage/index.ts#L161)*

**Parameters:**

Name | Type |
------ | ------ |
`docArray` | `DataEntity`[] |
`fn?` | `CB` |

**Returns:** *`Promise<void>`*
