---
title: Teraslice State Storage: `CachedStateStorage`
sidebar_label: CachedStateStorage
---

# Class: CachedStateStorage <**T**>

## Type parameters

▪ **T**

## Hierarchy

* EventEmitter

  ↳ **CachedStateStorage**

## Index

### Constructors

* [constructor](cachedstatestorage.md#constructor)

### Properties

* [defaultMaxListeners](cachedstatestorage.md#static-defaultmaxlisteners)

### Methods

* [addListener](cachedstatestorage.md#addlistener)
* [clear](cachedstatestorage.md#clear)
* [count](cachedstatestorage.md#count)
* [emit](cachedstatestorage.md#emit)
* [eventNames](cachedstatestorage.md#eventnames)
* [get](cachedstatestorage.md#get)
* [getMaxListeners](cachedstatestorage.md#getmaxlisteners)
* [has](cachedstatestorage.md#has)
* [listenerCount](cachedstatestorage.md#listenercount)
* [listeners](cachedstatestorage.md#listeners)
* [mget](cachedstatestorage.md#mget)
* [mset](cachedstatestorage.md#mset)
* [off](cachedstatestorage.md#off)
* [on](cachedstatestorage.md#on)
* [once](cachedstatestorage.md#once)
* [prependListener](cachedstatestorage.md#prependlistener)
* [prependOnceListener](cachedstatestorage.md#prependoncelistener)
* [rawListeners](cachedstatestorage.md#rawlisteners)
* [removeAllListeners](cachedstatestorage.md#removealllisteners)
* [removeListener](cachedstatestorage.md#removelistener)
* [set](cachedstatestorage.md#set)
* [setMaxListeners](cachedstatestorage.md#setmaxlisteners)
* [values](cachedstatestorage.md#values)
* [listenerCount](cachedstatestorage.md#static-listenercount)

## Constructors

###  constructor

\+ **new CachedStateStorage**(`config`: [CacheConfig](../interfaces/cacheconfig.md)): *[CachedStateStorage](cachedstatestorage.md)*

*Overrides void*

*Defined in [packages/teraslice-state-storage/src/cached-state-storage/index.ts:10](https://github.com/terascope/teraslice/blob/b843209f9/packages/teraslice-state-storage/src/cached-state-storage/index.ts#L10)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | [CacheConfig](../interfaces/cacheconfig.md) |

**Returns:** *[CachedStateStorage](cachedstatestorage.md)*

## Properties

### `Static` defaultMaxListeners

▪ **defaultMaxListeners**: *number*

*Inherited from void*

Defined in node_modules/@types/node/events.d.ts:45

## Methods

###  addListener

▸ **addListener**(`event`: string | symbol, `listener`: function): *this*

*Inherited from void*

Defined in node_modules/@types/node/globals.d.ts:547

**Parameters:**

▪ **event**: *string | symbol*

▪ **listener**: *function*

▸ (...`args`: any[]): *void*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | any[] |

**Returns:** *this*

___

###  clear

▸ **clear**(): *void*

*Defined in [packages/teraslice-state-storage/src/cached-state-storage/index.ts:63](https://github.com/terascope/teraslice/blob/b843209f9/packages/teraslice-state-storage/src/cached-state-storage/index.ts#L63)*

**Returns:** *void*

___

###  count

▸ **count**(): *number*

*Defined in [packages/teraslice-state-storage/src/cached-state-storage/index.ts:44](https://github.com/terascope/teraslice/blob/b843209f9/packages/teraslice-state-storage/src/cached-state-storage/index.ts#L44)*

**Returns:** *number*

___

###  emit

▸ **emit**(`event`: string | symbol, ...`args`: any[]): *boolean*

*Inherited from void*

Defined in node_modules/@types/node/globals.d.ts:557

**Parameters:**

Name | Type |
------ | ------ |
`event` | string &#124; symbol |
`...args` | any[] |

**Returns:** *boolean*

___

###  eventNames

▸ **eventNames**(): *Array‹string | symbol›*

*Inherited from void*

Defined in node_modules/@types/node/globals.d.ts:562

**Returns:** *Array‹string | symbol›*

___

###  get

▸ **get**(`key`: string | number): *T | undefined*

*Defined in [packages/teraslice-state-storage/src/cached-state-storage/index.ts:19](https://github.com/terascope/teraslice/blob/b843209f9/packages/teraslice-state-storage/src/cached-state-storage/index.ts#L19)*

**Parameters:**

Name | Type |
------ | ------ |
`key` | string &#124; number |

**Returns:** *T | undefined*

___

###  getMaxListeners

▸ **getMaxListeners**(): *number*

*Inherited from void*

Defined in node_modules/@types/node/globals.d.ts:554

**Returns:** *number*

___

###  has

▸ **has**(`key`: string | number): *boolean*

*Defined in [packages/teraslice-state-storage/src/cached-state-storage/index.ts:59](https://github.com/terascope/teraslice/blob/b843209f9/packages/teraslice-state-storage/src/cached-state-storage/index.ts#L59)*

**Parameters:**

Name | Type |
------ | ------ |
`key` | string &#124; number |

**Returns:** *boolean*

___

###  listenerCount

▸ **listenerCount**(`type`: string | symbol): *number*

*Inherited from void*

Defined in node_modules/@types/node/globals.d.ts:558

**Parameters:**

Name | Type |
------ | ------ |
`type` | string &#124; symbol |

**Returns:** *number*

___

###  listeners

▸ **listeners**(`event`: string | symbol): *Function[]*

*Inherited from void*

Defined in node_modules/@types/node/globals.d.ts:555

**Parameters:**

Name | Type |
------ | ------ |
`event` | string &#124; symbol |

**Returns:** *Function[]*

___

###  mget

▸ **mget**(`keyArray`: string | number[]): *[MGetCacheResponse](../interfaces/mgetcacheresponse.md)*

*Defined in [packages/teraslice-state-storage/src/cached-state-storage/index.ts:23](https://github.com/terascope/teraslice/blob/b843209f9/packages/teraslice-state-storage/src/cached-state-storage/index.ts#L23)*

**Parameters:**

Name | Type |
------ | ------ |
`keyArray` | string &#124; number[] |

**Returns:** *[MGetCacheResponse](../interfaces/mgetcacheresponse.md)*

___

###  mset

▸ **mset**(`docArray`: [SetTuple](../interfaces/settuple.md)‹T›[]): *void*

*Defined in [packages/teraslice-state-storage/src/cached-state-storage/index.ts:38](https://github.com/terascope/teraslice/blob/b843209f9/packages/teraslice-state-storage/src/cached-state-storage/index.ts#L38)*

**Parameters:**

Name | Type |
------ | ------ |
`docArray` | [SetTuple](../interfaces/settuple.md)‹T›[] |

**Returns:** *void*

___

###  off

▸ **off**(`event`: string | symbol, `listener`: function): *this*

*Inherited from void*

Defined in node_modules/@types/node/globals.d.ts:551

**Parameters:**

▪ **event**: *string | symbol*

▪ **listener**: *function*

▸ (...`args`: any[]): *void*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | any[] |

**Returns:** *this*

___

###  on

▸ **on**(`event`: string | symbol, `listener`: function): *this*

*Inherited from void*

Defined in node_modules/@types/node/globals.d.ts:548

**Parameters:**

▪ **event**: *string | symbol*

▪ **listener**: *function*

▸ (...`args`: any[]): *void*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | any[] |

**Returns:** *this*

___

###  once

▸ **once**(`event`: string | symbol, `listener`: function): *this*

*Inherited from void*

Defined in node_modules/@types/node/globals.d.ts:549

**Parameters:**

▪ **event**: *string | symbol*

▪ **listener**: *function*

▸ (...`args`: any[]): *void*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | any[] |

**Returns:** *this*

___

###  prependListener

▸ **prependListener**(`event`: string | symbol, `listener`: function): *this*

*Inherited from void*

Defined in node_modules/@types/node/globals.d.ts:560

**Parameters:**

▪ **event**: *string | symbol*

▪ **listener**: *function*

▸ (...`args`: any[]): *void*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | any[] |

**Returns:** *this*

___

###  prependOnceListener

▸ **prependOnceListener**(`event`: string | symbol, `listener`: function): *this*

*Inherited from void*

Defined in node_modules/@types/node/globals.d.ts:561

**Parameters:**

▪ **event**: *string | symbol*

▪ **listener**: *function*

▸ (...`args`: any[]): *void*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | any[] |

**Returns:** *this*

___

###  rawListeners

▸ **rawListeners**(`event`: string | symbol): *Function[]*

*Inherited from void*

Defined in node_modules/@types/node/globals.d.ts:556

**Parameters:**

Name | Type |
------ | ------ |
`event` | string &#124; symbol |

**Returns:** *Function[]*

___

###  removeAllListeners

▸ **removeAllListeners**(`event?`: string | symbol): *this*

*Inherited from void*

Defined in node_modules/@types/node/globals.d.ts:552

**Parameters:**

Name | Type |
------ | ------ |
`event?` | string &#124; symbol |

**Returns:** *this*

___

###  removeListener

▸ **removeListener**(`event`: string | symbol, `listener`: function): *this*

*Inherited from void*

Defined in node_modules/@types/node/globals.d.ts:550

**Parameters:**

▪ **event**: *string | symbol*

▪ **listener**: *function*

▸ (...`args`: any[]): *void*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | any[] |

**Returns:** *this*

___

###  set

▸ **set**(`key`: string | number, `value`: T): *void*

*Defined in [packages/teraslice-state-storage/src/cached-state-storage/index.ts:31](https://github.com/terascope/teraslice/blob/b843209f9/packages/teraslice-state-storage/src/cached-state-storage/index.ts#L31)*

**Parameters:**

Name | Type |
------ | ------ |
`key` | string &#124; number |
`value` | T |

**Returns:** *void*

___

###  setMaxListeners

▸ **setMaxListeners**(`n`: number): *this*

*Inherited from void*

Defined in node_modules/@types/node/globals.d.ts:553

**Parameters:**

Name | Type |
------ | ------ |
`n` | number |

**Returns:** *this*

___

###  values

▸ **values**(`fn`: [ValuesFn](../overview.md#valuesfn)‹T›): *Promise‹void›*

*Defined in [packages/teraslice-state-storage/src/cached-state-storage/index.ts:48](https://github.com/terascope/teraslice/blob/b843209f9/packages/teraslice-state-storage/src/cached-state-storage/index.ts#L48)*

**Parameters:**

Name | Type |
------ | ------ |
`fn` | [ValuesFn](../overview.md#valuesfn)‹T› |

**Returns:** *Promise‹void›*

___

### `Static` listenerCount

▸ **listenerCount**(`emitter`: EventEmitter, `event`: string | symbol): *number*

*Inherited from void*

Defined in node_modules/@types/node/events.d.ts:44

**`deprecated`** since v4.0.0

**Parameters:**

Name | Type |
------ | ------ |
`emitter` | EventEmitter |
`event` | string &#124; symbol |

**Returns:** *number*
