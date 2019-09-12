---
title: Queue: `Queue`
sidebar_label: Queue
---

# Class: Queue <**T**>

A basic FIFO queue

## Type parameters

▪ **T**

## Hierarchy

* **Queue**

## Index

### Properties

* [head](queue.md#optional-head)
* [tail](queue.md#optional-tail)

### Methods

* [dequeue](queue.md#dequeue)
* [each](queue.md#each)
* [enqueue](queue.md#enqueue)
* [exists](queue.md#exists)
* [extract](queue.md#extract)
* [remove](queue.md#remove)
* [size](queue.md#size)
* [unshift](queue.md#unshift)

## Properties

### `Optional` head

• **head**? : *[Node](node.md)‹T›*

*Defined in [queue.ts:5](https://github.com/terascope/teraslice/blob/0ae31df4/packages/queue/src/queue.ts#L5)*

___

### `Optional` tail

• **tail**? : *[Node](node.md)‹T›*

*Defined in [queue.ts:6](https://github.com/terascope/teraslice/blob/0ae31df4/packages/queue/src/queue.ts#L6)*

## Methods

###  dequeue

▸ **dequeue**(): *T | undefined*

*Defined in [queue.ts:28](https://github.com/terascope/teraslice/blob/0ae31df4/packages/queue/src/queue.ts#L28)*

**Returns:** *T | undefined*

___

###  each

▸ **each**(`fn`: function): *void*

*Defined in [queue.ts:50](https://github.com/terascope/teraslice/blob/0ae31df4/packages/queue/src/queue.ts#L50)*

Iterate over each value

**Parameters:**

▪ **fn**: *function*

▸ (`value`: T): *void*

**Parameters:**

Name | Type |
------ | ------ |
`value` | T |

**Returns:** *void*

___

###  enqueue

▸ **enqueue**(`value`: T): *void*

*Defined in [queue.ts:10](https://github.com/terascope/teraslice/blob/0ae31df4/packages/queue/src/queue.ts#L10)*

A value to the end of the queue

**Parameters:**

Name | Type |
------ | ------ |
`value` | T |

**Returns:** *void*

___

###  exists

▸ **exists**(`key`: string, `val`: any): *boolean*

*Defined in [queue.ts:165](https://github.com/terascope/teraslice/blob/0ae31df4/packages/queue/src/queue.ts#L165)*

Search the queue to see if a key value pair exists

**Parameters:**

Name | Type |
------ | ------ |
`key` | string |
`val` | any |

**Returns:** *boolean*

___

###  extract

▸ **extract**(`key`: string, `val`: any): *T | undefined*

*Defined in [queue.ts:114](https://github.com/terascope/teraslice/blob/0ae31df4/packages/queue/src/queue.ts#L114)*

Search the queue for a key that matches a value and return the match

**Parameters:**

Name | Type |
------ | ------ |
`key` | string |
`val` | any |

**Returns:** *T | undefined*

___

###  remove

▸ **remove**(`id`: string, `keyForID?`: undefined | string): *void*

*Defined in [queue.ts:61](https://github.com/terascope/teraslice/blob/0ae31df4/packages/queue/src/queue.ts#L61)*

**Parameters:**

Name | Type |
------ | ------ |
`id` | string |
`keyForID?` | undefined \| string |

**Returns:** *void*

___

###  size

▸ **size**(): *number*

*Defined in [queue.ts:158](https://github.com/terascope/teraslice/blob/0ae31df4/packages/queue/src/queue.ts#L158)*

Get the length of the queue

**Returns:** *number*

___

###  unshift

▸ **unshift**(`value`: T): *void*

*Defined in [queue.ts:18](https://github.com/terascope/teraslice/blob/0ae31df4/packages/queue/src/queue.ts#L18)*

**Parameters:**

Name | Type |
------ | ------ |
`value` | T |

**Returns:** *void*
