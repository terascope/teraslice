---
title: Job Components: `DelayConfig`
sidebar_label: DelayConfig
---

# Interface: DelayConfig

## Hierarchy

* [OpConfig](opconfig.md)

  * **DelayConfig**

## Indexable

● \[▪ **prop**: *string*\]: any

### Index

#### Properties

* [_dead_letter_action](delayconfig.md#optional-_dead_letter_action)
* [_encoding](delayconfig.md#optional-_encoding)
* [_op](delayconfig.md#_op)
* [ms](delayconfig.md#ms)

## Properties

### `Optional` _dead_letter_action

• **_dead_letter_action**? : *[DeadLetterAction](../overview.md#deadletteraction)*

*Inherited from [OpConfig](opconfig.md).[_dead_letter_action](opconfig.md#optional-_dead_letter_action)*

*Defined in [interfaces/jobs.ts:25](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/job-components/src/interfaces/jobs.ts#L25)*

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

*Defined in [interfaces/jobs.ts:14](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/job-components/src/interfaces/jobs.ts#L14)*

Used for specifying the data encoding type when using `DataEntity.fromBuffer`. Defaults to `json`.

___

###  _op

• **_op**: *string*

*Inherited from [OpConfig](opconfig.md).[_op](opconfig.md#_op)*

*Defined in [interfaces/jobs.ts:11](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/job-components/src/interfaces/jobs.ts#L11)*

The name of the operation

___

###  ms

• **ms**: *number*

*Defined in [builtin/delay/interfaces.ts:4](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/job-components/src/builtin/delay/interfaces.ts#L4)*
