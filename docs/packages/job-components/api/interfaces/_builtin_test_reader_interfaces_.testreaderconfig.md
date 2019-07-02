---
title: Job Components Builtin Test Reader Interfaces Testreaderconfig
sidebar_label: Builtin Test Reader Interfaces Testreaderconfig
---

> Builtin Test Reader Interfaces Testreaderconfig for @terascope/job-components

[Globals](../overview.md) / ["builtin/test-reader/interfaces"](../modules/_builtin_test_reader_interfaces_.md) / [TestReaderConfig](_builtin_test_reader_interfaces_.testreaderconfig.md) /

# Interface: TestReaderConfig

## Hierarchy

* [OpConfig](_interfaces_jobs_.opconfig.md)

  * **TestReaderConfig**

## Indexable

● \[▪ **prop**: *string*\]: any

### Index

#### Properties

* [_dead_letter_action](_builtin_test_reader_interfaces_.testreaderconfig.md#optional-_dead_letter_action)
* [_encoding](_builtin_test_reader_interfaces_.testreaderconfig.md#optional-_encoding)
* [_op](_builtin_test_reader_interfaces_.testreaderconfig.md#_op)
* [fetcher_data_file_path](_builtin_test_reader_interfaces_.testreaderconfig.md#optional-fetcher_data_file_path)
* [passthrough_slice](_builtin_test_reader_interfaces_.testreaderconfig.md#optional-passthrough_slice)
* [slicer_data_file_path](_builtin_test_reader_interfaces_.testreaderconfig.md#optional-slicer_data_file_path)

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

### `Optional` fetcher_data_file_path

• **fetcher_data_file_path**? : *undefined | string*

*Defined in [builtin/test-reader/interfaces.ts:4](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/builtin/test-reader/interfaces.ts#L4)*

___

### `Optional` passthrough_slice

• **passthrough_slice**? : *undefined | false | true*

*Defined in [builtin/test-reader/interfaces.ts:6](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/builtin/test-reader/interfaces.ts#L6)*

___

### `Optional` slicer_data_file_path

• **slicer_data_file_path**? : *undefined | string*

*Defined in [builtin/test-reader/interfaces.ts:5](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/builtin/test-reader/interfaces.ts#L5)*
