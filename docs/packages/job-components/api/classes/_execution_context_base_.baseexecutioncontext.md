---
title: Job Components Execution Context Base Baseexecutioncontext
sidebar_label: Execution Context Base Baseexecutioncontext
---

> Execution Context Base Baseexecutioncontext for @terascope/job-components

[Globals](../overview.md) / ["execution-context/base"](../modules/_execution_context_base_.md) / [BaseExecutionContext](_execution_context_base_.baseexecutioncontext.md) /

# Class: BaseExecutionContext <**T**>

A base class for an Execution Context

## Type parameters

▪ **T**: *[OperationLifeCycle](../interfaces/_interfaces_operation_lifecycle_.operationlifecycle.md)*

## Hierarchy

* **BaseExecutionContext**

  * [SlicerExecutionContext](_execution_context_slicer_.slicerexecutioncontext.md)

  * [WorkerExecutionContext](_execution_context_worker_.workerexecutioncontext.md)

### Index

#### Constructors

* [constructor](_execution_context_base_.baseexecutioncontext.md#constructor)

#### Properties

* [_loader](_execution_context_base_.baseexecutioncontext.md#protected-_loader)
* [_methodRegistry](_execution_context_base_.baseexecutioncontext.md#protected-_methodregistry)
* [_operations](_execution_context_base_.baseexecutioncontext.md#protected-_operations)
* [assetIds](_execution_context_base_.baseexecutioncontext.md#assetids)
* [config](_execution_context_base_.baseexecutioncontext.md#config)
* [context](_execution_context_base_.baseexecutioncontext.md#context)
* [events](_execution_context_base_.baseexecutioncontext.md#events)
* [exId](_execution_context_base_.baseexecutioncontext.md#exid)
* [jobId](_execution_context_base_.baseexecutioncontext.md#jobid)

#### Accessors

* [api](_execution_context_base_.baseexecutioncontext.md#api)

#### Methods

* [_resetMethodRegistry](_execution_context_base_.baseexecutioncontext.md#protected-_resetmethodregistry)
* [_runMethod](_execution_context_base_.baseexecutioncontext.md#protected-_runmethod)
* [_runMethodAsync](_execution_context_base_.baseexecutioncontext.md#protected-_runmethodasync)
* [addOperation](_execution_context_base_.baseexecutioncontext.md#protected-addoperation)
* [getOperations](_execution_context_base_.baseexecutioncontext.md#getoperations)
* [initialize](_execution_context_base_.baseexecutioncontext.md#initialize)
* [shutdown](_execution_context_base_.baseexecutioncontext.md#shutdown)

## Constructors

###  constructor

\+ **new BaseExecutionContext**(`config`: *[ExecutionContextConfig](../interfaces/_execution_context_interfaces_.executioncontextconfig.md)*): *[BaseExecutionContext](_execution_context_base_.baseexecutioncontext.md)*

*Defined in [execution-context/base.ts:27](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/base.ts#L27)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | [ExecutionContextConfig](../interfaces/_execution_context_interfaces_.executioncontextconfig.md) |

**Returns:** *[BaseExecutionContext](_execution_context_base_.baseexecutioncontext.md)*

## Properties

### `Protected` _loader

• **_loader**: *[OperationLoader](_operation_loader_.operationloader.md)*

*Defined in [execution-context/base.ts:23](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/base.ts#L23)*

___

### `Protected` _methodRegistry

• **_methodRegistry**: *`Map<keyof T, Set<number>>`* =  new Map<keyof T, Set<number>>()

*Defined in [execution-context/base.ts:25](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/base.ts#L25)*

___

### `Protected` _operations

• **_operations**: *`Set<T>`* =  new Set() as Set<T>

*Defined in [execution-context/base.ts:24](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/base.ts#L24)*

___

###  assetIds

• **assetIds**: *string[]* =  []

*Defined in [execution-context/base.ts:15](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/base.ts#L15)*

___

###  config

• **config**: *[ExecutionConfig](../interfaces/_interfaces_jobs_.executionconfig.md)*

*Defined in [execution-context/base.ts:12](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/base.ts#L12)*

___

###  context

• **context**: *[WorkerContext](../interfaces/_interfaces_context_.workercontext.md)*

*Defined in [execution-context/base.ts:13](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/base.ts#L13)*

___

###  events

• **events**: *`EventEmitter`*

*Defined in [execution-context/base.ts:21](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/base.ts#L21)*

The terafoundation EventEmitter

___

###  exId

• **exId**: *string*

*Defined in [execution-context/base.ts:17](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/base.ts#L17)*

___

###  jobId

• **jobId**: *string*

*Defined in [execution-context/base.ts:18](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/base.ts#L18)*

## Accessors

###  api

• **get api**(): *[ExecutionContextAPI](_execution_context_api_.executioncontextapi.md)*

*Defined in [execution-context/base.ts:83](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/base.ts#L83)*

**Returns:** *[ExecutionContextAPI](_execution_context_api_.executioncontextapi.md)*

## Methods

### `Protected` _resetMethodRegistry

▸ **_resetMethodRegistry**(): *void*

*Defined in [execution-context/base.ts:135](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/base.ts#L135)*

**Returns:** *void*

___

### `Protected` _runMethod

▸ **_runMethod**(`method`: *keyof T*, ...`args`: *any[]*): *void*

*Defined in [execution-context/base.ts:121](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/base.ts#L121)*

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

*Defined in [execution-context/base.ts:103](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/base.ts#L103)*

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

*Defined in [execution-context/base.ts:96](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/base.ts#L96)*

Add an operation to the lifecycle queue

**Parameters:**

Name | Type |
------ | ------ |
`op` | `T` |

**Returns:** *void*

___

###  getOperations

▸ **getOperations**(): *`IterableIterator<T>`*

*Defined in [execution-context/base.ts:91](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/base.ts#L91)*

Returns a list of any registered Operation that has been
initialized.

**Returns:** *`IterableIterator<T>`*

___

###  initialize

▸ **initialize**(`initConfig?`: *any*): *`Promise<void>`*

*Defined in [execution-context/base.ts:57](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/base.ts#L57)*

Called to initialize all of the registered operations

**Parameters:**

Name | Type |
------ | ------ |
`initConfig?` | any |

**Returns:** *`Promise<void>`*

___

###  shutdown

▸ **shutdown**(): *`Promise<void>`*

*Defined in [execution-context/base.ts:69](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/base.ts#L69)*

Called to cleanup all of the registered operations

**Returns:** *`Promise<void>`*
