---
title: Job Components Operations Observer Observer
sidebar_label: Operations Observer Observer
---

> Operations Observer Observer for @terascope/job-components

[Globals](../overview.md) / ["operations/observer"](../modules/_operations_observer_.md) / [Observer](_operations_observer_.observer.md) /

# Class: Observer <**T**>

An Observer factory class for operations

## Type parameters

▪ **T**

## Hierarchy

  * [APICore](_operations_core_api_core_.apicore.md)‹*`T`*›

  * **Observer**

  * [JobObserver](_operations_job_observer_.jobobserver.md)

## Implements

* [OperationLifeCycle](../interfaces/_interfaces_operation_lifecycle_.operationlifecycle.md)
* [WorkerOperationLifeCycle](../interfaces/_interfaces_operation_lifecycle_.workeroperationlifecycle.md)

### Index

#### Constructors

* [constructor](_operations_observer_.observer.md#constructor)

#### Properties

* [apiConfig](_operations_observer_.observer.md#apiconfig)
* [context](_operations_observer_.observer.md#context)
* [events](_operations_observer_.observer.md#events)
* [executionConfig](_operations_observer_.observer.md#executionconfig)
* [logger](_operations_observer_.observer.md#logger)

#### Methods

* [initialize](_operations_observer_.observer.md#initialize)
* [shutdown](_operations_observer_.observer.md#shutdown)

## Constructors

###  constructor

\+ **new Observer**(`context`: *[WorkerContext](../interfaces/_interfaces_context_.workercontext.md)*, `apiConfig`: *[APIConfig](../interfaces/_interfaces_jobs_.apiconfig.md) & `T`*, `executionConfig`: *[ExecutionConfig](../interfaces/_interfaces_jobs_.executionconfig.md)*): *[Observer](_operations_observer_.observer.md)*

*Inherited from [APICore](_operations_core_api_core_.apicore.md).[constructor](_operations_core_api_core_.apicore.md#constructor)*

*Overrides [Core](_operations_core_core_.core.md).[constructor](_operations_core_core_.core.md#constructor)*

*Defined in [operations/core/api-core.ts:13](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/api-core.ts#L13)*

**Parameters:**

Name | Type |
------ | ------ |
`context` | [WorkerContext](../interfaces/_interfaces_context_.workercontext.md) |
`apiConfig` | [APIConfig](../interfaces/_interfaces_jobs_.apiconfig.md) & `T` |
`executionConfig` | [ExecutionConfig](../interfaces/_interfaces_jobs_.executionconfig.md) |

**Returns:** *[Observer](_operations_observer_.observer.md)*

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
