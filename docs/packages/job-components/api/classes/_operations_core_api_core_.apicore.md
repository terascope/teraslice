---
title: Job Components Operations Core Api Core Apicore
sidebar_label: Operations Core Api Core Apicore
---

> Operations Core Api Core Apicore for @terascope/job-components

[Globals](../overview.md) / ["operations/core/api-core"](../modules/_operations_core_api_core_.md) / [APICore](_operations_core_api_core_.apicore.md) /

# Class: APICore <**T**>

A base class for supporting APIs that run within an Execution Context.

## Type parameters

▪ **T**

## Hierarchy

* [Core](_operations_core_core_.core.md)‹*[WorkerContext](../interfaces/_interfaces_context_.workercontext.md)*›

  * **APICore**

  * [OperationAPI](_operations_operation_api_.operationapi.md)

  * [Observer](_operations_observer_.observer.md)

## Implements

* [OperationLifeCycle](../interfaces/_interfaces_operation_lifecycle_.operationlifecycle.md)
* [WorkerOperationLifeCycle](../interfaces/_interfaces_operation_lifecycle_.workeroperationlifecycle.md)

### Index

#### Constructors

* [constructor](_operations_core_api_core_.apicore.md#constructor)

#### Properties

* [apiConfig](_operations_core_api_core_.apicore.md#apiconfig)
* [context](_operations_core_api_core_.apicore.md#context)
* [events](_operations_core_api_core_.apicore.md#events)
* [executionConfig](_operations_core_api_core_.apicore.md#executionconfig)
* [logger](_operations_core_api_core_.apicore.md#logger)

#### Methods

* [initialize](_operations_core_api_core_.apicore.md#initialize)
* [shutdown](_operations_core_api_core_.apicore.md#shutdown)

## Constructors

###  constructor

\+ **new APICore**(`context`: *[WorkerContext](../interfaces/_interfaces_context_.workercontext.md)*, `apiConfig`: *[APIConfig](../interfaces/_interfaces_jobs_.apiconfig.md) & `T`*, `executionConfig`: *[ExecutionConfig](../interfaces/_interfaces_jobs_.executionconfig.md)*): *[APICore](_operations_core_api_core_.apicore.md)*

*Overrides [Core](_operations_core_core_.core.md).[constructor](_operations_core_core_.core.md#constructor)*

*Defined in [operations/core/api-core.ts:13](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/api-core.ts#L13)*

**Parameters:**

Name | Type |
------ | ------ |
`context` | [WorkerContext](../interfaces/_interfaces_context_.workercontext.md) |
`apiConfig` | [APIConfig](../interfaces/_interfaces_jobs_.apiconfig.md) & `T` |
`executionConfig` | [ExecutionConfig](../interfaces/_interfaces_jobs_.executionconfig.md) |

**Returns:** *[APICore](_operations_core_api_core_.apicore.md)*

## Properties

###  apiConfig

• **apiConfig**: *`Readonly<APIConfig & T>`*

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

###  initialize

▸ **initialize**(): *`Promise<void>`*

*Overrides [Core](_operations_core_core_.core.md).[initialize](_operations_core_core_.core.md#abstract-initialize)*

*Defined in [operations/core/api-core.ts:28](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/api-core.ts#L28)*

**Returns:** *`Promise<void>`*

___

###  shutdown

▸ **shutdown**(): *`Promise<void>`*

*Implementation of [WorkerOperationLifeCycle](../interfaces/_interfaces_operation_lifecycle_.workeroperationlifecycle.md)*

*Overrides [Core](_operations_core_core_.core.md).[shutdown](_operations_core_core_.core.md#abstract-shutdown)*

*Defined in [operations/core/api-core.ts:32](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/api-core.ts#L32)*

**Returns:** *`Promise<void>`*
