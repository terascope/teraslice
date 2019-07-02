---
title: Job Components Builtin Delay Interfaces Delayconfig
sidebar_label: Builtin Delay Interfaces Delayconfig
---

> Builtin Delay Interfaces Delayconfig for @terascope/job-components

[Globals](../overview.md) / ["builtin/delay/interfaces"](../modules/_builtin_delay_interfaces_.md) / [DelayConfig](_builtin_delay_interfaces_.delayconfig.md) /

# Interface: DelayConfig

## Hierarchy

* [OpConfig](_interfaces_jobs_.opconfig.md)

  * **DelayConfig**

## Indexable

● \[▪ **prop**: *string*\]: any

### Index

#### Properties

* [_dead_letter_action](_builtin_delay_interfaces_.delayconfig.md#optional-_dead_letter_action)
* [_encoding](_builtin_delay_interfaces_.delayconfig.md#optional-_encoding)
* [_op](_builtin_delay_interfaces_.delayconfig.md#_op)
* [ms](_builtin_delay_interfaces_.delayconfig.md#ms)

## Properties

### `Optional` _dead_letter_action

• **_dead_letter_action**? : *[DeadLetterAction](../modules/_interfaces_jobs_.md#deadletteraction)*

*Inherited from [OpConfig](_interfaces_jobs_.opconfig.md).[_dead_letter_action](_interfaces_jobs_.opconfig.md#optional-_dead_letter_action)*

*Defined in [interfaces/jobs.ts:25](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/jobs.ts#L25)*

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

*Inherited from [OpConfig](_interfaces_jobs_.opconfig.md).[_encoding](_interfaces_jobs_.opconfig.md#optional-_encoding)*

*Defined in [interfaces/jobs.ts:14](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/jobs.ts#L14)*

Used for specifying the data encoding type when using `DataEntity.fromBuffer`. Defaults to `json`.

___

###  _op

• **_op**: *string*

*Inherited from [OpConfig](_interfaces_jobs_.opconfig.md).[_op](_interfaces_jobs_.opconfig.md#_op)*

*Defined in [interfaces/jobs.ts:11](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/jobs.ts#L11)*

The name of the operation

___

###  ms

• **ms**: *number*

*Defined in [builtin/delay/interfaces.ts:4](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/builtin/delay/interfaces.ts#L4)*
