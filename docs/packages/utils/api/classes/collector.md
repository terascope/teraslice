---
title: Utils :: Collector
sidebar_label: Collector
---

# Class: Collector <**T**>

An in-memory record collector,
useful for batch data to a certain
size or after a certain amount of time has passed.

NOTE: Records are store in an immutable array to
be more memory efficient.

## Type parameters

▪ **T**

## Hierarchy

* **Collector**

### Index

#### Constructors

* [constructor](collector.md#constructor)

#### Properties

* [size](collector.md#size)
* [wait](collector.md#wait)

#### Accessors

* [length](collector.md#length)
* [queue](collector.md#queue)

#### Methods

* [add](collector.md#add)
* [flushAll](collector.md#flushall)
* [getBatch](collector.md#getbatch)

## Constructors

###  constructor

\+ **new Collector**(`max`: *object*): *[Collector](collector.md)*

*Defined in [collector.ts:18](https://github.com/terascope/teraslice/blob/e7b0edd3/packages/utils/src/collector.ts#L18)*

**Parameters:**

Name | Type |
------ | ------ |
`max` | object |

**Returns:** *[Collector](collector.md)*

## Properties

###  size

• **size**: *number*

*Defined in [collector.ts:13](https://github.com/terascope/teraslice/blob/e7b0edd3/packages/utils/src/collector.ts#L13)*

the maximum wait time to collect the batch

___

###  wait

• **wait**: *number*

*Defined in [collector.ts:15](https://github.com/terascope/teraslice/blob/e7b0edd3/packages/utils/src/collector.ts#L15)*

the maximum batch size of the batch

## Accessors

###  length

• **get length**(): *number*

*Defined in [collector.ts:28](https://github.com/terascope/teraslice/blob/e7b0edd3/packages/utils/src/collector.ts#L28)*

Get the current Queue Length

**Returns:** *number*

___

###  queue

• **get queue**(): *`T`[]*

*Defined in [collector.ts:35](https://github.com/terascope/teraslice/blob/e7b0edd3/packages/utils/src/collector.ts#L35)*

Get the current queue

**Returns:** *`T`[]*

## Methods

###  add

▸ **add**(`record`: *`T`*): *void*

*Defined in [collector.ts:42](https://github.com/terascope/teraslice/blob/e7b0edd3/packages/utils/src/collector.ts#L42)*

Add a record, or records, to the in-memory queue.

**Parameters:**

Name | Type |
------ | ------ |
`record` | `T` |

**Returns:** *void*

▸ **add**(`records`: *`T`[]*): *void*

*Defined in [collector.ts:43](https://github.com/terascope/teraslice/blob/e7b0edd3/packages/utils/src/collector.ts#L43)*

**Parameters:**

Name | Type |
------ | ------ |
`records` | `T`[] |

**Returns:** *void*

___

###  flushAll

▸ **flushAll**(): *`T`[]*

*Defined in [collector.ts:77](https://github.com/terascope/teraslice/blob/e7b0edd3/packages/utils/src/collector.ts#L77)*

Flush all of the records in the queue.

**NOTE:** This can potentially return more records than
specified than the max size.

**Returns:** *`T`[]*

___

###  getBatch

▸ **getBatch**(): *`T`[] | null*

*Defined in [collector.ts:59](https://github.com/terascope/teraslice/blob/e7b0edd3/packages/utils/src/collector.ts#L59)*

Get the batch of data if it is full or has exceeded the time threshold.

**Returns:** *`T`[] | null*

null if the batch isn't ready
