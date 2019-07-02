---
title: Job Components Exampleobserver
sidebar_label: Exampleobserver
---

[ExampleObserver](exampleobserver.md) /

# Class: ExampleObserver <**T, T**>

## Type parameters

▪ **T**

▪ **T**

## Hierarchy

  * [Observer](observer.md)

  * [Observer](observer.md)

  * **ExampleObserver**

## Implements

* [OperationLifeCycle](../interfaces/operationlifecycle.md)
* [WorkerOperationLifeCycle](../interfaces/workeroperationlifecycle.md)
* [OperationLifeCycle](../interfaces/operationlifecycle.md)
* [WorkerOperationLifeCycle](../interfaces/workeroperationlifecycle.md)

### Index

#### Constructors

* [constructor](exampleobserver.md#constructor)

#### Properties

* [_initialized](exampleobserver.md#_initialized)
* [_shutdown](exampleobserver.md#_shutdown)
* [apiConfig](exampleobserver.md#apiconfig)
* [context](exampleobserver.md#context)
* [events](exampleobserver.md#events)
* [executionConfig](exampleobserver.md#executionconfig)
* [logger](exampleobserver.md#logger)

#### Methods

* [initialize](exampleobserver.md#initialize)
* [shutdown](exampleobserver.md#shutdown)

## Constructors

###  constructor

\+ **new ExampleObserver**(`context`: *[WorkerContext](../interfaces/workercontext.md)*, `apiConfig`: *[APIConfig](../interfaces/apiconfig.md) & `T`*, `executionConfig`: *[ExecutionConfig](../interfaces/executionconfig.md)*): *[ExampleObserver](exampleobserver.md)*

*Inherited from [APICore](apicore.md).[constructor](apicore.md#constructor)*

*Overrides [Core](core.md).[constructor](core.md#constructor)*

*Defined in [src/operations/core/api-core.ts:13](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/operations/core/api-core.ts#L13)*

**Parameters:**

Name | Type |
------ | ------ |
`context` | [WorkerContext](../interfaces/workercontext.md) |
`apiConfig` | [APIConfig](../interfaces/apiconfig.md) & `T` |
`executionConfig` | [ExecutionConfig](../interfaces/executionconfig.md) |

**Returns:** *[ExampleObserver](exampleobserver.md)*

## Properties

###  _initialized

• **_initialized**: *boolean* = false

*Defined in [test/fixtures/example-observer/observer.ts:4](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/test/fixtures/example-observer/observer.ts#L4)*

*Defined in [test/fixtures/invalid-api-observer/observer.ts:4](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/test/fixtures/invalid-api-observer/observer.ts#L4)*

___

###  _shutdown

• **_shutdown**: *boolean* = false

*Defined in [test/fixtures/example-observer/observer.ts:5](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/test/fixtures/example-observer/observer.ts#L5)*

*Defined in [test/fixtures/invalid-api-observer/observer.ts:5](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/test/fixtures/invalid-api-observer/observer.ts#L5)*

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

###  initialize

▸ **initialize**(): *`Promise<void>`*

*Overrides [APICore](apicore.md).[initialize](apicore.md#initialize)*

*Defined in [test/fixtures/example-observer/observer.ts:7](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/test/fixtures/example-observer/observer.ts#L7)*

**Returns:** *`Promise<void>`*

___

###  shutdown

▸ **shutdown**(): *`Promise<void>`*

*Implementation of [WorkerOperationLifeCycle](../interfaces/workeroperationlifecycle.md)*

*Overrides [APICore](apicore.md).[shutdown](apicore.md#shutdown)*

*Defined in [test/fixtures/example-observer/observer.ts:12](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/test/fixtures/example-observer/observer.ts#L12)*

**Returns:** *`Promise<void>`*
