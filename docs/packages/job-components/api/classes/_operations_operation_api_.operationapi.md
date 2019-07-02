---
title: Job Components Operations Operation Api Operationapi
sidebar_label: Operations Operation Api Operationapi
---

> Operations Operation Api Operationapi for @terascope/job-components

[Globals](../overview.md) / ["operations/operation-api"](../modules/_operations_operation_api_.md) / [OperationAPI](_operations_operation_api_.operationapi.md) /

# Class: OperationAPI <**T**>

An API factory class for operations

## Type parameters

▪ **T**

## Hierarchy

  * [APICore](_operations_core_api_core_.apicore.md)‹*`T`*›

  * **OperationAPI**

## Implements

* [OperationLifeCycle](../interfaces/_interfaces_operation_lifecycle_.operationlifecycle.md)
* [WorkerOperationLifeCycle](../interfaces/_interfaces_operation_lifecycle_.workeroperationlifecycle.md)

### Index

#### Constructors

* [constructor](_operations_operation_api_.operationapi.md#constructor)

#### Properties

* [apiConfig](_operations_operation_api_.operationapi.md#apiconfig)
* [context](_operations_operation_api_.operationapi.md#context)
* [events](_operations_operation_api_.operationapi.md#events)
* [executionConfig](_operations_operation_api_.operationapi.md#executionconfig)
* [logger](_operations_operation_api_.operationapi.md#logger)

#### Methods

* [createAPI](_operations_operation_api_.operationapi.md#abstract-createapi)
* [initialize](_operations_operation_api_.operationapi.md#initialize)
* [shutdown](_operations_operation_api_.operationapi.md#shutdown)

## Constructors

###  constructor

\+ **new OperationAPI**(`context`: *[WorkerContext](../interfaces/_interfaces_context_.workercontext.md)*, `apiConfig`: *[APIConfig](../interfaces/_interfaces_jobs_.apiconfig.md) & `T`*, `executionConfig`: *[ExecutionConfig](../interfaces/_interfaces_jobs_.executionconfig.md)*): *[OperationAPI](_operations_operation_api_.operationapi.md)*

*Inherited from [APICore](_operations_core_api_core_.apicore.md).[constructor](_operations_core_api_core_.apicore.md#constructor)*

*Overrides [Core](_operations_core_core_.core.md).[constructor](_operations_core_core_.core.md#constructor)*

*Defined in [operations/core/api-core.ts:13](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/api-core.ts#L13)*

**Parameters:**

Name | Type |
------ | ------ |
`context` | [WorkerContext](../interfaces/_interfaces_context_.workercontext.md) |
`apiConfig` | [APIConfig](../interfaces/_interfaces_jobs_.apiconfig.md) & `T` |
`executionConfig` | [ExecutionConfig](../interfaces/_interfaces_jobs_.executionconfig.md) |

**Returns:** *[OperationAPI](_operations_operation_api_.operationapi.md)*

## Properties

###  apiConfig

• **apiConfig**: *`Readonly<APIConfig & T>`*

*Inherited from [APICore](_operations_core_api_core_.apicore.md).[apiConfig](_operations_core_api_core_.apicore.md#apiconfig)*

*Defined in [operations/core/api-core.ts:13](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/api-core.ts#L13)*

___

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

###  logger

• **logger**: *`Logger`*

*Inherited from [Core](_operations_core_core_.core.md).[logger](_operations_core_core_.core.md#logger)*

*Defined in [operations/core/core.ts:12](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/core.ts#L12)*

## Methods

### `Abstract` createAPI

▸ **createAPI**(...`params`: *any[]*): *`Promise<OpAPI>`*

*Defined in [operations/operation-api.ts:16](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/operation-api.ts#L16)*

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

*Inherited from [APICore](_operations_core_api_core_.apicore.md).[initialize](_operations_core_api_core_.apicore.md#initialize)*

*Overrides [Core](_operations_core_core_.core.md).[initialize](_operations_core_core_.core.md#abstract-initialize)*

*Defined in [operations/core/api-core.ts:28](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/api-core.ts#L28)*

**Returns:** *`Promise<void>`*

___

###  shutdown

▸ **shutdown**(): *`Promise<void>`*

*Implementation of [WorkerOperationLifeCycle](../interfaces/_interfaces_operation_lifecycle_.workeroperationlifecycle.md)*

*Inherited from [APICore](_operations_core_api_core_.apicore.md).[shutdown](_operations_core_api_core_.apicore.md#shutdown)*

*Overrides [Core](_operations_core_core_.core.md).[shutdown](_operations_core_core_.core.md#abstract-shutdown)*

*Defined in [operations/core/api-core.ts:32](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/api-core.ts#L32)*

**Returns:** *`Promise<void>`*
