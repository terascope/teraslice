---
title: Job Components :: APICore
sidebar_label: APICore
---

# Class: APICore <**T**>

A base class for supporting APIs that run within an Execution Context.

## Type parameters

▪ **T**

## Hierarchy

* [Core](core.md)‹*[WorkerContext](../interfaces/workercontext.md)*›

  * **APICore**

  * [OperationAPI](operationapi.md)

  * [Observer](observer.md)

## Implements

* [OperationLifeCycle](../interfaces/operationlifecycle.md)
* [WorkerOperationLifeCycle](../interfaces/workeroperationlifecycle.md)

### Index

#### Constructors

* [constructor](apicore.md#constructor)

#### Properties

* [apiConfig](apicore.md#apiconfig)
* [context](apicore.md#context)
* [events](apicore.md#events)
* [executionConfig](apicore.md#executionconfig)
* [logger](apicore.md#logger)

#### Methods

* [initialize](apicore.md#initialize)
* [shutdown](apicore.md#shutdown)

## Constructors

###  constructor

\+ **new APICore**(`context`: *[WorkerContext](../interfaces/workercontext.md)*, `apiConfig`: *[APIConfig](../interfaces/apiconfig.md) & `T`*, `executionConfig`: *[ExecutionConfig](../interfaces/executionconfig.md)*): *[APICore](apicore.md)*

*Overrides [Core](core.md).[constructor](core.md#constructor)*

*Defined in [operations/core/api-core.ts:13](https://github.com/terascope/teraslice/blob/e7b0edd3/packages/job-components/src/operations/core/api-core.ts#L13)*

**Parameters:**

Name | Type |
------ | ------ |
`context` | [WorkerContext](../interfaces/workercontext.md) |
`apiConfig` | [APIConfig](../interfaces/apiconfig.md) & `T` |
`executionConfig` | [ExecutionConfig](../interfaces/executionconfig.md) |

**Returns:** *[APICore](apicore.md)*

## Properties

###  apiConfig

• **apiConfig**: *`Readonly<APIConfig & T>`*

*Defined in [operations/core/api-core.ts:13](https://github.com/terascope/teraslice/blob/e7b0edd3/packages/job-components/src/operations/core/api-core.ts#L13)*

___

###  context

• **context**: *`Readonly<WorkerContext>`*

*Inherited from [Core](core.md).[context](core.md#context)*

*Defined in [operations/core/core.ts:10](https://github.com/terascope/teraslice/blob/e7b0edd3/packages/job-components/src/operations/core/core.ts#L10)*

___

###  events

• **events**: *`EventEmitter`*

*Inherited from [Core](core.md).[events](core.md#events)*

*Defined in [operations/core/core.ts:13](https://github.com/terascope/teraslice/blob/e7b0edd3/packages/job-components/src/operations/core/core.ts#L13)*

___

###  executionConfig

• **executionConfig**: *`Readonly<ExecutionConfig>`*

*Inherited from [Core](core.md).[executionConfig](core.md#executionconfig)*

*Defined in [operations/core/core.ts:11](https://github.com/terascope/teraslice/blob/e7b0edd3/packages/job-components/src/operations/core/core.ts#L11)*

___

###  logger

• **logger**: *`Logger`*

*Inherited from [Core](core.md).[logger](core.md#logger)*

*Defined in [operations/core/core.ts:12](https://github.com/terascope/teraslice/blob/e7b0edd3/packages/job-components/src/operations/core/core.ts#L12)*

## Methods

###  initialize

▸ **initialize**(): *`Promise<void>`*

*Overrides [Core](core.md).[initialize](core.md#abstract-initialize)*

*Defined in [operations/core/api-core.ts:28](https://github.com/terascope/teraslice/blob/e7b0edd3/packages/job-components/src/operations/core/api-core.ts#L28)*

**Returns:** *`Promise<void>`*

___

###  shutdown

▸ **shutdown**(): *`Promise<void>`*

*Implementation of [WorkerOperationLifeCycle](../interfaces/workeroperationlifecycle.md)*

*Overrides [Core](core.md).[shutdown](core.md#abstract-shutdown)*

*Defined in [operations/core/api-core.ts:32](https://github.com/terascope/teraslice/blob/e7b0edd3/packages/job-components/src/operations/core/api-core.ts#L32)*

**Returns:** *`Promise<void>`*
