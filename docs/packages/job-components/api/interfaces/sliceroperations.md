---
title: Job Components: `SlicerOperations`
sidebar_label: SlicerOperations
---

# Interface: SlicerOperations

## Hierarchy

* Set‹[SlicerOperationLifeCycle](sliceroperationlifecycle.md)›

  ↳ **SlicerOperations**

## Index

### Properties

* [Set](sliceroperations.md#set)
* [[Symbol.toStringTag]](sliceroperations.md#[symbol.tostringtag])
* [size](sliceroperations.md#size)

### Methods

* [[Symbol.iterator]](sliceroperations.md#[symbol.iterator])
* [add](sliceroperations.md#add)
* [clear](sliceroperations.md#clear)
* [delete](sliceroperations.md#delete)
* [entries](sliceroperations.md#entries)
* [forEach](sliceroperations.md#foreach)
* [has](sliceroperations.md#has)
* [keys](sliceroperations.md#keys)
* [values](sliceroperations.md#values)

## Properties

###  Set

• **Set**: *SetConstructor*

Defined in node_modules/typescript/lib/lib.es2015.collection.d.ts:71

___

###  [Symbol.toStringTag]

• **[Symbol.toStringTag]**: *string*

*Inherited from void*

Defined in node_modules/typescript/lib/lib.es2015.symbol.wellknown.d.ts:138

___

###  size

• **size**: *number*

*Inherited from void*

Defined in node_modules/typescript/lib/lib.es2015.collection.d.ts:64

## Methods

###  [Symbol.iterator]

▸ **[Symbol.iterator]**(): *IterableIterator‹[SlicerOperationLifeCycle](sliceroperationlifecycle.md)›*

*Inherited from void*

Defined in node_modules/typescript/lib/lib.es2015.iterable.d.ts:171

Iterates over values in the set.

**Returns:** *IterableIterator‹[SlicerOperationLifeCycle](sliceroperationlifecycle.md)›*

___

###  add

▸ **add**(`value`: [SlicerOperationLifeCycle](sliceroperationlifecycle.md)): *this*

*Inherited from void*

Defined in node_modules/typescript/lib/lib.es2015.collection.d.ts:59

**Parameters:**

Name | Type |
------ | ------ |
`value` | [SlicerOperationLifeCycle](sliceroperationlifecycle.md) |

**Returns:** *this*

___

###  clear

▸ **clear**(): *void*

*Inherited from void*

Defined in node_modules/typescript/lib/lib.es2015.collection.d.ts:60

**Returns:** *void*

___

###  delete

▸ **delete**(`value`: [SlicerOperationLifeCycle](sliceroperationlifecycle.md)): *boolean*

*Inherited from void*

Defined in node_modules/typescript/lib/lib.es2015.collection.d.ts:61

**Parameters:**

Name | Type |
------ | ------ |
`value` | [SlicerOperationLifeCycle](sliceroperationlifecycle.md) |

**Returns:** *boolean*

___

###  entries

▸ **entries**(): *IterableIterator‹[[SlicerOperationLifeCycle](sliceroperationlifecycle.md), [SlicerOperationLifeCycle](sliceroperationlifecycle.md)]›*

*Inherited from void*

Defined in node_modules/typescript/lib/lib.es2015.iterable.d.ts:175

Returns an iterable of [v,v] pairs for every value `v` in the set.

**Returns:** *IterableIterator‹[[SlicerOperationLifeCycle](sliceroperationlifecycle.md), [SlicerOperationLifeCycle](sliceroperationlifecycle.md)]›*

___

###  forEach

▸ **forEach**(`callbackfn`: function, `thisArg?`: any): *void*

*Inherited from void*

Defined in node_modules/typescript/lib/lib.es2015.collection.d.ts:62

**Parameters:**

▪ **callbackfn**: *function*

▸ (`value`: [SlicerOperationLifeCycle](sliceroperationlifecycle.md), `value2`: [SlicerOperationLifeCycle](sliceroperationlifecycle.md), `set`: Set‹[SlicerOperationLifeCycle](sliceroperationlifecycle.md)›): *void*

**Parameters:**

Name | Type |
------ | ------ |
`value` | [SlicerOperationLifeCycle](sliceroperationlifecycle.md) |
`value2` | [SlicerOperationLifeCycle](sliceroperationlifecycle.md) |
`set` | Set‹[SlicerOperationLifeCycle](sliceroperationlifecycle.md)› |

▪`Optional`  **thisArg**: *any*

**Returns:** *void*

___

###  has

▸ **has**(`value`: [SlicerOperationLifeCycle](sliceroperationlifecycle.md)): *boolean*

*Inherited from void*

Defined in node_modules/typescript/lib/lib.es2015.collection.d.ts:63

**Parameters:**

Name | Type |
------ | ------ |
`value` | [SlicerOperationLifeCycle](sliceroperationlifecycle.md) |

**Returns:** *boolean*

___

###  keys

▸ **keys**(): *IterableIterator‹[SlicerOperationLifeCycle](sliceroperationlifecycle.md)›*

*Inherited from void*

Defined in node_modules/typescript/lib/lib.es2015.iterable.d.ts:179

Despite its name, returns an iterable of the values in the set,

**Returns:** *IterableIterator‹[SlicerOperationLifeCycle](sliceroperationlifecycle.md)›*

___

###  values

▸ **values**(): *IterableIterator‹[SlicerOperationLifeCycle](sliceroperationlifecycle.md)›*

*Inherited from void*

Defined in node_modules/typescript/lib/lib.es2015.iterable.d.ts:184

Returns an iterable of values in the set.

**Returns:** *IterableIterator‹[SlicerOperationLifeCycle](sliceroperationlifecycle.md)›*
