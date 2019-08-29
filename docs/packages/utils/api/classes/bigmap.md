---
title: Utils: `BigMap`
sidebar_label: BigMap
---

# Class: BigMap <**K, V**>

Avoid v8 maximum size for Map by spreading the cache across multiple Maps.
This class has the same API as Map but minus more differences in ->set and ->forEach

## Type parameters

▪ **K**

▪ **V**

## Hierarchy

* **BigMap**

## Index

### Constructors

* [constructor](bigmap.md#constructor)

### Properties

* [maxMapSize](bigmap.md#maxmapsize)

### Accessors

* [size](bigmap.md#size)

### Methods

* [__@iterator](bigmap.md#__@iterator)
* [clear](bigmap.md#clear)
* [delete](bigmap.md#delete)
* [entries](bigmap.md#entries)
* [forEach](bigmap.md#foreach)
* [get](bigmap.md#get)
* [has](bigmap.md#has)
* [keys](bigmap.md#keys)
* [set](bigmap.md#set)
* [values](bigmap.md#values)

## Constructors

###  constructor

\+ **new BigMap**(`maxMapSize`: number): *[BigMap](bigmap.md)*

*Defined in [big-map.ts:11](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/big-map.ts#L11)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`maxMapSize` | number |  defaultMaxSize |

**Returns:** *[BigMap](bigmap.md)*

## Properties

###  maxMapSize

• **maxMapSize**: *number*

*Defined in [big-map.ts:8](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/big-map.ts#L8)*

## Accessors

###  size

• **get size**(): *number*

*Defined in [big-map.ts:70](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/big-map.ts#L70)*

**Returns:** *number*

## Methods

###  __@iterator

▸ **__@iterator**(): *IterableIterator‹[K, V]›*

*Defined in [big-map.ts:117](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/big-map.ts#L117)*

**Returns:** *IterableIterator‹[K, V]›*

___

###  clear

▸ **clear**(): *void*

*Defined in [big-map.ts:57](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/big-map.ts#L57)*

**Returns:** *void*

___

###  delete

▸ **delete**(`key`: K): *boolean*

*Defined in [big-map.ts:44](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/big-map.ts#L44)*

**Parameters:**

Name | Type |
------ | ------ |
`key` | K |

**Returns:** *boolean*

___

###  entries

▸ **entries**(): *IterableIterator‹[K, V]›*

*Defined in [big-map.ts:96](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/big-map.ts#L96)*

**Returns:** *IterableIterator‹[K, V]›*

___

###  forEach

▸ **forEach**(`callbackFn`: function, `thisArg?`: any): *void*

*Defined in [big-map.ts:84](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/big-map.ts#L84)*

**Parameters:**

▪ **callbackFn**: *function*

▸ (`value`: V, `key`: K, `map`: [BigMap](bigmap.md)‹K, V›): *void*

**Parameters:**

Name | Type |
------ | ------ |
`value` | V |
`key` | K |
`map` | [BigMap](bigmap.md)‹K, V› |

▪`Optional`  **thisArg**: *any*

**Returns:** *void*

___

###  get

▸ **get**(`key`: K): *unknown*

*Defined in [big-map.ts:37](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/big-map.ts#L37)*

**Parameters:**

Name | Type |
------ | ------ |
`key` | K |

**Returns:** *unknown*

___

###  has

▸ **has**(`key`: K): *boolean*

*Defined in [big-map.ts:30](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/big-map.ts#L30)*

**Parameters:**

Name | Type |
------ | ------ |
`key` | K |

**Returns:** *boolean*

___

###  keys

▸ **keys**(): *IterableIterator‹K›*

*Defined in [big-map.ts:103](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/big-map.ts#L103)*

**Returns:** *IterableIterator‹K›*

___

###  set

▸ **set**(`key`: K, `value`: V): *Map‹K, V›*

*Defined in [big-map.ts:20](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/big-map.ts#L20)*

**Parameters:**

Name | Type |
------ | ------ |
`key` | K |
`value` | V |

**Returns:** *Map‹K, V›*

___

###  values

▸ **values**(): *IterableIterator‹V›*

*Defined in [big-map.ts:110](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/big-map.ts#L110)*

**Returns:** *IterableIterator‹V›*
