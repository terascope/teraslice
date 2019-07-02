---
title: Job Components Builtin Test Reader Slicer Testslicer
sidebar_label: Builtin Test Reader Slicer Testslicer
---

> Builtin Test Reader Slicer Testslicer for @terascope/job-components

[Globals](../overview.md) / ["builtin/test-reader/slicer"](../modules/_builtin_test_reader_slicer_.md) / [TestSlicer](_builtin_test_reader_slicer_.testslicer.md) /

# Class: TestSlicer

## Hierarchy

  * [Slicer](_operations_slicer_.slicer.md)‹*[TestReaderConfig](../interfaces/_builtin_test_reader_interfaces_.testreaderconfig.md)*›

  * **TestSlicer**

## Implements

* [OperationLifeCycle](../interfaces/_interfaces_operation_lifecycle_.operationlifecycle.md)
* [SlicerOperationLifeCycle](../interfaces/_interfaces_operation_lifecycle_.sliceroperationlifecycle.md)

### Index

#### Constructors

* [constructor](_builtin_test_reader_slicer_.testslicer.md#constructor)

#### Properties

* [context](_builtin_test_reader_slicer_.testslicer.md#context)
* [events](_builtin_test_reader_slicer_.testslicer.md#events)
* [executionConfig](_builtin_test_reader_slicer_.testslicer.md#executionconfig)
* [isFinished](_builtin_test_reader_slicer_.testslicer.md#isfinished)
* [logger](_builtin_test_reader_slicer_.testslicer.md#logger)
* [opConfig](_builtin_test_reader_slicer_.testslicer.md#protected-opconfig)
* [order](_builtin_test_reader_slicer_.testslicer.md#private-order)
* [position](_builtin_test_reader_slicer_.testslicer.md#position)
* [recoveryData](_builtin_test_reader_slicer_.testslicer.md#protected-recoverydata)
* [requests](_builtin_test_reader_slicer_.testslicer.md#requests)
* [stats](_builtin_test_reader_slicer_.testslicer.md#protected-stats)

#### Accessors

* [workersConnected](_builtin_test_reader_slicer_.testslicer.md#protected-workersconnected)

#### Methods

* [canComplete](_builtin_test_reader_slicer_.testslicer.md#protected-cancomplete)
* [createSlice](_builtin_test_reader_slicer_.testslicer.md#createslice)
* [getSlice](_builtin_test_reader_slicer_.testslicer.md#getslice)
* [getSlices](_builtin_test_reader_slicer_.testslicer.md#getslices)
* [handle](_builtin_test_reader_slicer_.testslicer.md#handle)
* [initialize](_builtin_test_reader_slicer_.testslicer.md#initialize)
* [isRecoverable](_builtin_test_reader_slicer_.testslicer.md#isrecoverable)
* [maxQueueLength](_builtin_test_reader_slicer_.testslicer.md#maxqueuelength)
* [onExecutionStats](_builtin_test_reader_slicer_.testslicer.md#onexecutionstats)
* [shutdown](_builtin_test_reader_slicer_.testslicer.md#shutdown)
* [slice](_builtin_test_reader_slicer_.testslicer.md#slice)
* [sliceCount](_builtin_test_reader_slicer_.testslicer.md#slicecount)
* [slicers](_builtin_test_reader_slicer_.testslicer.md#slicers)

## Constructors

###  constructor

\+ **new TestSlicer**(`context`: *[WorkerContext](../interfaces/_interfaces_context_.workercontext.md)*, `opConfig`: *[OpConfig](../interfaces/_interfaces_jobs_.opconfig.md) & [TestReaderConfig](../interfaces/_builtin_test_reader_interfaces_.testreaderconfig.md)*, `executionConfig`: *[ExecutionConfig](../interfaces/_interfaces_jobs_.executionconfig.md)*): *[TestSlicer](_builtin_test_reader_slicer_.testslicer.md)*

*Inherited from [SlicerCore](_operations_core_slicer_core_.slicercore.md).[constructor](_operations_core_slicer_core_.slicercore.md#constructor)*

*Overrides [Core](_operations_core_core_.core.md).[constructor](_operations_core_core_.core.md#constructor)*

*Defined in [operations/core/slicer-core.ts:26](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/slicer-core.ts#L26)*

**Parameters:**

Name | Type |
------ | ------ |
`context` | [WorkerContext](../interfaces/_interfaces_context_.workercontext.md) |
`opConfig` | [OpConfig](../interfaces/_interfaces_jobs_.opconfig.md) & [TestReaderConfig](../interfaces/_builtin_test_reader_interfaces_.testreaderconfig.md) |
`executionConfig` | [ExecutionConfig](../interfaces/_interfaces_jobs_.executionconfig.md) |

**Returns:** *[TestSlicer](_builtin_test_reader_slicer_.testslicer.md)*

## Properties

###  context

• **context**: *`Readonly<WorkerContext>`*

*Inherited from [Core](_operations_core_core_.core.md).[context](_operations_core_core_.core.md#context)*

*Defined in [operations/core/core.ts:10](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/core.ts#L10)*

___

###  events

• **events**: *`EventEmitter`*

*Inherited from [Core](_operations_core_core_.core.md).[events](_operations_core_core_.core.md#events)*

*Defined in [operations/core/core.ts:13](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/core.ts#L13)*

___

###  executionConfig

• **executionConfig**: *`Readonly<ExecutionConfig>`*

*Inherited from [Core](_operations_core_core_.core.md).[executionConfig](_operations_core_core_.core.md#executionconfig)*

*Defined in [operations/core/core.ts:11](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/core.ts#L11)*

___

###  isFinished

• **isFinished**: *boolean* = false

*Inherited from [Slicer](_operations_slicer_.slicer.md).[isFinished](_operations_slicer_.slicer.md#isfinished)*

*Defined in [operations/slicer.ts:15](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/slicer.ts#L15)*

___

###  logger

• **logger**: *`Logger`*

*Inherited from [Core](_operations_core_core_.core.md).[logger](_operations_core_core_.core.md#logger)*

*Defined in [operations/core/core.ts:12](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/core.ts#L12)*

___

### `Protected` opConfig

• **opConfig**: *`Readonly<OpConfig & TestReaderConfig>`*

*Inherited from [SlicerCore](_operations_core_slicer_core_.slicercore.md).[opConfig](_operations_core_slicer_core_.slicercore.md#protected-opconfig)*

*Defined in [operations/core/slicer-core.ts:25](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/slicer-core.ts#L25)*

___

### `Private` order

• **order**: *number* = 0

*Inherited from [Slicer](_operations_slicer_.slicer.md).[order](_operations_slicer_.slicer.md#private-order)*

*Defined in [operations/slicer.ts:13](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/slicer.ts#L13)*

___

###  position

• **position**: *number* = 0

*Defined in [builtin/test-reader/slicer.ts:11](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/builtin/test-reader/slicer.ts#L11)*

___

### `Protected` recoveryData

• **recoveryData**: *object[]*

*Inherited from [SlicerCore](_operations_core_slicer_core_.slicercore.md).[recoveryData](_operations_core_slicer_core_.slicercore.md#protected-recoverydata)*

*Defined in [operations/core/slicer-core.ts:24](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/slicer-core.ts#L24)*

___

###  requests

• **requests**: *object[]* =  []

*Defined in [builtin/test-reader/slicer.ts:10](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/builtin/test-reader/slicer.ts#L10)*

___

### `Protected` stats

• **stats**: *[ExecutionStats](../interfaces/_interfaces_operations_.executionstats.md)*

*Inherited from [SlicerCore](_operations_core_slicer_core_.slicercore.md).[stats](_operations_core_slicer_core_.slicercore.md#protected-stats)*

*Defined in [operations/core/slicer-core.ts:23](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/slicer-core.ts#L23)*

## Accessors

### `Protected` workersConnected

• **get workersConnected**(): *number*

*Inherited from [SlicerCore](_operations_core_slicer_core_.slicercore.md).[workersConnected](_operations_core_slicer_core_.slicercore.md#protected-workersconnected)*

*Defined in [operations/core/slicer-core.ts:156](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/slicer-core.ts#L156)*

**Returns:** *number*

## Methods

### `Protected` canComplete

▸ **canComplete**(): *boolean*

*Inherited from [SlicerCore](_operations_core_slicer_core_.slicercore.md).[canComplete](_operations_core_slicer_core_.slicercore.md#protected-cancomplete)*

*Defined in [operations/core/slicer-core.ts:152](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/slicer-core.ts#L152)*

**Returns:** *boolean*

___

###  createSlice

▸ **createSlice**(`input`: *[Slice](../interfaces/_interfaces_operations_.slice.md) | [SliceRequest](../interfaces/_interfaces_operations_.slicerequest.md)*, `order`: *number*, `id`: *number*): *void*

*Inherited from [SlicerCore](_operations_core_slicer_core_.slicercore.md).[createSlice](_operations_core_slicer_core_.slicercore.md#createslice)*

*Defined in [operations/core/slicer-core.ts:84](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/slicer-core.ts#L84)*

Create a Slice object from a slice request.
In the case of recovery the "Slice" already has the required
This will be enqueued and dequeued by the "Execution Controller"

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`input` | [Slice](../interfaces/_interfaces_operations_.slice.md) \| [SliceRequest](../interfaces/_interfaces_operations_.slicerequest.md) | - |
`order` | number | - |
`id` | number | 0 |

**Returns:** *void*

___

###  getSlice

▸ **getSlice**(): *[Slice](../interfaces/_interfaces_operations_.slice.md) | null*

*Inherited from [SlicerCore](_operations_core_slicer_core_.slicercore.md).[getSlice](_operations_core_slicer_core_.slicercore.md#getslice)*

*Defined in [operations/core/slicer-core.ts:101](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/slicer-core.ts#L101)*

A method called by the "Execution Controller" to dequeue a created "Slice"

**Returns:** *[Slice](../interfaces/_interfaces_operations_.slice.md) | null*

___

###  getSlices

▸ **getSlices**(`max`: *number*): *[Slice](../interfaces/_interfaces_operations_.slice.md)[]*

*Inherited from [SlicerCore](_operations_core_slicer_core_.slicercore.md).[getSlices](_operations_core_slicer_core_.slicercore.md#getslices)*

*Defined in [operations/core/slicer-core.ts:109](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/slicer-core.ts#L109)*

A method called by the "Execution Controller" to dequeue many created slices

**Parameters:**

Name | Type |
------ | ------ |
`max` | number |

**Returns:** *[Slice](../interfaces/_interfaces_operations_.slice.md)[]*

___

###  handle

▸ **handle**(): *`Promise<boolean>`*

*Inherited from [Slicer](_operations_slicer_.slicer.md).[handle](_operations_slicer_.slicer.md#handle)*

*Overrides [SlicerCore](_operations_core_slicer_core_.slicercore.md).[handle](_operations_core_slicer_core_.slicercore.md#abstract-handle)*

*Defined in [operations/slicer.ts:27](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/slicer.ts#L27)*

**Returns:** *`Promise<boolean>`*

___

###  initialize

▸ **initialize**(`recoveryData`: *object[]*): *`Promise<void>`*

*Implementation of [SlicerOperationLifeCycle](../interfaces/_interfaces_operation_lifecycle_.sliceroperationlifecycle.md)*

*Overrides [SlicerCore](_operations_core_slicer_core_.slicercore.md).[initialize](_operations_core_slicer_core_.slicercore.md#initialize)*

*Defined in [builtin/test-reader/slicer.ts:13](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/builtin/test-reader/slicer.ts#L13)*

**Parameters:**

Name | Type |
------ | ------ |
`recoveryData` | object[] |

**Returns:** *`Promise<void>`*

___

###  isRecoverable

▸ **isRecoverable**(): *boolean*

*Inherited from [SlicerCore](_operations_core_slicer_core_.slicercore.md).[isRecoverable](_operations_core_slicer_core_.slicercore.md#isrecoverable)*

*Defined in [operations/core/slicer-core.ts:134](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/slicer-core.ts#L134)*

Used to indicate whether this slicer is recoverable.

**Returns:** *boolean*

___

###  maxQueueLength

▸ **maxQueueLength**(): *number*

*Inherited from [SlicerCore](_operations_core_slicer_core_.slicercore.md).[maxQueueLength](_operations_core_slicer_core_.slicercore.md#maxqueuelength)*

*Defined in [operations/core/slicer-core.ts:144](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/slicer-core.ts#L144)*

Used to determine the maximum number of slices queued.
Defaults to 10000
NOTE: if you want to base of the number of
workers use {@link #workersConnected}

**Returns:** *number*

___

###  onExecutionStats

▸ **onExecutionStats**(`stats`: *[ExecutionStats](../interfaces/_interfaces_operations_.executionstats.md)*): *void*

*Implementation of [SlicerOperationLifeCycle](../interfaces/_interfaces_operation_lifecycle_.sliceroperationlifecycle.md)*

*Inherited from [SlicerCore](_operations_core_slicer_core_.slicercore.md).[onExecutionStats](_operations_core_slicer_core_.slicercore.md#onexecutionstats)*

*Defined in [operations/core/slicer-core.ts:148](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/slicer-core.ts#L148)*

**Parameters:**

Name | Type |
------ | ------ |
`stats` | [ExecutionStats](../interfaces/_interfaces_operations_.executionstats.md) |

**Returns:** *void*

___

###  shutdown

▸ **shutdown**(): *`Promise<void>`*

*Implementation of [SlicerOperationLifeCycle](../interfaces/_interfaces_operation_lifecycle_.sliceroperationlifecycle.md)*

*Overrides [SlicerCore](_operations_core_slicer_core_.slicercore.md).[shutdown](_operations_core_slicer_core_.slicercore.md#shutdown)*

*Defined in [builtin/test-reader/slicer.ts:29](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/builtin/test-reader/slicer.ts#L29)*

**Returns:** *`Promise<void>`*

___

###  slice

▸ **slice**(): *`Promise<null | object>`*

*Overrides [Slicer](_operations_slicer_.slicer.md).[slice](_operations_slicer_.slicer.md#abstract-slice)*

*Defined in [builtin/test-reader/slicer.ts:34](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/builtin/test-reader/slicer.ts#L34)*

**Returns:** *`Promise<null | object>`*

___

###  sliceCount

▸ **sliceCount**(): *number*

*Inherited from [SlicerCore](_operations_core_slicer_core_.slicercore.md).[sliceCount](_operations_core_slicer_core_.slicercore.md#slicecount)*

*Defined in [operations/core/slicer-core.ts:127](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/slicer-core.ts#L127)*

The number of enqueued slices

**Returns:** *number*

___

###  slicers

▸ **slicers**(): *number*

*Inherited from [Slicer](_operations_slicer_.slicer.md).[slicers](_operations_slicer_.slicer.md#slicers)*

*Overrides [SlicerCore](_operations_core_slicer_core_.slicercore.md).[slicers](_operations_core_slicer_core_.slicercore.md#abstract-slicers)*

*Defined in [operations/slicer.ts:23](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/slicer.ts#L23)*

**Returns:** *number*
