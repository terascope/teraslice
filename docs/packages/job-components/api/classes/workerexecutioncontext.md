---
title: Job Components: `WorkerExecutionContext`
sidebar_label: WorkerExecutionContext
---

# Class: WorkerExecutionContext

WorkerExecutionContext is designed to add more
functionality to interface with the
Execution Configuration and any Operation.

## Hierarchy

* [BaseExecutionContext](baseexecutioncontext.md)‹*[WorkerOperationLifeCycle](../interfaces/workeroperationlifecycle.md)*›

  * **WorkerExecutionContext**

## Implements

* [WorkerOperationLifeCycle](../interfaces/workeroperationlifecycle.md)

### Index

#### Constructors

* [constructor](workerexecutioncontext.md#constructor)

#### Properties

* [_loader](workerexecutioncontext.md#protected-_loader)
* [_methodRegistry](workerexecutioncontext.md#protected-_methodregistry)
* [_operations](workerexecutioncontext.md#protected-_operations)
* [assetIds](workerexecutioncontext.md#assetids)
* [config](workerexecutioncontext.md#config)
* [context](workerexecutioncontext.md#context)
* [events](workerexecutioncontext.md#events)
* [exId](workerexecutioncontext.md#exid)
* [jobId](workerexecutioncontext.md#jobid)
* [logger](workerexecutioncontext.md#logger)
* [processors](workerexecutioncontext.md#processors)
* [sliceState](workerexecutioncontext.md#slicestate)
* [status](workerexecutioncontext.md#status)

#### Accessors

* [api](workerexecutioncontext.md#api)
* [apis](workerexecutioncontext.md#apis)
* [jobObserver](workerexecutioncontext.md#jobobserver)
* [processingSlice](workerexecutioncontext.md#processingslice)

#### Methods

* [_resetMethodRegistry](workerexecutioncontext.md#protected-_resetmethodregistry)
* [_runMethod](workerexecutioncontext.md#protected-_runmethod)
* [_runMethodAsync](workerexecutioncontext.md#protected-_runmethodasync)
* [addOperation](workerexecutioncontext.md#protected-addoperation)
* [fetcher](workerexecutioncontext.md#fetcher)
* [flush](workerexecutioncontext.md#flush)
* [getOperation](workerexecutioncontext.md#getoperation)
* [getOperations](workerexecutioncontext.md#getoperations)
* [initialize](workerexecutioncontext.md#initialize)
* [initializeSlice](workerexecutioncontext.md#initializeslice)
* [onFlushEnd](workerexecutioncontext.md#onflushend)
* [onFlushStart](workerexecutioncontext.md#onflushstart)
* [onSliceFailed](workerexecutioncontext.md#onslicefailed)
* [onSliceFinalizing](workerexecutioncontext.md#onslicefinalizing)
* [onSliceFinished](workerexecutioncontext.md#onslicefinished)
* [onSliceInitialized](workerexecutioncontext.md#onsliceinitialized)
* [onSliceRetry](workerexecutioncontext.md#onsliceretry)
* [onSliceStarted](workerexecutioncontext.md#onslicestarted)
* [runSlice](workerexecutioncontext.md#runslice)
* [shutdown](workerexecutioncontext.md#shutdown)

## Constructors

###  constructor

\+ **new WorkerExecutionContext**(`config`: *[ExecutionContextConfig](../interfaces/executioncontextconfig.md)*): *[WorkerExecutionContext](workerexecutioncontext.md)*

*Overrides [BaseExecutionContext](baseexecutioncontext.md).[constructor](baseexecutioncontext.md#constructor)*

*Defined in [execution-context/worker.ts:24](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/execution-context/worker.ts#L24)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | [ExecutionContextConfig](../interfaces/executioncontextconfig.md) |

**Returns:** *[WorkerExecutionContext](workerexecutioncontext.md)*

## Properties

### `Protected` _loader

• **_loader**: *[OperationLoader](operationloader.md)*

*Inherited from [BaseExecutionContext](baseexecutioncontext.md).[_loader](baseexecutioncontext.md#protected-_loader)*

*Defined in [execution-context/base.ts:23](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/execution-context/base.ts#L23)*

___

### `Protected` _methodRegistry

• **_methodRegistry**: *`Map<keyof T, Set<number>>`* =  new Map<keyof T, Set<number>>()

*Inherited from [BaseExecutionContext](baseexecutioncontext.md).[_methodRegistry](baseexecutioncontext.md#protected-_methodregistry)*

*Defined in [execution-context/base.ts:25](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/execution-context/base.ts#L25)*

___

### `Protected` _operations

• **_operations**: *`Set<T>`* =  new Set() as Set<T>

*Inherited from [BaseExecutionContext](baseexecutioncontext.md).[_operations](baseexecutioncontext.md#protected-_operations)*

*Defined in [execution-context/base.ts:24](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/execution-context/base.ts#L24)*

___

###  assetIds

• **assetIds**: *string[]* =  []

*Inherited from [BaseExecutionContext](baseexecutioncontext.md).[assetIds](baseexecutioncontext.md#assetids)*

*Defined in [execution-context/base.ts:15](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/execution-context/base.ts#L15)*

___

###  config

• **config**: *[ExecutionConfig](../interfaces/executionconfig.md)*

*Inherited from [BaseExecutionContext](baseexecutioncontext.md).[config](baseexecutioncontext.md#config)*

*Defined in [execution-context/base.ts:12](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/execution-context/base.ts#L12)*

___

###  context

• **context**: *[WorkerContext](../interfaces/workercontext.md)*

*Inherited from [BaseExecutionContext](baseexecutioncontext.md).[context](baseexecutioncontext.md#context)*

*Defined in [execution-context/base.ts:13](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/execution-context/base.ts#L13)*

___

###  events

• **events**: *`EventEmitter`*

*Inherited from [BaseExecutionContext](baseexecutioncontext.md).[events](baseexecutioncontext.md#events)*

*Defined in [execution-context/base.ts:21](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/execution-context/base.ts#L21)*

The terafoundation EventEmitter

___

###  exId

• **exId**: *string*

*Inherited from [BaseExecutionContext](baseexecutioncontext.md).[exId](baseexecutioncontext.md#exid)*

*Defined in [execution-context/base.ts:17](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/execution-context/base.ts#L17)*

___

###  jobId

• **jobId**: *string*

*Inherited from [BaseExecutionContext](baseexecutioncontext.md).[jobId](baseexecutioncontext.md#jobid)*

*Defined in [execution-context/base.ts:18](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/execution-context/base.ts#L18)*

___

###  logger

• **logger**: *`Logger`*

*Defined in [execution-context/worker.ts:17](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/execution-context/worker.ts#L17)*

___

###  processors

• **processors**: *[ProcessorCore](processorcore.md)[]*

*Defined in [execution-context/worker.ts:16](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/execution-context/worker.ts#L16)*

___

###  sliceState

• **sliceState**: *[WorkerSliceState](../overview.md#workerslicestate) | undefined*

*Defined in [execution-context/worker.ts:20](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/execution-context/worker.ts#L20)*

the active (or last) run slice

___

###  status

• **status**: *[WorkerStatus](../overview.md#workerstatus)* = "initializing"

*Defined in [execution-context/worker.ts:21](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/execution-context/worker.ts#L21)*

## Accessors

###  api

• **get api**(): *[ExecutionContextAPI](executioncontextapi.md)*

*Inherited from [BaseExecutionContext](baseexecutioncontext.md).[api](baseexecutioncontext.md#api)*

*Defined in [execution-context/base.ts:83](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/execution-context/base.ts#L83)*

**Returns:** *[ExecutionContextAPI](executioncontextapi.md)*

___

###  apis

• **get apis**(): *object*

*Defined in [execution-context/worker.ts:165](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/execution-context/worker.ts#L165)*

**Returns:** *object*

___

###  jobObserver

• **get jobObserver**(): *[JobObserver](jobobserver.md)*

*Defined in [execution-context/worker.ts:169](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/execution-context/worker.ts#L169)*

**Returns:** *[JobObserver](jobobserver.md)*

___

###  processingSlice

• **get processingSlice**(): *boolean*

*Defined in [execution-context/worker.ts:265](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/execution-context/worker.ts#L265)*

**Returns:** *boolean*

## Methods

### `Protected` _resetMethodRegistry

▸ **_resetMethodRegistry**(): *void*

*Inherited from [BaseExecutionContext](baseexecutioncontext.md).[_resetMethodRegistry](baseexecutioncontext.md#protected-_resetmethodregistry)*

*Defined in [execution-context/base.ts:135](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/execution-context/base.ts#L135)*

**Returns:** *void*

___

### `Protected` _runMethod

▸ **_runMethod**(`method`: *keyof WorkerOperationLifeCycle*, ...`args`: *any[]*): *void*

*Inherited from [BaseExecutionContext](baseexecutioncontext.md).[_runMethod](baseexecutioncontext.md#protected-_runmethod)*

*Defined in [execution-context/base.ts:121](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/execution-context/base.ts#L121)*

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

*Inherited from [BaseExecutionContext](baseexecutioncontext.md).[_runMethodAsync](baseexecutioncontext.md#protected-_runmethodasync)*

*Defined in [execution-context/base.ts:103](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/execution-context/base.ts#L103)*

Run an async method on the operation lifecycle

**Parameters:**

Name | Type |
------ | ------ |
`method` | keyof WorkerOperationLifeCycle |
`...args` | any[] |

**Returns:** *undefined | `Promise<any[]>`*

___

### `Protected` addOperation

▸ **addOperation**(`op`: *[WorkerOperationLifeCycle](../interfaces/workeroperationlifecycle.md)*): *void*

*Inherited from [BaseExecutionContext](baseexecutioncontext.md).[addOperation](baseexecutioncontext.md#protected-addoperation)*

*Defined in [execution-context/base.ts:96](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/execution-context/base.ts#L96)*

Add an operation to the lifecycle queue

**Parameters:**

Name | Type |
------ | ------ |
`op` | [WorkerOperationLifeCycle](../interfaces/workeroperationlifecycle.md) |

**Returns:** *void*

___

###  fetcher

▸ **fetcher**<**T**>(): *`T`*

*Defined in [execution-context/worker.ts:161](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/execution-context/worker.ts#L161)*

The instance of a "Fetcher"

**Type parameters:**

▪ **T**: *[FetcherCore](fetchercore.md)*

**Returns:** *`T`*

___

###  flush

▸ **flush**(): *`Promise<RunSliceResult | undefined>`*

*Defined in [execution-context/worker.ts:214](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/execution-context/worker.ts#L214)*

**Returns:** *`Promise<RunSliceResult | undefined>`*

___

###  getOperation

▸ **getOperation**<**T**>(`findBy`: *string | number*): *`T`*

*Defined in [execution-context/worker.ts:136](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/execution-context/worker.ts#L136)*

Get a operation by name or index.
If name is used it will return the first match.

**Type parameters:**

▪ **T**: *[OperationCore](operationcore.md)*

**Parameters:**

Name | Type |
------ | ------ |
`findBy` | string \| number |

**Returns:** *`T`*

___

###  getOperations

▸ **getOperations**(): *`IterableIterator<T>`*

*Inherited from [BaseExecutionContext](baseexecutioncontext.md).[getOperations](baseexecutioncontext.md#getoperations)*

*Defined in [execution-context/base.ts:91](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/execution-context/base.ts#L91)*

Returns a list of any registered Operation that has been
initialized.

**Returns:** *`IterableIterator<T>`*

___

###  initialize

▸ **initialize**(): *`Promise<void>`*

*Overrides [BaseExecutionContext](baseexecutioncontext.md).[initialize](baseexecutioncontext.md#initialize)*

*Defined in [execution-context/worker.ts:112](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/execution-context/worker.ts#L112)*

**Returns:** *`Promise<void>`*

___

###  initializeSlice

▸ **initializeSlice**(`slice`: *[Slice](../interfaces/slice.md)*): *`Promise<void>`*

*Defined in [execution-context/worker.ts:175](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/execution-context/worker.ts#L175)*

**Parameters:**

Name | Type |
------ | ------ |
`slice` | [Slice](../interfaces/slice.md) |

**Returns:** *`Promise<void>`*

___

###  onFlushEnd

▸ **onFlushEnd**(): *`Promise<void>`*

*Defined in [execution-context/worker.ts:276](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/execution-context/worker.ts#L276)*

**Returns:** *`Promise<void>`*

___

###  onFlushStart

▸ **onFlushStart**(): *`Promise<void>`*

*Defined in [execution-context/worker.ts:270](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/execution-context/worker.ts#L270)*

**Returns:** *`Promise<void>`*

___

###  onSliceFailed

▸ **onSliceFailed**(): *`Promise<void>`*

*Defined in [execution-context/worker.ts:301](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/execution-context/worker.ts#L301)*

**Returns:** *`Promise<void>`*

___

###  onSliceFinalizing

▸ **onSliceFinalizing**(): *`Promise<void>`*

*Defined in [execution-context/worker.ts:291](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/execution-context/worker.ts#L291)*

**Returns:** *`Promise<void>`*

___

###  onSliceFinished

▸ **onSliceFinished**(): *`Promise<void>`*

*Defined in [execution-context/worker.ts:296](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/execution-context/worker.ts#L296)*

**Returns:** *`Promise<void>`*

___

###  onSliceInitialized

▸ **onSliceInitialized**(): *`Promise<void>`*

*Defined in [execution-context/worker.ts:281](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/execution-context/worker.ts#L281)*

**Returns:** *`Promise<void>`*

___

###  onSliceRetry

▸ **onSliceRetry**(): *`Promise<void>`*

*Defined in [execution-context/worker.ts:307](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/execution-context/worker.ts#L307)*

**Returns:** *`Promise<void>`*

___

###  onSliceStarted

▸ **onSliceStarted**(): *`Promise<void>`*

*Defined in [execution-context/worker.ts:286](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/execution-context/worker.ts#L286)*

**Returns:** *`Promise<void>`*

___

###  runSlice

▸ **runSlice**(`slice?`: *[Slice](../interfaces/slice.md)*): *`Promise<RunSliceResult>`*

*Defined in [execution-context/worker.ts:196](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/execution-context/worker.ts#L196)*

Run a slice against the fetcher and then processors.

**`todo`** this should handle slice retries.

**Parameters:**

Name | Type |
------ | ------ |
`slice?` | [Slice](../interfaces/slice.md) |

**Returns:** *`Promise<RunSliceResult>`*

___

###  shutdown

▸ **shutdown**(): *`Promise<void>`*

*Implementation of [WorkerOperationLifeCycle](../interfaces/workeroperationlifecycle.md)*

*Overrides [BaseExecutionContext](baseexecutioncontext.md).[shutdown](baseexecutioncontext.md#shutdown)*

*Defined in [execution-context/worker.ts:127](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/execution-context/worker.ts#L127)*

**Returns:** *`Promise<void>`*
