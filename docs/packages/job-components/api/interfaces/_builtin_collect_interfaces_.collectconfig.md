---
title: Job Components Builtin Collect Interfaces Collectconfig
sidebar_label: Builtin Collect Interfaces Collectconfig
---

> Builtin Collect Interfaces Collectconfig for @terascope/job-components

[Globals](../overview.md) / ["builtin/collect/interfaces"](../modules/_builtin_collect_interfaces_.md) / [CollectConfig](_builtin_collect_interfaces_.collectconfig.md) /

# Interface: CollectConfig

## Hierarchy

* [OpConfig](_interfaces_jobs_.opconfig.md)

  * **CollectConfig**

## Indexable

● \[▪ **prop**: *string*\]: any

### Index

#### Properties

* [_dead_letter_action](_builtin_collect_interfaces_.collectconfig.md#optional-_dead_letter_action)
* [_encoding](_builtin_collect_interfaces_.collectconfig.md#optional-_encoding)
* [_op](_builtin_collect_interfaces_.collectconfig.md#_op)
* [size](_builtin_collect_interfaces_.collectconfig.md#size)
* [wait](_builtin_collect_interfaces_.collectconfig.md#wait)

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

###  size

• **size**: *number*

*Defined in [builtin/collect/interfaces.ts:5](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/builtin/collect/interfaces.ts#L5)*

___

###  wait

• **wait**: *number*

*Defined in [builtin/collect/interfaces.ts:4](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/builtin/collect/interfaces.ts#L4)*
