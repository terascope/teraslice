---
title: Job Components Exampleapi
sidebar_label: Exampleapi
---

[ExampleAPI](exampleapi.md) /

# Class: ExampleAPI <**T, T, T**>

## Type parameters

▪ **T**

▪ **T**

▪ **T**

## Hierarchy

  * [OperationAPI](operationapi.md)

  * [OperationAPI](operationapi.md)

  * [OperationAPI](operationapi.md)

  * **ExampleAPI**

## Implements

* [OperationLifeCycle](../interfaces/operationlifecycle.md)
* [WorkerOperationLifeCycle](../interfaces/workeroperationlifecycle.md)
* [OperationLifeCycle](../interfaces/operationlifecycle.md)
* [WorkerOperationLifeCycle](../interfaces/workeroperationlifecycle.md)
* [OperationLifeCycle](../interfaces/operationlifecycle.md)
* [WorkerOperationLifeCycle](../interfaces/workeroperationlifecycle.md)

### Index

#### Constructors

* [constructor](exampleapi.md#constructor)

#### Properties

* [_initialized](exampleapi.md#_initialized)
* [_shutdown](exampleapi.md#_shutdown)
* [apiConfig](exampleapi.md#apiconfig)
* [context](exampleapi.md#context)
* [events](exampleapi.md#events)
* [executionConfig](exampleapi.md#executionconfig)
* [logger](exampleapi.md#logger)

#### Methods

* [createAPI](exampleapi.md#createapi)
* [handle](exampleapi.md#handle)
* [initialize](exampleapi.md#initialize)
* [name](exampleapi.md#name)
* [shutdown](exampleapi.md#shutdown)

## Constructors

###  constructor

\+ **new ExampleAPI**(`context`: *[WorkerContext](../interfaces/workercontext.md)*, `apiConfig`: *[APIConfig](../interfaces/apiconfig.md) & `T`*, `executionConfig`: *[ExecutionConfig](../interfaces/executionconfig.md)*): *[ExampleAPI](exampleapi.md)*

*Inherited from [APICore](apicore.md).[constructor](apicore.md#constructor)*

*Overrides [Core](core.md).[constructor](core.md#constructor)*

*Defined in [src/operations/core/api-core.ts:13](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/operations/core/api-core.ts#L13)*

**Parameters:**

Name | Type |
------ | ------ |
`context` | [WorkerContext](../interfaces/workercontext.md) |
`apiConfig` | [APIConfig](../interfaces/apiconfig.md) & `T` |
`executionConfig` | [ExecutionConfig](../interfaces/executionconfig.md) |

**Returns:** *[ExampleAPI](exampleapi.md)*

## Properties

###  _initialized

• **_initialized**: *boolean* = false

*Defined in [test/fixtures/example-api/api.ts:4](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/test/fixtures/example-api/api.ts#L4)*

*Defined in [test/fixtures/example-reader/api.ts:4](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/test/fixtures/example-reader/api.ts#L4)*

*Defined in [test/fixtures/invalid-api-observer/api.ts:5](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/test/fixtures/invalid-api-observer/api.ts#L5)*

___

###  _shutdown

• **_shutdown**: *boolean* = false

*Defined in [test/fixtures/example-api/api.ts:5](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/test/fixtures/example-api/api.ts#L5)*

*Defined in [test/fixtures/example-reader/api.ts:5](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/test/fixtures/example-reader/api.ts#L5)*

*Defined in [test/fixtures/invalid-api-observer/api.ts:6](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/test/fixtures/invalid-api-observer/api.ts#L6)*

___

###  apiConfig

• **apiConfig**: *`Readonly<APIConfig & T>`*

*Inherited from [APICore](apicore.md).[apiConfig](apicore.md#apiconfig)*

*Overrides [APICore](apicore.md).[apiConfig](apicore.md#apiconfig)*

*Defined in [src/operations/core/api-core.ts:13](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/operations/core/api-core.ts#L13)*

___

###  context

• **context**: *`Readonly<WorkerContext>`*

*Inherited from [Core](core.md).[context](core.md#context)*

*Overrides [Core](core.md).[context](core.md#context)*

*Defined in [src/operations/core/core.ts:10](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/operations/core/core.ts#L10)*

___

###  events

• **events**: *`EventEmitter`*

*Inherited from [Core](core.md).[events](core.md#events)*

*Overrides [Core](core.md).[events](core.md#events)*

*Defined in [src/operations/core/core.ts:13](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/operations/core/core.ts#L13)*

___

###  executionConfig

• **executionConfig**: *`Readonly<ExecutionConfig>`*

*Inherited from [Core](core.md).[executionConfig](core.md#executionconfig)*

*Overrides [Core](core.md).[executionConfig](core.md#executionconfig)*

*Defined in [src/operations/core/core.ts:11](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/operations/core/core.ts#L11)*

___

###  logger

• **logger**: *`Logger`*

*Inherited from [Core](core.md).[logger](core.md#logger)*

*Overrides [Core](core.md).[logger](core.md#logger)*

*Defined in [src/operations/core/core.ts:12](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/operations/core/core.ts#L12)*

## Methods

###  createAPI

▸ **createAPI**(): *`Promise<object>`*

*Overrides [OperationAPI](operationapi.md).[createAPI](operationapi.md#abstract-createapi)*

*Defined in [test/fixtures/example-api/api.ts:12](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/test/fixtures/example-api/api.ts#L12)*

**Returns:** *`Promise<object>`*

___

###  handle

▸ **handle**(`config`: *any*): *`Promise<object>`*

*Defined in [test/fixtures/example-reader/api.ts:25](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/test/fixtures/example-reader/api.ts#L25)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | any |

**Returns:** *`Promise<object>`*

___

###  initialize

▸ **initialize**(): *`Promise<void>`*

*Overrides [APICore](apicore.md).[initialize](apicore.md#initialize)*

*Defined in [test/fixtures/example-api/api.ts:7](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/test/fixtures/example-api/api.ts#L7)*

**Returns:** *`Promise<void>`*

___

###  name

▸ **name**(): *string*

*Defined in [test/fixtures/example-reader/api.ts:21](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/test/fixtures/example-reader/api.ts#L21)*

**Returns:** *string*

___

###  shutdown

▸ **shutdown**(): *`Promise<void>`*

*Implementation of [WorkerOperationLifeCycle](../interfaces/workeroperationlifecycle.md)*

*Overrides [APICore](apicore.md).[shutdown](apicore.md#shutdown)*

*Defined in [test/fixtures/example-api/api.ts:16](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/test/fixtures/example-api/api.ts#L16)*

**Returns:** *`Promise<void>`*
