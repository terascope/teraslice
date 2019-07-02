---
title: Job Components Execution Context Worker Workerexecutioncontext
sidebar_label: Execution Context Worker Workerexecutioncontext
---

> Execution Context Worker Workerexecutioncontext for @terascope/job-components

[Globals](../overview.md) / ["execution-context/worker"](../modules/_execution_context_worker_.md) / [WorkerExecutionContext](_execution_context_worker_.workerexecutioncontext.md) /

# Class: WorkerExecutionContext

WorkerExecutionContext is designed to add more
functionality to interface with the
Execution Configuration and any Operation.

## Hierarchy

* [BaseExecutionContext](_execution_context_base_.baseexecutioncontext.md)‹*[WorkerOperationLifeCycle](../interfaces/_interfaces_operation_lifecycle_.workeroperationlifecycle.md)*›

  * **WorkerExecutionContext**

## Implements

* [WorkerOperationLifeCycle](../interfaces/_interfaces_operation_lifecycle_.workeroperationlifecycle.md)

### Index

#### Constructors

* [constructor](_execution_context_worker_.workerexecutioncontext.md#constructor)

#### Properties

* [_loader](_execution_context_worker_.workerexecutioncontext.md#protected-_loader)
* [_methodRegistry](_execution_context_worker_.workerexecutioncontext.md#protected-_methodregistry)
* [_operations](_execution_context_worker_.workerexecutioncontext.md#protected-_operations)
* [assetIds](_execution_context_worker_.workerexecutioncontext.md#assetids)
* [config](_execution_context_worker_.workerexecutioncontext.md#config)
* [context](_execution_context_worker_.workerexecutioncontext.md#context)
* [events](_execution_context_worker_.workerexecutioncontext.md#events)
* [exId](_execution_context_worker_.workerexecutioncontext.md#exid)
* [jobId](_execution_context_worker_.workerexecutioncontext.md#jobid)
* [logger](_execution_context_worker_.workerexecutioncontext.md#logger)
* [processors](_execution_context_worker_.workerexecutioncontext.md#processors)
* [sliceState](_execution_context_worker_.workerexecutioncontext.md#slicestate)
* [status](_execution_context_worker_.workerexecutioncontext.md#status)

#### Accessors

* [api](_execution_context_worker_.workerexecutioncontext.md#api)
* [apis](_execution_context_worker_.workerexecutioncontext.md#apis)
* [jobObserver](_execution_context_worker_.workerexecutioncontext.md#jobobserver)
* [processingSlice](_execution_context_worker_.workerexecutioncontext.md#processingslice)

#### Methods

* [_resetMethodRegistry](_execution_context_worker_.workerexecutioncontext.md#protected-_resetmethodregistry)
* [_runMethod](_execution_context_worker_.workerexecutioncontext.md#protected-_runmethod)
* [_runMethodAsync](_execution_context_worker_.workerexecutioncontext.md#protected-_runmethodasync)
* [addOperation](_execution_context_worker_.workerexecutioncontext.md#protected-addoperation)
* [fetcher](_execution_context_worker_.workerexecutioncontext.md#fetcher)
* [flush](_execution_context_worker_.workerexecutioncontext.md#flush)
* [getOperation](_execution_context_worker_.workerexecutioncontext.md#getoperation)
* [getOperations](_execution_context_worker_.workerexecutioncontext.md#getoperations)
* [initialize](_execution_context_worker_.workerexecutioncontext.md#initialize)
* [initializeSlice](_execution_context_worker_.workerexecutioncontext.md#initializeslice)
* [onFlushEnd](_execution_context_worker_.workerexecutioncontext.md#onflushend)
* [onFlushStart](_execution_context_worker_.workerexecutioncontext.md#onflushstart)
* [onSliceFailed](_execution_context_worker_.workerexecutioncontext.md#onslicefailed)
* [onSliceFinalizing](_execution_context_worker_.workerexecutioncontext.md#onslicefinalizing)
* [onSliceFinished](_execution_context_worker_.workerexecutioncontext.md#onslicefinished)
* [onSliceInitialized](_execution_context_worker_.workerexecutioncontext.md#onsliceinitialized)
* [onSliceRetry](_execution_context_worker_.workerexecutioncontext.md#onsliceretry)
* [onSliceStarted](_execution_context_worker_.workerexecutioncontext.md#onslicestarted)
* [runSlice](_execution_context_worker_.workerexecutioncontext.md#runslice)
* [shutdown](_execution_context_worker_.workerexecutioncontext.md#shutdown)

## Constructors

###  constructor

\+ **new WorkerExecutionContext**(`config`: *[ExecutionContextConfig](../interfaces/_execution_context_interfaces_.executioncontextconfig.md)*): *[WorkerExecutionContext](_execution_context_worker_.workerexecutioncontext.md)*

*Overrides [BaseExecutionContext](_execution_context_base_.baseexecutioncontext.md).[constructor](_execution_context_base_.baseexecutioncontext.md#constructor)*

*Defined in [execution-context/worker.ts:23](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/worker.ts#L23)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | [ExecutionContextConfig](../interfaces/_execution_context_interfaces_.executioncontextconfig.md) |

**Returns:** *[WorkerExecutionContext](_execution_context_worker_.workerexecutioncontext.md)*

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

*Defined in [execution-context/worker.ts:16](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/worker.ts#L16)*

___

###  processors

• **processors**: *[ProcessorCore](_operations_core_processor_core_.processorcore.md)[]*

*Defined in [execution-context/worker.ts:15](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/worker.ts#L15)*

___

###  sliceState

• **sliceState**: *[WorkerSliceState](../modules/_execution_context_interfaces_.md#workerslicestate) | undefined*

*Defined in [execution-context/worker.ts:19](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/worker.ts#L19)*

the active (or last) run slice

___

###  status

• **status**: *[WorkerStatus](../modules/_execution_context_interfaces_.md#workerstatus)* = "initializing"

*Defined in [execution-context/worker.ts:20](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/worker.ts#L20)*

## Accessors

###  api

• **get api**(): *[ExecutionContextAPI](_execution_context_api_.executioncontextapi.md)*

*Inherited from [BaseExecutionContext](_execution_context_base_.baseexecutioncontext.md).[api](_execution_context_base_.baseexecutioncontext.md#api)*

*Defined in [execution-context/base.ts:83](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/base.ts#L83)*

**Returns:** *[ExecutionContextAPI](_execution_context_api_.executioncontextapi.md)*

___

###  apis

• **get apis**(): *object*

*Defined in [execution-context/worker.ts:164](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/worker.ts#L164)*

**Returns:** *object*

___

###  jobObserver

• **get jobObserver**(): *[JobObserver](_operations_job_observer_.jobobserver.md)*

*Defined in [execution-context/worker.ts:168](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/worker.ts#L168)*

**Returns:** *[JobObserver](_operations_job_observer_.jobobserver.md)*

___

###  processingSlice

• **get processingSlice**(): *boolean*

*Defined in [execution-context/worker.ts:264](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/worker.ts#L264)*

**Returns:** *boolean*

## Methods

### `Protected` _resetMethodRegistry

▸ **_resetMethodRegistry**(): *void*

*Inherited from [BaseExecutionContext](_execution_context_base_.baseexecutioncontext.md).[_resetMethodRegistry](_execution_context_base_.baseexecutioncontext.md#protected-_resetmethodregistry)*

*Defined in [execution-context/base.ts:135](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/base.ts#L135)*

**Returns:** *void*

___

### `Protected` _runMethod

▸ **_runMethod**(`method`: *keyof WorkerOperationLifeCycle*, ...`args`: *any[]*): *void*

*Inherited from [BaseExecutionContext](_execution_context_base_.baseexecutioncontext.md).[_runMethod](_execution_context_base_.baseexecutioncontext.md#protected-_runmethod)*

*Defined in [execution-context/base.ts:121](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/base.ts#L121)*

Run an method

**Parameters:**

Name | Type |
------ | ------ |
`method` | keyof WorkerOperationLifeCycle |
`...args` | any[] |

**Returns:** *void*

___

### `Protected` _runMethodAsync

▸ **_runMethodAsync**(`method`: *keyof WorkerOperationLifeCycle*, ...`args`: *any[]*): *undefined | `Promise<any[]>`*

*Inherited from [BaseExecutionContext](_execution_context_base_.baseexecutioncontext.md).[_runMethodAsync](_execution_context_base_.baseexecutioncontext.md#protected-_runmethodasync)*

*Defined in [execution-context/base.ts:103](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/base.ts#L103)*

Run an async method on the operation lifecycle

**Parameters:**

Name | Type |
------ | ------ |
`method` | keyof WorkerOperationLifeCycle |
`...args` | any[] |

**Returns:** *undefined | `Promise<any[]>`*

___

### `Protected` addOperation

▸ **addOperation**(`op`: *[WorkerOperationLifeCycle](../interfaces/_interfaces_operation_lifecycle_.workeroperationlifecycle.md)*): *void*

*Inherited from [BaseExecutionContext](_execution_context_base_.baseexecutioncontext.md).[addOperation](_execution_context_base_.baseexecutioncontext.md#protected-addoperation)*

*Defined in [execution-context/base.ts:96](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/base.ts#L96)*

Add an operation to the lifecycle queue

**Parameters:**

Name | Type |
------ | ------ |
`op` | [WorkerOperationLifeCycle](../interfaces/_interfaces_operation_lifecycle_.workeroperationlifecycle.md) |

**Returns:** *void*

___

###  fetcher

▸ **fetcher**<**T**>(): *`T`*

*Defined in [execution-context/worker.ts:160](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/worker.ts#L160)*

The instance of a "Fetcher"

**Type parameters:**

▪ **T**: *[FetcherCore](_operations_core_fetcher_core_.fetchercore.md)*

**Returns:** *`T`*

___

###  flush

▸ **flush**(): *`Promise<RunSliceResult | undefined>`*

*Defined in [execution-context/worker.ts:213](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/worker.ts#L213)*

**Returns:** *`Promise<RunSliceResult | undefined>`*

___

###  getOperation

▸ **getOperation**<**T**>(`findBy`: *string | number*): *`T`*

*Defined in [execution-context/worker.ts:135](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/worker.ts#L135)*

Get a operation by name or index.
If name is used it will return the first match.

**Type parameters:**

▪ **T**: *[OperationCore](_operations_core_operation_core_.operationcore.md)*

**Parameters:**

Name | Type |
------ | ------ |
`findBy` | string \| number |

**Returns:** *`T`*

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

▸ **initialize**(): *`Promise<void>`*

*Overrides [BaseExecutionContext](_execution_context_base_.baseexecutioncontext.md).[initialize](_execution_context_base_.baseexecutioncontext.md#initialize)*

*Defined in [execution-context/worker.ts:111](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/worker.ts#L111)*

**Returns:** *`Promise<void>`*

___

###  initializeSlice

▸ **initializeSlice**(`slice`: *[Slice](../interfaces/_interfaces_operations_.slice.md)*): *`Promise<void>`*

*Defined in [execution-context/worker.ts:174](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/worker.ts#L174)*

**Parameters:**

Name | Type |
------ | ------ |
`slice` | [Slice](../interfaces/_interfaces_operations_.slice.md) |

**Returns:** *`Promise<void>`*

___

###  onFlushEnd

▸ **onFlushEnd**(): *`Promise<void>`*

*Defined in [execution-context/worker.ts:275](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/worker.ts#L275)*

**Returns:** *`Promise<void>`*

___

###  onFlushStart

▸ **onFlushStart**(): *`Promise<void>`*

*Defined in [execution-context/worker.ts:269](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/worker.ts#L269)*

**Returns:** *`Promise<void>`*

___

###  onSliceFailed

▸ **onSliceFailed**(): *`Promise<void>`*

*Defined in [execution-context/worker.ts:300](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/worker.ts#L300)*

**Returns:** *`Promise<void>`*

___

###  onSliceFinalizing

▸ **onSliceFinalizing**(): *`Promise<void>`*

*Defined in [execution-context/worker.ts:290](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/worker.ts#L290)*

**Returns:** *`Promise<void>`*

___

###  onSliceFinished

▸ **onSliceFinished**(): *`Promise<void>`*

*Defined in [execution-context/worker.ts:295](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/worker.ts#L295)*

**Returns:** *`Promise<void>`*

___

###  onSliceInitialized

▸ **onSliceInitialized**(): *`Promise<void>`*

*Defined in [execution-context/worker.ts:280](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/worker.ts#L280)*

**Returns:** *`Promise<void>`*

___

###  onSliceRetry

▸ **onSliceRetry**(): *`Promise<void>`*

*Defined in [execution-context/worker.ts:306](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/worker.ts#L306)*

**Returns:** *`Promise<void>`*

___

###  onSliceStarted

▸ **onSliceStarted**(): *`Promise<void>`*

*Defined in [execution-context/worker.ts:285](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/worker.ts#L285)*

**Returns:** *`Promise<void>`*

___

###  runSlice

▸ **runSlice**(`slice?`: *[Slice](../interfaces/_interfaces_operations_.slice.md)*): *`Promise<RunSliceResult>`*

*Defined in [execution-context/worker.ts:195](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/worker.ts#L195)*

Run a slice against the fetcher and then processors.

**`todo`** this should handle slice retries.

**Parameters:**

Name | Type |
------ | ------ |
`slice?` | [Slice](../interfaces/_interfaces_operations_.slice.md) |

**Returns:** *`Promise<RunSliceResult>`*

___

###  shutdown

▸ **shutdown**(): *`Promise<void>`*

*Implementation of [WorkerOperationLifeCycle](../interfaces/_interfaces_operation_lifecycle_.workeroperationlifecycle.md)*

*Overrides [BaseExecutionContext](_execution_context_base_.baseexecutioncontext.md).[shutdown](_execution_context_base_.baseexecutioncontext.md#shutdown)*

*Defined in [execution-context/worker.ts:126](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/worker.ts#L126)*

**Returns:** *`Promise<void>`*
