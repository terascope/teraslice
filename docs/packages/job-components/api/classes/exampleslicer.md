---
title: Job Components Exampleslicer
sidebar_label: Exampleslicer
---

[ExampleSlicer](exampleslicer.md) /

# Class: ExampleSlicer <**T**>

## Type parameters

▪ **T**

## Hierarchy

  * [Slicer](slicer.md)

  * **ExampleSlicer**

## Implements

* [OperationLifeCycle](../interfaces/operationlifecycle.md)
* [SlicerOperationLifeCycle](../interfaces/sliceroperationlifecycle.md)

### Index

#### Constructors

* [constructor](exampleslicer.md#constructor)

#### Properties

* [_initialized](exampleslicer.md#_initialized)
* [_shutdown](exampleslicer.md#_shutdown)
* [context](exampleslicer.md#context)
* [events](exampleslicer.md#events)
* [executionConfig](exampleslicer.md#executionconfig)
* [isFinished](exampleslicer.md#isfinished)
* [logger](exampleslicer.md#logger)
* [opConfig](exampleslicer.md#protected-opconfig)
* [order](exampleslicer.md#private-order)
* [recoveryData](exampleslicer.md#protected-recoverydata)
* [stats](exampleslicer.md#protected-stats)

#### Accessors

* [workersConnected](exampleslicer.md#protected-workersconnected)

#### Methods

* [canComplete](exampleslicer.md#protected-cancomplete)
* [createSlice](exampleslicer.md#createslice)
* [getSlice](exampleslicer.md#getslice)
* [getSlices](exampleslicer.md#getslices)
* [handle](exampleslicer.md#handle)
* [initialize](exampleslicer.md#initialize)
* [isRecoverable](exampleslicer.md#isrecoverable)
* [maxQueueLength](exampleslicer.md#maxqueuelength)
* [onExecutionStats](exampleslicer.md#onexecutionstats)
* [shutdown](exampleslicer.md#shutdown)
* [slice](exampleslicer.md#slice)
* [sliceCount](exampleslicer.md#slicecount)
* [slicers](exampleslicer.md#slicers)

## Constructors

###  constructor

\+ **new ExampleSlicer**(`context`: *[WorkerContext](../interfaces/workercontext.md)*, `opConfig`: *[OpConfig](../interfaces/opconfig.md) & `T`*, `executionConfig`: *[ExecutionConfig](../interfaces/executionconfig.md)*): *[ExampleSlicer](exampleslicer.md)*

*Inherited from [SlicerCore](slicercore.md).[constructor](slicercore.md#constructor)*

*Overrides [Core](core.md).[constructor](core.md#constructor)*

*Defined in [src/operations/core/slicer-core.ts:26](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/operations/core/slicer-core.ts#L26)*

**Parameters:**

Name | Type |
------ | ------ |
`context` | [WorkerContext](../interfaces/workercontext.md) |
`opConfig` | [OpConfig](../interfaces/opconfig.md) & `T` |
`executionConfig` | [ExecutionConfig](../interfaces/executionconfig.md) |

**Returns:** *[ExampleSlicer](exampleslicer.md)*

## Properties

###  _initialized

• **_initialized**: *boolean* = false

*Defined in [test/fixtures/example-reader/slicer.ts:5](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/test/fixtures/example-reader/slicer.ts#L5)*

___

###  _shutdown

• **_shutdown**: *boolean* = false

*Defined in [test/fixtures/example-reader/slicer.ts:6](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/test/fixtures/example-reader/slicer.ts#L6)*

___

###  context

• **context**: *`Readonly<WorkerContext>`*

*Inherited from [Core](core.md).[context](core.md#context)*

*Defined in [src/operations/core/core.ts:10](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/operations/core/core.ts#L10)*

___

###  events

• **events**: *`EventEmitter`*

*Inherited from [Core](core.md).[events](core.md#events)*

*Defined in [src/operations/core/core.ts:13](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/operations/core/core.ts#L13)*

___

###  executionConfig

• **executionConfig**: *`Readonly<ExecutionConfig>`*

*Inherited from [Core](core.md).[executionConfig](core.md#executionconfig)*

*Defined in [src/operations/core/core.ts:11](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/operations/core/core.ts#L11)*

___

###  isFinished

• **isFinished**: *boolean* = false

*Inherited from [Slicer](slicer.md).[isFinished](slicer.md#isfinished)*

*Defined in [src/operations/slicer.ts:15](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/operations/slicer.ts#L15)*

___

###  logger

• **logger**: *`Logger`*

*Inherited from [Core](core.md).[logger](core.md#logger)*

*Defined in [src/operations/core/core.ts:12](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/operations/core/core.ts#L12)*

___

### `Protected` opConfig

• **opConfig**: *`Readonly<OpConfig & T>`*

*Inherited from [SlicerCore](slicercore.md).[opConfig](slicercore.md#protected-opconfig)*

*Defined in [src/operations/core/slicer-core.ts:25](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/operations/core/slicer-core.ts#L25)*

___

### `Private` order

• **order**: *number* = 0

*Inherited from [Slicer](slicer.md).[order](slicer.md#private-order)*

*Defined in [src/operations/slicer.ts:13](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/operations/slicer.ts#L13)*

___

### `Protected` recoveryData

• **recoveryData**: *object[]*

*Inherited from [SlicerCore](slicercore.md).[recoveryData](slicercore.md#protected-recoverydata)*

*Defined in [src/operations/core/slicer-core.ts:24](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/operations/core/slicer-core.ts#L24)*

___

### `Protected` stats

• **stats**: *[ExecutionStats](../interfaces/executionstats.md)*

*Inherited from [SlicerCore](slicercore.md).[stats](slicercore.md#protected-stats)*

*Defined in [src/operations/core/slicer-core.ts:23](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/operations/core/slicer-core.ts#L23)*

## Accessors

### `Protected` workersConnected

• **get workersConnected**(): *number*

*Inherited from [SlicerCore](slicercore.md).[workersConnected](slicercore.md#protected-workersconnected)*

*Defined in [src/operations/core/slicer-core.ts:156](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/operations/core/slicer-core.ts#L156)*

**Returns:** *number*

## Methods

### `Protected` canComplete

▸ **canComplete**(): *boolean*

*Inherited from [SlicerCore](slicercore.md).[canComplete](slicercore.md#protected-cancomplete)*

*Defined in [src/operations/core/slicer-core.ts:152](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/operations/core/slicer-core.ts#L152)*

**Returns:** *boolean*

___

###  createSlice

▸ **createSlice**(`input`: *[Slice](../interfaces/slice.md) | [SliceRequest](../interfaces/slicerequest.md)*, `order`: *number*, `id`: *number*): *void*

*Inherited from [SlicerCore](slicercore.md).[createSlice](slicercore.md#createslice)*

*Defined in [src/operations/core/slicer-core.ts:84](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/operations/core/slicer-core.ts#L84)*

Create a Slice object from a slice request.
In the case of recovery the "Slice" already has the required
This will be enqueued and dequeued by the "Execution Controller"

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`input` | [Slice](../interfaces/slice.md) \| [SliceRequest](../interfaces/slicerequest.md) | - |
`order` | number | - |
`id` | number | 0 |

**Returns:** *void*

___

###  getSlice

▸ **getSlice**(): *[Slice](../interfaces/slice.md) | null*

*Inherited from [SlicerCore](slicercore.md).[getSlice](slicercore.md#getslice)*

*Defined in [src/operations/core/slicer-core.ts:101](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/operations/core/slicer-core.ts#L101)*

A method called by the "Execution Controller" to dequeue a created "Slice"

**Returns:** *[Slice](../interfaces/slice.md) | null*

___

###  getSlices

▸ **getSlices**(`max`: *number*): *[Slice](../interfaces/slice.md)[]*

*Inherited from [SlicerCore](slicercore.md).[getSlices](slicercore.md#getslices)*

*Defined in [src/operations/core/slicer-core.ts:109](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/operations/core/slicer-core.ts#L109)*

A method called by the "Execution Controller" to dequeue many created slices

**Parameters:**

Name | Type |
------ | ------ |
`max` | number |

**Returns:** *[Slice](../interfaces/slice.md)[]*

___

###  handle

▸ **handle**(): *`Promise<boolean>`*

*Inherited from [Slicer](slicer.md).[handle](slicer.md#handle)*

*Overrides [SlicerCore](slicercore.md).[handle](slicercore.md#abstract-handle)*

*Defined in [src/operations/slicer.ts:27](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/operations/slicer.ts#L27)*

**Returns:** *`Promise<boolean>`*

___

###  initialize

▸ **initialize**(`recoveryData`: *object[]*): *`Promise<void>`*

*Implementation of [SlicerOperationLifeCycle](../interfaces/sliceroperationlifecycle.md)*

*Overrides [SlicerCore](slicercore.md).[initialize](slicercore.md#initialize)*

*Defined in [test/fixtures/example-reader/slicer.ts:8](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/test/fixtures/example-reader/slicer.ts#L8)*

**Parameters:**

Name | Type |
------ | ------ |
`recoveryData` | object[] |

**Returns:** *`Promise<void>`*

___

###  isRecoverable

▸ **isRecoverable**(): *boolean*

*Inherited from [SlicerCore](slicercore.md).[isRecoverable](slicercore.md#isrecoverable)*

*Defined in [src/operations/core/slicer-core.ts:134](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/operations/core/slicer-core.ts#L134)*

Used to indicate whether this slicer is recoverable.

**Returns:** *boolean*

___

###  maxQueueLength

▸ **maxQueueLength**(): *number*

*Inherited from [SlicerCore](slicercore.md).[maxQueueLength](slicercore.md#maxqueuelength)*

*Defined in [src/operations/core/slicer-core.ts:144](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/operations/core/slicer-core.ts#L144)*

Used to determine the maximum number of slices queued.
Defaults to 10000
NOTE: if you want to base of the number of
workers use {@link #workersConnected}

**Returns:** *number*

___

###  onExecutionStats

▸ **onExecutionStats**(`stats`: *[ExecutionStats](../interfaces/executionstats.md)*): *void*

*Implementation of [SlicerOperationLifeCycle](../interfaces/sliceroperationlifecycle.md)*

*Inherited from [SlicerCore](slicercore.md).[onExecutionStats](slicercore.md#onexecutionstats)*

*Defined in [src/operations/core/slicer-core.ts:148](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/operations/core/slicer-core.ts#L148)*

**Parameters:**

Name | Type |
------ | ------ |
`stats` | [ExecutionStats](../interfaces/executionstats.md) |

**Returns:** *void*

___

###  shutdown

▸ **shutdown**(): *`Promise<void>`*

*Implementation of [SlicerOperationLifeCycle](../interfaces/sliceroperationlifecycle.md)*

*Overrides [SlicerCore](slicercore.md).[shutdown](slicercore.md#shutdown)*

*Defined in [test/fixtures/example-reader/slicer.ts:13](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/test/fixtures/example-reader/slicer.ts#L13)*

**Returns:** *`Promise<void>`*

___

###  slice

▸ **slice**(): *`Promise<object>`*

*Overrides [Slicer](slicer.md).[slice](slicer.md#abstract-slice)*

*Defined in [test/fixtures/example-reader/slicer.ts:18](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/test/fixtures/example-reader/slicer.ts#L18)*

**Returns:** *`Promise<object>`*

___

###  sliceCount

▸ **sliceCount**(): *number*

*Inherited from [SlicerCore](slicercore.md).[sliceCount](slicercore.md#slicecount)*

*Defined in [src/operations/core/slicer-core.ts:127](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/operations/core/slicer-core.ts#L127)*

The number of enqueued slices

**Returns:** *number*

___

###  slicers

▸ **slicers**(): *number*

*Inherited from [Slicer](slicer.md).[slicers](slicer.md#slicers)*

*Overrides [SlicerCore](slicercore.md).[slicers](slicercore.md#abstract-slicers)*

*Defined in [src/operations/slicer.ts:23](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/operations/slicer.ts#L23)*

**Returns:** *number*
