---
title: Teraslice State Storage: `CachedStateStorage`
sidebar_label: CachedStateStorage
---

# Class: CachedStateStorage <**T**>

## Type parameters

▪ **T**

## Hierarchy

* EventEmitter

  * **CachedStateStorage**

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

*Defined in [cached-state-storage/index.ts:10](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-state-storage/src/cached-state-storage/index.ts#L10)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | [CacheConfig](../interfaces/cacheconfig.md) |

**Returns:** *[CachedStateStorage](cachedstatestorage.md)*

## Properties

### `Static` defaultMaxListeners

▪ **defaultMaxListeners**: *number*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/node/events.d.ts:9

## Methods

###  addListener

▸ **addListener**(`event`: string | symbol, `listener`: function): *this*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/node/events.d.ts:11

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

*Defined in [cached-state-storage/index.ts:63](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-state-storage/src/cached-state-storage/index.ts#L63)*

**Returns:** *void*

___

###  count

▸ **count**(): *number*

*Defined in [cached-state-storage/index.ts:44](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-state-storage/src/cached-state-storage/index.ts#L44)*

**Returns:** *number*

___

###  emit

▸ **emit**(`event`: string | symbol, ...`args`: any[]): *boolean*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/node/events.d.ts:23

**Parameters:**

Name | Type |
------ | ------ |
`event` | string \| symbol |
`...args` | any[] |

**Returns:** *boolean*

___

###  eventNames

▸ **eventNames**(): *Array‹string | symbol›*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/node/events.d.ts:24

**Returns:** *Array‹string | symbol›*

___

###  get

▸ **get**(`key`: string): *T | undefined*

*Defined in [cached-state-storage/index.ts:19](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-state-storage/src/cached-state-storage/index.ts#L19)*

**Parameters:**

Name | Type |
------ | ------ |
`key` | string |

**Returns:** *T | undefined*

___

###  getMaxListeners

▸ **getMaxListeners**(): *number*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/node/events.d.ts:20

**Returns:** *number*

___

###  has

▸ **has**(`key`: string): *boolean*

*Defined in [cached-state-storage/index.ts:59](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-state-storage/src/cached-state-storage/index.ts#L59)*

**Parameters:**

Name | Type |
------ | ------ |
`key` | string |

**Returns:** *boolean*

___

###  listenerCount

▸ **listenerCount**(`type`: string | symbol): *number*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/node/events.d.ts:25

**Parameters:**

Name | Type |
------ | ------ |
`type` | string \| symbol |

**Returns:** *number*

___

###  listeners

▸ **listeners**(`event`: string | symbol): *Function[]*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/node/events.d.ts:21

**Parameters:**

Name | Type |
------ | ------ |
`event` | string \| symbol |

**Returns:** *Function[]*

___

###  mget

▸ **mget**(`keyArray`: string[]): *[MGetCacheResponse](../interfaces/mgetcacheresponse.md)*

*Defined in [cached-state-storage/index.ts:23](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-state-storage/src/cached-state-storage/index.ts#L23)*

**Parameters:**

Name | Type |
------ | ------ |
`keyArray` | string[] |

**Returns:** *[MGetCacheResponse](../interfaces/mgetcacheresponse.md)*

___

###  mset

▸ **mset**(`docArray`: [SetTuple](../interfaces/settuple.md)‹T›[]): *void*

*Defined in [cached-state-storage/index.ts:38](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-state-storage/src/cached-state-storage/index.ts#L38)*

**Parameters:**

Name | Type |
------ | ------ |
`docArray` | [SetTuple](../interfaces/settuple.md)‹T›[] |

**Returns:** *void*

___

###  off

▸ **off**(`event`: string | symbol, `listener`: function): *this*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/node/events.d.ts:17

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

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/node/events.d.ts:12

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

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/node/events.d.ts:13

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

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/node/events.d.ts:14

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

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/node/events.d.ts:15

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

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/node/events.d.ts:22

**Parameters:**

Name | Type |
------ | ------ |
`event` | string \| symbol |

**Returns:** *Function[]*

___

###  removeAllListeners

▸ **removeAllListeners**(`event?`: string | symbol): *this*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/node/events.d.ts:18

**Parameters:**

Name | Type |
------ | ------ |
`event?` | string \| symbol |

**Returns:** *this*

___

###  removeListener

▸ **removeListener**(`event`: string | symbol, `listener`: function): *this*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/node/events.d.ts:16

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

▸ **set**(`key`: string, `value`: T): *void*

*Defined in [cached-state-storage/index.ts:31](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-state-storage/src/cached-state-storage/index.ts#L31)*

**Parameters:**

Name | Type |
------ | ------ |
`key` | string |
`value` | T |

**Returns:** *void*

___

###  setMaxListeners

▸ **setMaxListeners**(`n`: number): *this*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/node/events.d.ts:19

**Parameters:**

Name | Type |
------ | ------ |
`n` | number |

**Returns:** *this*

___

###  values

▸ **values**(`fn`: [ValuesFn](../overview.md#valuesfn)‹T›): *Promise‹void›*

*Defined in [cached-state-storage/index.ts:48](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-state-storage/src/cached-state-storage/index.ts#L48)*

**Parameters:**

Name | Type |
------ | ------ |
`fn` | [ValuesFn](../overview.md#valuesfn)‹T› |

**Returns:** *Promise‹void›*

___

### `Static` listenerCount

▸ **listenerCount**(`emitter`: EventEmitter, `event`: string | symbol): *number*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/node/events.d.ts:8

**`deprecated`** since v4.0.0

**Parameters:**

Name | Type |
------ | ------ |
`emitter` | EventEmitter |
`event` | string \| symbol |

**Returns:** *number*
