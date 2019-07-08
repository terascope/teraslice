---
title: Job Components: `CollectConfig`
sidebar_label: CollectConfig
---

# Interface: CollectConfig

## Hierarchy

* [OpConfig](opconfig.md)

  * **CollectConfig**

## Indexable

● \[▪ **prop**: *string*\]: any

### Index

#### Properties

* [_dead_letter_action](collectconfig.md#optional-_dead_letter_action)
* [_encoding](collectconfig.md#optional-_encoding)
* [_op](collectconfig.md#_op)
* [size](collectconfig.md#size)
* [wait](collectconfig.md#wait)

## Properties

### `Optional` _dead_letter_action

• **_dead_letter_action**? : *[DeadLetterAction](../overview.md#deadletteraction)*

*Inherited from [OpConfig](opconfig.md).[_dead_letter_action](opconfig.md#optional-_dead_letter_action)*

*Defined in [interfaces/jobs.ts:25](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/job-components/src/interfaces/jobs.ts#L25)*

This action will specify what to do when failing to parse or transform a record. ​​​​​
​​​​​     * The following builtin actions are supported: ​​​
​​​​​     *  - "throw": throw the original error ​​​​​
​​​​​     *  - "log": log the error and the data ​​​​​
​​​​​     *  - "none": (default) skip the error entirely

​​     * If none of the actions are specified it will try and use a registered Dead Letter Queue API under that name.
The API must be already be created by a operation before it can used.​

___

### `Optional` _encoding

• **_encoding**? : *`DataEncoding`*

*Inherited from [OpConfig](opconfig.md).[_encoding](opconfig.md#optional-_encoding)*

*Defined in [interfaces/jobs.ts:14](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/job-components/src/interfaces/jobs.ts#L14)*

Used for specifying the data encoding type when using `DataEntity.fromBuffer`. Defaults to `json`.

___

###  _op

• **_op**: *string*

*Inherited from [OpConfig](opconfig.md).[_op](opconfig.md#_op)*

*Defined in [interfaces/jobs.ts:11](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/job-components/src/interfaces/jobs.ts#L11)*

The name of the operation

___

###  size

• **size**: *number*

*Defined in [builtin/collect/interfaces.ts:5](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/job-components/src/builtin/collect/interfaces.ts#L5)*

___

###  wait

• **wait**: *number*

*Defined in [builtin/collect/interfaces.ts:4](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/job-components/src/builtin/collect/interfaces.ts#L4)*

