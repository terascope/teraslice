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
* [getFromCacheByKey](escachedstatestorage.md#getfromcachebykey)
* [getIdentifier](escachedstatestorage.md#getidentifier)
* [initialize](escachedstatestorage.md#initialize)
* [isCached](escachedstatestorage.md#iscached)
* [isKeyCached](escachedstatestorage.md#iskeycached)
* [mget](escachedstatestorage.md#mget)
* [mset](escachedstatestorage.md#mset)
* [set](escachedstatestorage.md#set)
* [setCacheByKey](escachedstatestorage.md#setcachebykey)
* [shutdown](escachedstatestorage.md#shutdown)
* [sync](escachedstatestorage.md#sync)

## Constructors

###  constructor

\+ **new ESCachedStateStorage**(`client`: Client, `logger`: Logger, `config`: [ESStateStorageConfig](../interfaces/esstatestorageconfig.md)): *[ESCachedStateStorage](escachedstatestorage.md)*

*Defined in [elasticsearch-state-storage/index.ts:24](https://github.com/terascope/teraslice/blob/0ae31df4/packages/teraslice-state-storage/src/elasticsearch-state-storage/index.ts#L24)*

**Parameters:**

Name | Type |
------ | ------ |
`client` | Client |
`logger` | Logger |
`config` | [ESStateStorageConfig](../interfaces/esstatestorageconfig.md) |

**Returns:** *[ESCachedStateStorage](escachedstatestorage.md)*

## Properties

###  cache

• **cache**: *[CachedStateStorage](cachedstatestorage.md)‹DataEntity›*

*Defined in [elasticsearch-state-storage/index.ts:24](https://github.com/terascope/teraslice/blob/0ae31df4/packages/teraslice-state-storage/src/elasticsearch-state-storage/index.ts#L24)*

## Methods

###  count

▸ **count**(): *number*

*Defined in [elasticsearch-state-storage/index.ts:47](https://github.com/terascope/teraslice/blob/0ae31df4/packages/teraslice-state-storage/src/elasticsearch-state-storage/index.ts#L47)*

**Returns:** *number*

___

###  get

▸ **get**(`doc`: DataEntity): *Promise‹DataEntity | undefined›*

*Defined in [elasticsearch-state-storage/index.ts:101](https://github.com/terascope/teraslice/blob/0ae31df4/packages/teraslice-state-storage/src/elasticsearch-state-storage/index.ts#L101)*

**Parameters:**

Name | Type |
------ | ------ |
`doc` | DataEntity |

**Returns:** *Promise‹DataEntity | undefined›*

___

###  getFromCache

▸ **getFromCache**(`doc`: DataEntity): *undefined | DataEntity‹object, object›*

*Defined in [elasticsearch-state-storage/index.ts:83](https://github.com/terascope/teraslice/blob/0ae31df4/packages/teraslice-state-storage/src/elasticsearch-state-storage/index.ts#L83)*

**Parameters:**

Name | Type |
------ | ------ |
`doc` | DataEntity |

**Returns:** *undefined | DataEntity‹object, object›*

___

###  getFromCacheByKey

▸ **getFromCacheByKey**(`key`: string): *undefined | DataEntity‹object, object›*

*Defined in [elasticsearch-state-storage/index.ts:88](https://github.com/terascope/teraslice/blob/0ae31df4/packages/teraslice-state-storage/src/elasticsearch-state-storage/index.ts#L88)*

**Parameters:**

Name | Type |
------ | ------ |
`key` | string |

**Returns:** *undefined | DataEntity‹object, object›*

___

###  getIdentifier

▸ **getIdentifier**(`doc`: DataEntity, `metaKey`: string): *string*

*Defined in [elasticsearch-state-storage/index.ts:51](https://github.com/terascope/teraslice/blob/0ae31df4/packages/teraslice-state-storage/src/elasticsearch-state-storage/index.ts#L51)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`doc` | DataEntity | - |
`metaKey` | string | "_key" |

**Returns:** *string*

___

###  initialize

▸ **initialize**(): *Promise‹void›*

*Defined in [elasticsearch-state-storage/index.ts:41](https://github.com/terascope/teraslice/blob/0ae31df4/packages/teraslice-state-storage/src/elasticsearch-state-storage/index.ts#L41)*

**Returns:** *Promise‹void›*

___

###  isCached

▸ **isCached**(`doc`: DataEntity): *boolean*

*Defined in [elasticsearch-state-storage/index.ts:92](https://github.com/terascope/teraslice/blob/0ae31df4/packages/teraslice-state-storage/src/elasticsearch-state-storage/index.ts#L92)*

**Parameters:**

Name | Type |
------ | ------ |
`doc` | DataEntity |

**Returns:** *boolean*

___

###  isKeyCached

▸ **isKeyCached**(`key`: string): *boolean*

*Defined in [elasticsearch-state-storage/index.ts:97](https://github.com/terascope/teraslice/blob/0ae31df4/packages/teraslice-state-storage/src/elasticsearch-state-storage/index.ts#L97)*

**Parameters:**

Name | Type |
------ | ------ |
`key` | string |

**Returns:** *boolean*

___

###  mget

▸ **mget**(`docArray`: DataEntity[]): *Promise‹[MGetCacheResponse](../interfaces/mgetcacheresponse.md)›*

*Defined in [elasticsearch-state-storage/index.ts:109](https://github.com/terascope/teraslice/blob/0ae31df4/packages/teraslice-state-storage/src/elasticsearch-state-storage/index.ts#L109)*

**Parameters:**

Name | Type |
------ | ------ |
`docArray` | DataEntity[] |

**Returns:** *Promise‹[MGetCacheResponse](../interfaces/mgetcacheresponse.md)›*

___

###  mset

▸ **mset**(`docArray`: DataEntity[]): *Promise‹void›*

*Defined in [elasticsearch-state-storage/index.ts:61](https://github.com/terascope/teraslice/blob/0ae31df4/packages/teraslice-state-storage/src/elasticsearch-state-storage/index.ts#L61)*

**Parameters:**

Name | Type |
------ | ------ |
`docArray` | DataEntity[] |

**Returns:** *Promise‹void›*

___

###  set

▸ **set**(`doc`: DataEntity): *void*

*Defined in [elasticsearch-state-storage/index.ts:73](https://github.com/terascope/teraslice/blob/0ae31df4/packages/teraslice-state-storage/src/elasticsearch-state-storage/index.ts#L73)*

**Parameters:**

Name | Type |
------ | ------ |
`doc` | DataEntity |

**Returns:** *void*

___

###  setCacheByKey

▸ **setCacheByKey**(`key`: string, `doc`: DataEntity): *void*

*Defined in [elasticsearch-state-storage/index.ts:79](https://github.com/terascope/teraslice/blob/0ae31df4/packages/teraslice-state-storage/src/elasticsearch-state-storage/index.ts#L79)*

**Parameters:**

Name | Type |
------ | ------ |
`key` | string |
`doc` | DataEntity |

**Returns:** *void*

___

###  shutdown

▸ **shutdown**(): *Promise‹void›*

*Defined in [elasticsearch-state-storage/index.ts:43](https://github.com/terascope/teraslice/blob/0ae31df4/packages/teraslice-state-storage/src/elasticsearch-state-storage/index.ts#L43)*

**Returns:** *Promise‹void›*

___

###  sync

▸ **sync**(`docArray`: DataEntity[], `fn`: [UpdateCacheFn](../overview.md#updatecachefn)): *Promise‹void›*

*Defined in [elasticsearch-state-storage/index.ts:120](https://github.com/terascope/teraslice/blob/0ae31df4/packages/teraslice-state-storage/src/elasticsearch-state-storage/index.ts#L120)*

**Parameters:**

Name | Type |
------ | ------ |
`docArray` | DataEntity[] |
`fn` | [UpdateCacheFn](../overview.md#updatecachefn) |

**Returns:** *Promise‹void›*
