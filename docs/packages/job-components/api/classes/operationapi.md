---
title: Job Components: `OperationAPI`
sidebar_label: OperationAPI
---

# Class: OperationAPI <**T**>

An API factory class for operations

## Type parameters

▪ **T**

## Hierarchy

  * [APICore](apicore.md)‹*`T`*›

  * **OperationAPI**

## Implements

* [OperationLifeCycle](../interfaces/operationlifecycle.md)
* [WorkerOperationLifeCycle](../interfaces/workeroperationlifecycle.md)

### Index

#### Constructors

* [constructor](operationapi.md#constructor)

#### Properties

* [apiConfig](operationapi.md#apiconfig)
* [context](operationapi.md#context)
* [events](operationapi.md#events)
* [executionConfig](operationapi.md#executionconfig)
* [logger](operationapi.md#logger)

#### Methods

* [createAPI](operationapi.md#abstract-createapi)
* [initialize](operationapi.md#initialize)
* [shutdown](operationapi.md#shutdown)

## Constructors

###  constructor

\+ **new OperationAPI**(`context`: *[WorkerContext](../interfaces/workercontext.md)*, `apiConfig`: *[APIConfig](../interfaces/apiconfig.md) & `T`*, `executionConfig`: *[ExecutionConfig](../interfaces/executionconfig.md)*): *[OperationAPI](operationapi.md)*

*Inherited from [APICore](apicore.md).[constructor](apicore.md#constructor)*

*Overrides [Core](core.md).[constructor](core.md#constructor)*

*Defined in [operations/core/api-core.ts:13](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/job-components/src/operations/core/api-core.ts#L13)*

**Parameters:**

Name | Type |
------ | ------ |
`context` | [WorkerContext](../interfaces/workercontext.md) |
`apiConfig` | [APIConfig](../interfaces/apiconfig.md) & `T` |
`executionConfig` | [ExecutionConfig](../interfaces/executionconfig.md) |

**Returns:** *[OperationAPI](operationapi.md)*

## Properties

###  apiConfig

• **apiConfig**: *`Readonly<APIConfig & T>`*

*Inherited from [APICore](apicore.md).[apiConfig](apicore.md#apiconfig)*

*Defined in [operations/core/api-core.ts:13](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/job-components/src/operations/core/api-core.ts#L13)*

___

###  context

• **context**: *`Readonly<WorkerContext>`*

*Inherited from [Core](core.md).[context](core.md#context)*

*Defined in [operations/core/core.ts:10](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/job-components/src/operations/core/core.ts#L10)*

___

###  events

• **events**: *`EventEmitter`*

*Inherited from [Core](core.md).[events](core.md#events)*

*Defined in [operations/core/core.ts:13](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/job-components/src/operations/core/core.ts#L13)*

___

###  executionConfig

• **executionConfig**: *`Readonly<ExecutionConfig>`*

*Inherited from [Core](core.md).[executionConfig](core.md#executionconfig)*

*Defined in [operations/core/core.ts:11](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/job-components/src/operations/core/core.ts#L11)*

___

###  logger

• **logger**: *`Logger`*

*Inherited from [Core](core.md).[logger](core.md#logger)*

*Defined in [operations/core/core.ts:12](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/job-components/src/operations/core/core.ts#L12)*

## Methods

### `Abstract` createAPI

▸ **createAPI**(...`params`: *any[]*): *`Promise<OpAPI>`*

*Defined in [operations/operation-api.ts:16](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/job-components/src/operations/operation-api.ts#L16)*

Called when the API is created with in another Operation.
This will only be called once during an operation

**Parameters:**

Name | Type |
------ | ------ |
`...params` | any[] |

**Returns:** *`Promise<OpAPI>`*

an Operation API which is one of the following
          - an object with function properties
          - an instances of a class
          - a function

___

###  initialize

▸ **initialize**(): *`Promise<void>`*

*Inherited from [APICore](apicore.md).[initialize](apicore.md#initialize)*

*Overrides [Core](core.md).[initialize](core.md#abstract-initialize)*

*Defined in [operations/core/api-core.ts:28](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/job-components/src/operations/core/api-core.ts#L28)*

**Returns:** *`Promise<void>`*

___

###  shutdown

▸ **shutdown**(): *`Promise<void>`*

*Implementation of [WorkerOperationLifeCycle](../interfaces/workeroperationlifecycle.md)*

*Inherited from [APICore](apicore.md).[shutdown](apicore.md#shutdown)*

*Overrides [Core](core.md).[shutdown](core.md#abstract-shutdown)*

*Defined in [operations/core/api-core.ts:32](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/job-components/src/operations/core/api-core.ts#L32)*

**Returns:** *`Promise<void>`*

