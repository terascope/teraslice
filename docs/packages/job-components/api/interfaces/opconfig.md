---
title: Job Components Opconfig
sidebar_label: Opconfig
---

[OpConfig](opconfig.md) /

# Interface: OpConfig

OpConfig is the configuration that user specifies
for a Operation.
The only required property is `_op` since that is used
to find the operation.

## Hierarchy

* **OpConfig**

  * [CollectConfig](collectconfig.md)

  * [DelayConfig](delayconfig.md)

  * [TestReaderConfig](testreaderconfig.md)

## Indexable

● \[▪ **prop**: *string*\]: any

OpConfig is the configuration that user specifies
for a Operation.
The only required property is `_op` since that is used
to find the operation.

### Index

#### Properties

* [_dead_letter_action](opconfig.md#optional-_dead_letter_action)
* [_encoding](opconfig.md#optional-_encoding)
* [_op](opconfig.md#_op)

## Properties

### `Optional` _dead_letter_action

• **_dead_letter_action**? : *[DeadLetterAction](../overview.md#deadletteraction)*

*Defined in [src/interfaces/jobs.ts:25](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/interfaces/jobs.ts#L25)*

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

*Defined in [src/interfaces/jobs.ts:14](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/interfaces/jobs.ts#L14)*

Used for specifying the data encoding type when using `DataEntity.fromBuffer`. Defaults to `json`.

___

###  _op

• **_op**: *string*

*Defined in [src/interfaces/jobs.ts:11](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/interfaces/jobs.ts#L11)*

The name of the operation
