---
title: Job Components: `WorkerOperations`
sidebar_label: WorkerOperations
---

# Interface: WorkerOperations

## Hierarchy

* Set‹[WorkerOperationLifeCycle](workeroperationlifecycle.md)›

  ↳ **WorkerOperations**

## Index

### Properties

* [Set](workeroperations.md#set)
* [[Symbol.toStringTag]](workeroperations.md#[symbol.tostringtag])
* [size](workeroperations.md#size)

### Methods

* [[Symbol.iterator]](workeroperations.md#[symbol.iterator])
* [add](workeroperations.md#add)
* [clear](workeroperations.md#clear)
* [delete](workeroperations.md#delete)
* [entries](workeroperations.md#entries)
* [forEach](workeroperations.md#foreach)
* [has](workeroperations.md#has)
* [keys](workeroperations.md#keys)
* [values](workeroperations.md#values)

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

▸ **[Symbol.iterator]**(): *IterableIterator‹[WorkerOperationLifeCycle](workeroperationlifecycle.md)›*

*Inherited from void*

Defined in node_modules/typescript/lib/lib.es2015.iterable.d.ts:171

Iterates over values in the set.

**Returns:** *IterableIterator‹[WorkerOperationLifeCycle](workeroperationlifecycle.md)›*

___

###  add

▸ **add**(`value`: [WorkerOperationLifeCycle](workeroperationlifecycle.md)): *this*

*Inherited from void*

Defined in node_modules/typescript/lib/lib.es2015.collection.d.ts:59

**Parameters:**

Name | Type |
------ | ------ |
`value` | [WorkerOperationLifeCycle](workeroperationlifecycle.md) |

**Returns:** *this*

___

###  clear

▸ **clear**(): *void*

*Inherited from void*

Defined in node_modules/typescript/lib/lib.es2015.collection.d.ts:60

**Returns:** *void*

___

###  delete

▸ **delete**(`value`: [WorkerOperationLifeCycle](workeroperationlifecycle.md)): *boolean*

*Inherited from void*

Defined in node_modules/typescript/lib/lib.es2015.collection.d.ts:61

**Parameters:**

Name | Type |
------ | ------ |
`value` | [WorkerOperationLifeCycle](workeroperationlifecycle.md) |

**Returns:** *boolean*

___

###  entries

▸ **entries**(): *IterableIterator‹[[WorkerOperationLifeCycle](workeroperationlifecycle.md), [WorkerOperationLifeCycle](workeroperationlifecycle.md)]›*

*Inherited from void*

Defined in node_modules/typescript/lib/lib.es2015.iterable.d.ts:175

Returns an iterable of [v,v] pairs for every value `v` in the set.

**Returns:** *IterableIterator‹[[WorkerOperationLifeCycle](workeroperationlifecycle.md), [WorkerOperationLifeCycle](workeroperationlifecycle.md)]›*

___

###  forEach

▸ **forEach**(`callbackfn`: function, `thisArg?`: any): *void*

*Inherited from void*

Defined in node_modules/typescript/lib/lib.es2015.collection.d.ts:62

**Parameters:**

▪ **callbackfn**: *function*

▸ (`value`: [WorkerOperationLifeCycle](workeroperationlifecycle.md), `value2`: [WorkerOperationLifeCycle](workeroperationlifecycle.md), `set`: Set‹[WorkerOperationLifeCycle](workeroperationlifecycle.md)›): *void*

**Parameters:**

Name | Type |
------ | ------ |
`value` | [WorkerOperationLifeCycle](workeroperationlifecycle.md) |
`value2` | [WorkerOperationLifeCycle](workeroperationlifecycle.md) |
`set` | Set‹[WorkerOperationLifeCycle](workeroperationlifecycle.md)› |

▪`Optional`  **thisArg**: *any*

**Returns:** *void*

___

###  has

▸ **has**(`value`: [WorkerOperationLifeCycle](workeroperationlifecycle.md)): *boolean*

*Inherited from void*

Defined in node_modules/typescript/lib/lib.es2015.collection.d.ts:63

**Parameters:**

Name | Type |
------ | ------ |
`value` | [WorkerOperationLifeCycle](workeroperationlifecycle.md) |

**Returns:** *boolean*

___

###  keys

▸ **keys**(): *IterableIterator‹[WorkerOperationLifeCycle](workeroperationlifecycle.md)›*

*Inherited from void*

Defined in node_modules/typescript/lib/lib.es2015.iterable.d.ts:179

Despite its name, returns an iterable of the values in the set,

**Returns:** *IterableIterator‹[WorkerOperationLifeCycle](workeroperationlifecycle.md)›*

___

###  values

▸ **values**(): *IterableIterator‹[WorkerOperationLifeCycle](workeroperationlifecycle.md)›*

*Inherited from void*

Defined in node_modules/typescript/lib/lib.es2015.iterable.d.ts:184

Returns an iterable of values in the set.

**Returns:** *IterableIterator‹[WorkerOperationLifeCycle](workeroperationlifecycle.md)›*
