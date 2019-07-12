---
title: Job Components: `SlicerExecutionContext`
sidebar_label: SlicerExecutionContext
---

# Class: SlicerExecutionContext

SlicerExecutionContext is designed to add more
functionality to interface with the
Execution Configuration and any Operation.

## Hierarchy

* [BaseExecutionContext](baseexecutioncontext.md)‹*[SlicerOperationLifeCycle](../interfaces/sliceroperationlifecycle.md)*›

  * **SlicerExecutionContext**

## Implements

* [SlicerOperationLifeCycle](../interfaces/sliceroperationlifecycle.md)

### Index

#### Constructors

* [constructor](slicerexecutioncontext.md#constructor)

#### Properties

* [_loader](slicerexecutioncontext.md#protected-_loader)
* [_methodRegistry](slicerexecutioncontext.md#protected-_methodregistry)
* [_operations](slicerexecutioncontext.md#protected-_operations)
* [assetIds](slicerexecutioncontext.md#assetids)
* [config](slicerexecutioncontext.md#config)
* [context](slicerexecutioncontext.md#context)
* [events](slicerexecutioncontext.md#events)
* [exId](slicerexecutioncontext.md#exid)
* [jobId](slicerexecutioncontext.md#jobid)
* [logger](slicerexecutioncontext.md#logger)

#### Accessors

* [api](slicerexecutioncontext.md#api)

#### Methods

* [_resetMethodRegistry](slicerexecutioncontext.md#protected-_resetmethodregistry)
* [_runMethod](slicerexecutioncontext.md#protected-_runmethod)
* [_runMethodAsync](slicerexecutioncontext.md#protected-_runmethodasync)
* [addOperation](slicerexecutioncontext.md#protected-addoperation)
* [getOperations](slicerexecutioncontext.md#getoperations)
* [initialize](slicerexecutioncontext.md#initialize)
* [onExecutionStats](slicerexecutioncontext.md#onexecutionstats)
* [onSliceComplete](slicerexecutioncontext.md#onslicecomplete)
* [onSliceDispatch](slicerexecutioncontext.md#onslicedispatch)
* [onSliceEnqueued](slicerexecutioncontext.md#onsliceenqueued)
* [shutdown](slicerexecutioncontext.md#shutdown)
* [slicer](slicerexecutioncontext.md#slicer)

## Constructors

###  constructor

\+ **new SlicerExecutionContext**(`config`: [ExecutionContextConfig](../interfaces/executioncontextconfig.md)): *[SlicerExecutionContext](slicerexecutioncontext.md)*

*Overrides [BaseExecutionContext](baseexecutioncontext.md).[constructor](baseexecutioncontext.md#constructor)*

*Defined in [execution-context/slicer.ts:14](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/job-components/src/execution-context/slicer.ts#L14)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | [ExecutionContextConfig](../interfaces/executioncontextconfig.md) |

**Returns:** *[SlicerExecutionContext](slicerexecutioncontext.md)*

## Properties

### `Protected` _loader

• **_loader**: *[OperationLoader](operationloader.md)*

*Inherited from [BaseExecutionContext](baseexecutioncontext.md).[_loader](baseexecutioncontext.md#protected-_loader)*

*Defined in [execution-context/base.ts:23](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/job-components/src/execution-context/base.ts#L23)*

___

### `Protected` _methodRegistry

• **_methodRegistry**: *`Map<keyof T, Set<number>>`* =  new Map<keyof T, Set<number>>()

*Inherited from [BaseExecutionContext](baseexecutioncontext.md).[_methodRegistry](baseexecutioncontext.md#protected-_methodregistry)*

*Defined in [execution-context/base.ts:25](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/job-components/src/execution-context/base.ts#L25)*

___

### `Protected` _operations

• **_operations**: *`Set<T>`* =  new Set() as Set<T>

*Inherited from [BaseExecutionContext](baseexecutioncontext.md).[_operations](baseexecutioncontext.md#protected-_operations)*

*Defined in [execution-context/base.ts:24](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/job-components/src/execution-context/base.ts#L24)*

___

###  assetIds

• **assetIds**: *string[]* =  []

*Inherited from [BaseExecutionContext](baseexecutioncontext.md).[assetIds](baseexecutioncontext.md#assetids)*

*Defined in [execution-context/base.ts:15](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/job-components/src/execution-context/base.ts#L15)*

___

###  config

• **config**: *[ExecutionConfig](../interfaces/executionconfig.md)*

*Inherited from [BaseExecutionContext](baseexecutioncontext.md).[config](baseexecutioncontext.md#config)*

*Defined in [execution-context/base.ts:12](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/job-components/src/execution-context/base.ts#L12)*

___

###  context

• **context**: *[WorkerContext](../interfaces/workercontext.md)*

*Inherited from [BaseExecutionContext](baseexecutioncontext.md).[context](baseexecutioncontext.md#context)*

*Defined in [execution-context/base.ts:13](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/job-components/src/execution-context/base.ts#L13)*

___

###  events

• **events**: *`EventEmitter`*

*Inherited from [BaseExecutionContext](baseexecutioncontext.md).[events](baseexecutioncontext.md#events)*

*Defined in [execution-context/base.ts:21](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/job-components/src/execution-context/base.ts#L21)*

The terafoundation EventEmitter

___

###  exId

• **exId**: *string*

*Inherited from [BaseExecutionContext](baseexecutioncontext.md).[exId](baseexecutioncontext.md#exid)*

*Defined in [execution-context/base.ts:17](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/job-components/src/execution-context/base.ts#L17)*

___

###  jobId

• **jobId**: *string*

*Inherited from [BaseExecutionContext](baseexecutioncontext.md).[jobId](baseexecutioncontext.md#jobid)*

*Defined in [execution-context/base.ts:18](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/job-components/src/execution-context/base.ts#L18)*

___

###  logger

• **logger**: *`Logger`*

*Defined in [execution-context/slicer.ts:14](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/job-components/src/execution-context/slicer.ts#L14)*

## Accessors

###  api

• **get api**(): *[ExecutionContextAPI](executioncontextapi.md)*

*Inherited from [BaseExecutionContext](baseexecutioncontext.md).[api](baseexecutioncontext.md#api)*

*Defined in [execution-context/base.ts:83](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/job-components/src/execution-context/base.ts#L83)*

**Returns:** *[ExecutionContextAPI](executioncontextapi.md)*

## Methods

### `Protected` _resetMethodRegistry

▸ **_resetMethodRegistry**(): *void*

*Inherited from [BaseExecutionContext](baseexecutioncontext.md).[_resetMethodRegistry](baseexecutioncontext.md#protected-_resetmethodregistry)*

*Defined in [execution-context/base.ts:135](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/job-components/src/execution-context/base.ts#L135)*

**Returns:** *void*

___

### `Protected` _runMethod

▸ **_runMethod**(`method`: keyof SlicerOperationLifeCycle, ...`args`: any[]): *void*

*Inherited from [BaseExecutionContext](baseexecutioncontext.md).[_runMethod](baseexecutioncontext.md#protected-_runmethod)*

*Defined in [execution-context/base.ts:121](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/job-components/src/execution-context/base.ts#L121)*

Run an method

**Parameters:**

Name | Type |
------ | ------ |
`method` | keyof SlicerOperationLifeCycle |
`...args` | any[] |

**Returns:** *void*

___

### `Protected` _runMethodAsync

▸ **_runMethodAsync**(`method`: keyof SlicerOperationLifeCycle, ...`args`: any[]): *undefined | `Promise<any[]>`*

*Inherited from [BaseExecutionContext](baseexecutioncontext.md).[_runMethodAsync](baseexecutioncontext.md#protected-_runmethodasync)*

*Defined in [execution-context/base.ts:103](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/job-components/src/execution-context/base.ts#L103)*

Run an async method on the operation lifecycle

**Parameters:**

Name | Type |
------ | ------ |
`method` | keyof SlicerOperationLifeCycle |
`...args` | any[] |

**Returns:** *undefined | `Promise<any[]>`*

___

### `Protected` addOperation

▸ **addOperation**(`op`: [SlicerOperationLifeCycle](../interfaces/sliceroperationlifecycle.md)): *void*

*Inherited from [BaseExecutionContext](baseexecutioncontext.md).[addOperation](baseexecutioncontext.md#protected-addoperation)*

*Defined in [execution-context/base.ts:96](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/job-components/src/execution-context/base.ts#L96)*

Add an operation to the lifecycle queue

**Parameters:**

Name | Type |
------ | ------ |
`op` | [SlicerOperationLifeCycle](../interfaces/sliceroperationlifecycle.md) |

**Returns:** *void*

___

###  getOperations

▸ **getOperations**(): *`IterableIterator<T>`*

*Inherited from [BaseExecutionContext](baseexecutioncontext.md).[getOperations](baseexecutioncontext.md#getoperations)*

*Defined in [execution-context/base.ts:91](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/job-components/src/execution-context/base.ts#L91)*

Returns a list of any registered Operation that has been
initialized.

**Returns:** *`IterableIterator<T>`*

___

###  initialize

▸ **initialize**(`recoveryData?`: object[]): *`Promise<void>`*

*Overrides [BaseExecutionContext](baseexecutioncontext.md).[initialize](baseexecutioncontext.md#initialize)*

*Defined in [execution-context/slicer.ts:39](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/job-components/src/execution-context/slicer.ts#L39)*

Called during execution initialization

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`recoveryData?` | object[] | is the data to recover from  |

**Returns:** *`Promise<void>`*

___

###  onExecutionStats

▸ **onExecutionStats**(`stats`: [ExecutionStats](../interfaces/executionstats.md)): *void*

*Implementation of [SlicerOperationLifeCycle](../interfaces/sliceroperationlifecycle.md)*

*Defined in [execution-context/slicer.ts:48](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/job-components/src/execution-context/slicer.ts#L48)*

**Parameters:**

Name | Type |
------ | ------ |
`stats` | [ExecutionStats](../interfaces/executionstats.md) |

**Returns:** *void*

___

###  onSliceComplete

▸ **onSliceComplete**(`result`: [SliceResult](../interfaces/sliceresult.md)): *void*

*Implementation of [SlicerOperationLifeCycle](../interfaces/sliceroperationlifecycle.md)*

*Defined in [execution-context/slicer.ts:60](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/job-components/src/execution-context/slicer.ts#L60)*

**Parameters:**

Name | Type |
------ | ------ |
`result` | [SliceResult](../interfaces/sliceresult.md) |

**Returns:** *void*

___

###  onSliceDispatch

▸ **onSliceDispatch**(`slice`: [Slice](../interfaces/slice.md)): *void*

*Implementation of [SlicerOperationLifeCycle](../interfaces/sliceroperationlifecycle.md)*

*Defined in [execution-context/slicer.ts:56](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/job-components/src/execution-context/slicer.ts#L56)*

**Parameters:**

Name | Type |
------ | ------ |
`slice` | [Slice](../interfaces/slice.md) |

**Returns:** *void*

___

###  onSliceEnqueued

▸ **onSliceEnqueued**(`slice`: [Slice](../interfaces/slice.md)): *void*

*Implementation of [SlicerOperationLifeCycle](../interfaces/sliceroperationlifecycle.md)*

*Defined in [execution-context/slicer.ts:52](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/job-components/src/execution-context/slicer.ts#L52)*

**Parameters:**

Name | Type |
------ | ------ |
`slice` | [Slice](../interfaces/slice.md) |

**Returns:** *void*

___

###  shutdown

▸ **shutdown**(): *`Promise<void>`*

*Implementation of [SlicerOperationLifeCycle](../interfaces/sliceroperationlifecycle.md)*

*Inherited from [BaseExecutionContext](baseexecutioncontext.md).[shutdown](baseexecutioncontext.md#shutdown)*

*Defined in [execution-context/base.ts:69](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/job-components/src/execution-context/base.ts#L69)*

Called to cleanup all of the registered operations

**Returns:** *`Promise<void>`*

___

###  slicer

▸ **slicer**<**T**>(): *`T`*

*Defined in [execution-context/slicer.ts:44](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/job-components/src/execution-context/slicer.ts#L44)*

The instance of a "Slicer"

**Type parameters:**

▪ **T**: *[SlicerCore](slicercore.md)*

**Returns:** *`T`*
