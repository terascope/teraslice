---
title: Job Components Execution Context Slicer Slicerexecutioncontext
sidebar_label: Execution Context Slicer Slicerexecutioncontext
---

> Execution Context Slicer Slicerexecutioncontext for @terascope/job-components

[Globals](../overview.md) / ["execution-context/slicer"](../modules/_execution_context_slicer_.md) / [SlicerExecutionContext](_execution_context_slicer_.slicerexecutioncontext.md) /

# Class: SlicerExecutionContext

SlicerExecutionContext is designed to add more
functionality to interface with the
Execution Configuration and any Operation.

## Hierarchy

* [BaseExecutionContext](_execution_context_base_.baseexecutioncontext.md)‹*[SlicerOperationLifeCycle](../interfaces/_interfaces_operation_lifecycle_.sliceroperationlifecycle.md)*›

  * **SlicerExecutionContext**

## Implements

* [SlicerOperationLifeCycle](../interfaces/_interfaces_operation_lifecycle_.sliceroperationlifecycle.md)

### Index

#### Constructors

* [constructor](_execution_context_slicer_.slicerexecutioncontext.md#constructor)

#### Properties

* [_loader](_execution_context_slicer_.slicerexecutioncontext.md#protected-_loader)
* [_methodRegistry](_execution_context_slicer_.slicerexecutioncontext.md#protected-_methodregistry)
* [_operations](_execution_context_slicer_.slicerexecutioncontext.md#protected-_operations)
* [assetIds](_execution_context_slicer_.slicerexecutioncontext.md#assetids)
* [config](_execution_context_slicer_.slicerexecutioncontext.md#config)
* [context](_execution_context_slicer_.slicerexecutioncontext.md#context)
* [events](_execution_context_slicer_.slicerexecutioncontext.md#events)
* [exId](_execution_context_slicer_.slicerexecutioncontext.md#exid)
* [jobId](_execution_context_slicer_.slicerexecutioncontext.md#jobid)
* [logger](_execution_context_slicer_.slicerexecutioncontext.md#logger)

#### Accessors

* [api](_execution_context_slicer_.slicerexecutioncontext.md#api)

#### Methods

* [_resetMethodRegistry](_execution_context_slicer_.slicerexecutioncontext.md#protected-_resetmethodregistry)
* [_runMethod](_execution_context_slicer_.slicerexecutioncontext.md#protected-_runmethod)
* [_runMethodAsync](_execution_context_slicer_.slicerexecutioncontext.md#protected-_runmethodasync)
* [addOperation](_execution_context_slicer_.slicerexecutioncontext.md#protected-addoperation)
* [getOperations](_execution_context_slicer_.slicerexecutioncontext.md#getoperations)
* [initialize](_execution_context_slicer_.slicerexecutioncontext.md#initialize)
* [onExecutionStats](_execution_context_slicer_.slicerexecutioncontext.md#onexecutionstats)
* [onSliceComplete](_execution_context_slicer_.slicerexecutioncontext.md#onslicecomplete)
* [onSliceDispatch](_execution_context_slicer_.slicerexecutioncontext.md#onslicedispatch)
* [onSliceEnqueued](_execution_context_slicer_.slicerexecutioncontext.md#onsliceenqueued)
* [shutdown](_execution_context_slicer_.slicerexecutioncontext.md#shutdown)
* [slicer](_execution_context_slicer_.slicerexecutioncontext.md#slicer)

## Constructors

###  constructor

\+ **new SlicerExecutionContext**(`config`: *[ExecutionContextConfig](../interfaces/_execution_context_interfaces_.executioncontextconfig.md)*): *[SlicerExecutionContext](_execution_context_slicer_.slicerexecutioncontext.md)*

*Overrides [BaseExecutionContext](_execution_context_base_.baseexecutioncontext.md).[constructor](_execution_context_base_.baseexecutioncontext.md#constructor)*

*Defined in [execution-context/slicer.ts:14](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/slicer.ts#L14)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | [ExecutionContextConfig](../interfaces/_execution_context_interfaces_.executioncontextconfig.md) |

**Returns:** *[SlicerExecutionContext](_execution_context_slicer_.slicerexecutioncontext.md)*

## Properties

### `Protected` _loader

• **_loader**: *[OperationLoader](_operation_loader_.operationloader.md)*

*Inherited from [BaseExecutionContext](_execution_context_base_.baseexecutioncontext.md).[_loader](_execution_context_base_.baseexecutioncontext.md#protected-_loader)*

*Defined in [execution-context/base.ts:23](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/base.ts#L23)*

___

### `Protected` _methodRegistry

• **_methodRegistry**: *`Map<keyof T, Set<number>>`* =  new Map<keyof T, Set<number>>()

*Inherited from [BaseExecutionContext](_execution_context_base_.baseexecutioncontext.md).[_methodRegistry](_execution_context_base_.baseexecutioncontext.md#protected-_methodregistry)*

*Defined in [execution-context/base.ts:25](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/base.ts#L25)*

___

### `Protected` _operations

• **_operations**: *`Set<T>`* =  new Set() as Set<T>

*Inherited from [BaseExecutionContext](_execution_context_base_.baseexecutioncontext.md).[_operations](_execution_context_base_.baseexecutioncontext.md#protected-_operations)*

*Defined in [execution-context/base.ts:24](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/base.ts#L24)*

___

###  assetIds

• **assetIds**: *string[]* =  []

*Inherited from [BaseExecutionContext](_execution_context_base_.baseexecutioncontext.md).[assetIds](_execution_context_base_.baseexecutioncontext.md#assetids)*

*Defined in [execution-context/base.ts:15](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/base.ts#L15)*

___

###  config

• **config**: *[ExecutionConfig](../interfaces/_interfaces_jobs_.executionconfig.md)*

*Inherited from [BaseExecutionContext](_execution_context_base_.baseexecutioncontext.md).[config](_execution_context_base_.baseexecutioncontext.md#config)*

*Defined in [execution-context/base.ts:12](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/base.ts#L12)*

___

###  context

• **context**: *[WorkerContext](../interfaces/_interfaces_context_.workercontext.md)*

*Inherited from [BaseExecutionContext](_execution_context_base_.baseexecutioncontext.md).[context](_execution_context_base_.baseexecutioncontext.md#context)*

*Defined in [execution-context/base.ts:13](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/base.ts#L13)*

___

###  events

• **events**: *`EventEmitter`*

*Inherited from [BaseExecutionContext](_execution_context_base_.baseexecutioncontext.md).[events](_execution_context_base_.baseexecutioncontext.md#events)*

*Defined in [execution-context/base.ts:21](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/base.ts#L21)*

The terafoundation EventEmitter

___

###  exId

• **exId**: *string*

*Inherited from [BaseExecutionContext](_execution_context_base_.baseexecutioncontext.md).[exId](_execution_context_base_.baseexecutioncontext.md#exid)*

*Defined in [execution-context/base.ts:17](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/base.ts#L17)*

___

###  jobId

• **jobId**: *string*

*Inherited from [BaseExecutionContext](_execution_context_base_.baseexecutioncontext.md).[jobId](_execution_context_base_.baseexecutioncontext.md#jobid)*

*Defined in [execution-context/base.ts:18](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/base.ts#L18)*

___

###  logger

• **logger**: *`Logger`*

*Defined in [execution-context/slicer.ts:14](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/slicer.ts#L14)*

## Accessors

###  api

• **get api**(): *[ExecutionContextAPI](_execution_context_api_.executioncontextapi.md)*

*Inherited from [BaseExecutionContext](_execution_context_base_.baseexecutioncontext.md).[api](_execution_context_base_.baseexecutioncontext.md#api)*

*Defined in [execution-context/base.ts:83](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/base.ts#L83)*

**Returns:** *[ExecutionContextAPI](_execution_context_api_.executioncontextapi.md)*

## Methods

### `Protected` _resetMethodRegistry

▸ **_resetMethodRegistry**(): *void*

*Inherited from [BaseExecutionContext](_execution_context_base_.baseexecutioncontext.md).[_resetMethodRegistry](_execution_context_base_.baseexecutioncontext.md#protected-_resetmethodregistry)*

*Defined in [execution-context/base.ts:135](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/base.ts#L135)*

**Returns:** *void*

___

### `Protected` _runMethod

▸ **_runMethod**(`method`: *keyof SlicerOperationLifeCycle*, ...`args`: *any[]*): *void*

*Inherited from [BaseExecutionContext](_execution_context_base_.baseexecutioncontext.md).[_runMethod](_execution_context_base_.baseexecutioncontext.md#protected-_runmethod)*

*Defined in [execution-context/base.ts:121](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/base.ts#L121)*

Run an method

**Parameters:**

Name | Type |
------ | ------ |
`method` | keyof SlicerOperationLifeCycle |
`...args` | any[] |

**Returns:** *void*

___

### `Protected` _runMethodAsync

▸ **_runMethodAsync**(`method`: *keyof SlicerOperationLifeCycle*, ...`args`: *any[]*): *undefined | `Promise<any[]>`*

*Inherited from [BaseExecutionContext](_execution_context_base_.baseexecutioncontext.md).[_runMethodAsync](_execution_context_base_.baseexecutioncontext.md#protected-_runmethodasync)*

*Defined in [execution-context/base.ts:103](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/base.ts#L103)*

Run an async method on the operation lifecycle

**Parameters:**

Name | Type |
------ | ------ |
`method` | keyof SlicerOperationLifeCycle |
`...args` | any[] |

**Returns:** *undefined | `Promise<any[]>`*

___

### `Protected` addOperation

▸ **addOperation**(`op`: *[SlicerOperationLifeCycle](../interfaces/_interfaces_operation_lifecycle_.sliceroperationlifecycle.md)*): *void*

*Inherited from [BaseExecutionContext](_execution_context_base_.baseexecutioncontext.md).[addOperation](_execution_context_base_.baseexecutioncontext.md#protected-addoperation)*

*Defined in [execution-context/base.ts:96](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/base.ts#L96)*

Add an operation to the lifecycle queue

**Parameters:**

Name | Type |
------ | ------ |
`op` | [SlicerOperationLifeCycle](../interfaces/_interfaces_operation_lifecycle_.sliceroperationlifecycle.md) |

**Returns:** *void*

___

###  getOperations

▸ **getOperations**(): *`IterableIterator<T>`*

*Inherited from [BaseExecutionContext](_execution_context_base_.baseexecutioncontext.md).[getOperations](_execution_context_base_.baseexecutioncontext.md#getoperations)*

*Defined in [execution-context/base.ts:91](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/base.ts#L91)*

Returns a list of any registered Operation that has been
initialized.

**Returns:** *`IterableIterator<T>`*

___

###  initialize

▸ **initialize**(`recoveryData?`: *object[]*): *`Promise<void>`*

*Implementation of [SlicerOperationLifeCycle](../interfaces/_interfaces_operation_lifecycle_.sliceroperationlifecycle.md)*

*Overrides [BaseExecutionContext](_execution_context_base_.baseexecutioncontext.md).[initialize](_execution_context_base_.baseexecutioncontext.md#initialize)*

*Defined in [execution-context/slicer.ts:39](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/slicer.ts#L39)*

Called during execution initialization

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`recoveryData?` | object[] | is the data to recover from  |

**Returns:** *`Promise<void>`*

___

###  onExecutionStats

▸ **onExecutionStats**(`stats`: *[ExecutionStats](../interfaces/_interfaces_operations_.executionstats.md)*): *void*

*Implementation of [SlicerOperationLifeCycle](../interfaces/_interfaces_operation_lifecycle_.sliceroperationlifecycle.md)*

*Defined in [execution-context/slicer.ts:48](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/slicer.ts#L48)*

**Parameters:**

Name | Type |
------ | ------ |
`stats` | [ExecutionStats](../interfaces/_interfaces_operations_.executionstats.md) |

**Returns:** *void*

___

###  onSliceComplete

▸ **onSliceComplete**(`result`: *[SliceResult](../interfaces/_interfaces_operations_.sliceresult.md)*): *void*

*Implementation of [SlicerOperationLifeCycle](../interfaces/_interfaces_operation_lifecycle_.sliceroperationlifecycle.md)*

*Defined in [execution-context/slicer.ts:60](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/slicer.ts#L60)*

**Parameters:**

Name | Type |
------ | ------ |
`result` | [SliceResult](../interfaces/_interfaces_operations_.sliceresult.md) |

**Returns:** *void*

___

###  onSliceDispatch

▸ **onSliceDispatch**(`slice`: *[Slice](../interfaces/_interfaces_operations_.slice.md)*): *void*

*Implementation of [SlicerOperationLifeCycle](../interfaces/_interfaces_operation_lifecycle_.sliceroperationlifecycle.md)*

*Defined in [execution-context/slicer.ts:56](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/slicer.ts#L56)*

**Parameters:**

Name | Type |
------ | ------ |
`slice` | [Slice](../interfaces/_interfaces_operations_.slice.md) |

**Returns:** *void*

___

###  onSliceEnqueued

▸ **onSliceEnqueued**(`slice`: *[Slice](../interfaces/_interfaces_operations_.slice.md)*): *void*

*Implementation of [SlicerOperationLifeCycle](../interfaces/_interfaces_operation_lifecycle_.sliceroperationlifecycle.md)*

*Defined in [execution-context/slicer.ts:52](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/slicer.ts#L52)*

**Parameters:**

Name | Type |
------ | ------ |
`slice` | [Slice](../interfaces/_interfaces_operations_.slice.md) |

**Returns:** *void*

___

###  shutdown

▸ **shutdown**(): *`Promise<void>`*

*Implementation of [SlicerOperationLifeCycle](../interfaces/_interfaces_operation_lifecycle_.sliceroperationlifecycle.md)*

*Inherited from [BaseExecutionContext](_execution_context_base_.baseexecutioncontext.md).[shutdown](_execution_context_base_.baseexecutioncontext.md#shutdown)*

*Defined in [execution-context/base.ts:69](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/base.ts#L69)*

Called to cleanup all of the registered operations

**Returns:** *`Promise<void>`*

___

###  slicer

▸ **slicer**<**T**>(): *`T`*

*Defined in [execution-context/slicer.ts:44](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/slicer.ts#L44)*

The instance of a "Slicer"

**Type parameters:**

▪ **T**: *[SlicerCore](_operations_core_slicer_core_.slicercore.md)*

**Returns:** *`T`*
