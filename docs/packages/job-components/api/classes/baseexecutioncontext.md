---
title: Job Components Baseexecutioncontext
sidebar_label: Baseexecutioncontext
---

[BaseExecutionContext](baseexecutioncontext.md) /

# Class: BaseExecutionContext <**T**>

A base class for an Execution Context

## Type parameters

▪ **T**: *[OperationLifeCycle](../interfaces/operationlifecycle.md)*

## Hierarchy

* **BaseExecutionContext**

  * [SlicerExecutionContext](slicerexecutioncontext.md)

  * [WorkerExecutionContext](workerexecutioncontext.md)

### Index

#### Constructors

* [constructor](baseexecutioncontext.md#constructor)

#### Properties

* [_loader](baseexecutioncontext.md#protected-_loader)
* [_methodRegistry](baseexecutioncontext.md#protected-_methodregistry)
* [_operations](baseexecutioncontext.md#protected-_operations)
* [assetIds](baseexecutioncontext.md#assetids)
* [config](baseexecutioncontext.md#config)
* [context](baseexecutioncontext.md#context)
* [events](baseexecutioncontext.md#events)
* [exId](baseexecutioncontext.md#exid)
* [jobId](baseexecutioncontext.md#jobid)

#### Accessors

* [api](baseexecutioncontext.md#api)

#### Methods

* [_resetMethodRegistry](baseexecutioncontext.md#protected-_resetmethodregistry)
* [_runMethod](baseexecutioncontext.md#protected-_runmethod)
* [_runMethodAsync](baseexecutioncontext.md#protected-_runmethodasync)
* [addOperation](baseexecutioncontext.md#protected-addoperation)
* [getOperations](baseexecutioncontext.md#getoperations)
* [initialize](baseexecutioncontext.md#initialize)
* [shutdown](baseexecutioncontext.md#shutdown)

## Constructors

###  constructor

\+ **new BaseExecutionContext**(`config`: *[ExecutionContextConfig](../interfaces/executioncontextconfig.md)*): *[BaseExecutionContext](baseexecutioncontext.md)*

*Defined in [src/execution-context/base.ts:27](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/execution-context/base.ts#L27)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | [ExecutionContextConfig](../interfaces/executioncontextconfig.md) |

**Returns:** *[BaseExecutionContext](baseexecutioncontext.md)*

## Properties

### `Protected` _loader

• **_loader**: *[OperationLoader](operationloader.md)*

*Defined in [src/execution-context/base.ts:23](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/execution-context/base.ts#L23)*

___

### `Protected` _methodRegistry

• **_methodRegistry**: *`Map<keyof T, Set<number>>`* =  new Map<keyof T, Set<number>>()

*Defined in [src/execution-context/base.ts:25](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/execution-context/base.ts#L25)*

___

### `Protected` _operations

• **_operations**: *`Set<T>`* =  new Set() as Set<T>

*Defined in [src/execution-context/base.ts:24](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/execution-context/base.ts#L24)*

___

###  assetIds

• **assetIds**: *string[]* =  []

*Defined in [src/execution-context/base.ts:15](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/execution-context/base.ts#L15)*

___

###  config

• **config**: *[ExecutionConfig](../interfaces/executionconfig.md)*

*Defined in [src/execution-context/base.ts:12](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/execution-context/base.ts#L12)*

___

###  context

• **context**: *[WorkerContext](../interfaces/workercontext.md)*

*Defined in [src/execution-context/base.ts:13](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/execution-context/base.ts#L13)*

___

###  events

• **events**: *`EventEmitter`*

*Defined in [src/execution-context/base.ts:21](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/execution-context/base.ts#L21)*

The terafoundation EventEmitter

___

###  exId

• **exId**: *string*

*Defined in [src/execution-context/base.ts:17](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/execution-context/base.ts#L17)*

___

###  jobId

• **jobId**: *string*

*Defined in [src/execution-context/base.ts:18](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/execution-context/base.ts#L18)*

## Accessors

###  api

• **get api**(): *[ExecutionContextAPI](executioncontextapi.md)*

*Defined in [src/execution-context/base.ts:83](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/execution-context/base.ts#L83)*

**Returns:** *[ExecutionContextAPI](executioncontextapi.md)*

## Methods

### `Protected` _resetMethodRegistry

▸ **_resetMethodRegistry**(): *void*

*Defined in [src/execution-context/base.ts:135](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/execution-context/base.ts#L135)*

**Returns:** *void*

___

### `Protected` _runMethod

▸ **_runMethod**(`method`: *keyof T*, ...`args`: *any[]*): *void*

*Defined in [src/execution-context/base.ts:121](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/execution-context/base.ts#L121)*

Run an method

**Parameters:**

Name | Type |
------ | ------ |
`method` | keyof T |
`...args` | any[] |

**Returns:** *void*

___

### `Protected` _runMethodAsync

▸ **_runMethodAsync**(`method`: *keyof T*, ...`args`: *any[]*): *undefined | `Promise<any[]>`*

*Defined in [src/execution-context/base.ts:103](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/execution-context/base.ts#L103)*

Run an async method on the operation lifecycle

**Parameters:**

Name | Type |
------ | ------ |
`method` | keyof T |
`...args` | any[] |

**Returns:** *undefined | `Promise<any[]>`*

___

### `Protected` addOperation

▸ **addOperation**(`op`: *`T`*): *void*

*Defined in [src/execution-context/base.ts:96](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/execution-context/base.ts#L96)*

Add an operation to the lifecycle queue

**Parameters:**

Name | Type |
------ | ------ |
`op` | `T` |

**Returns:** *void*

___

###  getOperations

▸ **getOperations**(): *`IterableIterator<T>`*

*Defined in [src/execution-context/base.ts:91](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/execution-context/base.ts#L91)*

Returns a list of any registered Operation that has been
initialized.

**Returns:** *`IterableIterator<T>`*

___

###  initialize

▸ **initialize**(`initConfig?`: *any*): *`Promise<void>`*

*Defined in [src/execution-context/base.ts:57](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/execution-context/base.ts#L57)*

Called to initialize all of the registered operations

**Parameters:**

Name | Type |
------ | ------ |
`initConfig?` | any |

**Returns:** *`Promise<void>`*

___

###  shutdown

▸ **shutdown**(): *`Promise<void>`*

*Defined in [src/execution-context/base.ts:69](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/execution-context/base.ts#L69)*

Called to cleanup all of the registered operations

**Returns:** *`Promise<void>`*
