---
title: Job Components Examplefetcher
sidebar_label: Examplefetcher
---

[ExampleFetcher](examplefetcher.md) /

# Class: ExampleFetcher <**T**>

## Type parameters

▪ **T**

## Hierarchy

  * [Fetcher](fetcher.md)

  * **ExampleFetcher**

## Implements

* [OperationLifeCycle](../interfaces/operationlifecycle.md)
* [WorkerOperationLifeCycle](../interfaces/workeroperationlifecycle.md)

### Index

#### Constructors

* [constructor](examplefetcher.md#constructor)

#### Properties

* [_initialized](examplefetcher.md#_initialized)
* [_shutdown](examplefetcher.md#_shutdown)
* [context](examplefetcher.md#context)
* [deadLetterAction](examplefetcher.md#deadletteraction)
* [events](examplefetcher.md#events)
* [executionConfig](examplefetcher.md#executionconfig)
* [logger](examplefetcher.md#logger)
* [opConfig](examplefetcher.md#opconfig)

#### Methods

* [createAPI](examplefetcher.md#createapi)
* [fetch](examplefetcher.md#fetch)
* [getAPI](examplefetcher.md#getapi)
* [handle](examplefetcher.md#handle)
* [initialize](examplefetcher.md#initialize)
* [rejectRecord](examplefetcher.md#rejectrecord)
* [shutdown](examplefetcher.md#shutdown)
* [tryRecord](examplefetcher.md#tryrecord)

## Constructors

###  constructor

\+ **new ExampleFetcher**(`context`: *[WorkerContext](../interfaces/workercontext.md)*, `opConfig`: *[OpConfig](../interfaces/opconfig.md) & `T`*, `executionConfig`: *[ExecutionConfig](../interfaces/executionconfig.md)*): *[ExampleFetcher](examplefetcher.md)*

*Inherited from [OperationCore](operationcore.md).[constructor](operationcore.md#constructor)*

*Overrides [Core](core.md).[constructor](core.md#constructor)*

*Defined in [src/operations/core/operation-core.ts:23](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/operations/core/operation-core.ts#L23)*

**Parameters:**

Name | Type |
------ | ------ |
`context` | [WorkerContext](../interfaces/workercontext.md) |
`opConfig` | [OpConfig](../interfaces/opconfig.md) & `T` |
`executionConfig` | [ExecutionConfig](../interfaces/executionconfig.md) |

**Returns:** *[ExampleFetcher](examplefetcher.md)*

## Properties

###  _initialized

• **_initialized**: *boolean* = false

*Defined in [test/fixtures/example-reader/fetcher.ts:4](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/test/fixtures/example-reader/fetcher.ts#L4)*

___

###  _shutdown

• **_shutdown**: *boolean* = false

*Defined in [test/fixtures/example-reader/fetcher.ts:5](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/test/fixtures/example-reader/fetcher.ts#L5)*

___

###  context

• **context**: *`Readonly<WorkerContext>`*

*Inherited from [Core](core.md).[context](core.md#context)*

*Defined in [src/operations/core/core.ts:10](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/operations/core/core.ts#L10)*

___

###  deadLetterAction

• **deadLetterAction**: *[DeadLetterAction](../overview.md#deadletteraction)*

*Inherited from [OperationCore](operationcore.md).[deadLetterAction](operationcore.md#deadletteraction)*

*Defined in [src/operations/core/operation-core.ts:23](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/operations/core/operation-core.ts#L23)*

___

###  events

• **events**: *`EventEmitter`*

*Inherited from [Core](core.md).[events](core.md#events)*

*Defined in [src/operations/core/core.ts:13](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/operations/core/core.ts#L13)*

___

###  executionConfig

• **executionConfig**: *`Readonly<ExecutionConfig>`*

*Inherited from [Core](core.md).[executionConfig](core.md#executionconfig)*

*Defined in [src/operations/core/core.ts:11](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/operations/core/core.ts#L11)*

___

###  logger

• **logger**: *`Logger`*

*Inherited from [Core](core.md).[logger](core.md#logger)*

*Defined in [src/operations/core/core.ts:12](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/operations/core/core.ts#L12)*

___

###  opConfig

• **opConfig**: *`Readonly<OpConfig & T>`*

*Inherited from [OperationCore](operationcore.md).[opConfig](operationcore.md#opconfig)*

*Defined in [src/operations/core/operation-core.ts:22](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/operations/core/operation-core.ts#L22)*

## Methods

###  createAPI

▸ **createAPI**<**A**>(`name`: *string*, ...`params`: *any[]*): *`Promise<A>`*

*Inherited from [OperationCore](operationcore.md).[createAPI](operationcore.md#createapi)*

*Defined in [src/operations/core/operation-core.ts:51](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/operations/core/operation-core.ts#L51)*

Create an API and add it to the operation lifecycle

**Type parameters:**

▪ **A**: *[OpAPI](../overview.md#opapi)*

**Parameters:**

Name | Type |
------ | ------ |
`name` | string |
`...params` | any[] |

**Returns:** *`Promise<A>`*

___

###  fetch

▸ **fetch**(): *`Promise<object[]>`*

*Overrides [Fetcher](fetcher.md).[fetch](fetcher.md#abstract-fetch)*

*Defined in [test/fixtures/example-reader/fetcher.ts:17](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/test/fixtures/example-reader/fetcher.ts#L17)*

**Returns:** *`Promise<object[]>`*

___

###  getAPI

▸ **getAPI**<**A**>(`name`: *string*): *`A`*

*Inherited from [OperationCore](operationcore.md).[getAPI](operationcore.md#getapi)*

*Defined in [src/operations/core/operation-core.ts:58](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/operations/core/operation-core.ts#L58)*

Get a reference to an existing API

**Type parameters:**

▪ **A**: *[OpAPI](../overview.md#opapi)*

**Parameters:**

Name | Type |
------ | ------ |
`name` | string |

**Returns:** *`A`*

___

###  handle

▸ **handle**(`sliceRequest?`: *any*): *`Promise<DataEntity[]>`*

*Inherited from [Fetcher](fetcher.md).[handle](fetcher.md#handle)*

*Overrides [FetcherCore](fetchercore.md).[handle](fetchercore.md#abstract-handle)*

*Defined in [src/operations/fetcher.ts:16](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/operations/fetcher.ts#L16)*

**Parameters:**

Name | Type |
------ | ------ |
`sliceRequest?` | any |

**Returns:** *`Promise<DataEntity[]>`*

___

###  initialize

▸ **initialize**(): *`Promise<void>`*

*Overrides [OperationCore](operationcore.md).[initialize](operationcore.md#initialize)*

*Defined in [test/fixtures/example-reader/fetcher.ts:7](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/test/fixtures/example-reader/fetcher.ts#L7)*

**Returns:** *`Promise<void>`*

___

###  rejectRecord

▸ **rejectRecord**(`input`: *any*, `err`: *`Error`*): *never | null*

*Inherited from [OperationCore](operationcore.md).[rejectRecord](operationcore.md#rejectrecord)*

*Defined in [src/operations/core/operation-core.ts:95](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/operations/core/operation-core.ts#L95)*

Reject a record using the dead letter action

Based on [OpConfig._dead_letter_action](../interfaces/opconfig.md#optional-_dead_letter_action) the transformation can
be handled any of the following ways:
  - "throw": throw the original error
  - "log": log the error and the data
  - "none": skip the error entirely
  OR a string to specify the api to use as the dead letter queue

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |
`err` | `Error` |

**Returns:** *never | null*

the transformed record

___

###  shutdown

▸ **shutdown**(): *`Promise<void>`*

*Implementation of [WorkerOperationLifeCycle](../interfaces/workeroperationlifecycle.md)*

*Overrides [OperationCore](operationcore.md).[shutdown](operationcore.md#shutdown)*

*Defined in [test/fixtures/example-reader/fetcher.ts:12](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/test/fixtures/example-reader/fetcher.ts#L12)*

**Returns:** *`Promise<void>`*

___

###  tryRecord

▸ **tryRecord**<**I**, **R**>(`fn`: *function*): *function*

*Inherited from [OperationCore](operationcore.md).[tryRecord](operationcore.md#tryrecord)*

*Defined in [src/operations/core/operation-core.ts:70](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/operations/core/operation-core.ts#L70)*

Try catch a transformation on a record and place any failed records in a dead letter queue

See {@link #rejectRecord} for handling

**Type parameters:**

▪ **I**

▪ **R**

**Parameters:**

▪ **fn**: *function*

a function to transform the data with

▸ (`input`: *`I`*): *`R`*

**Parameters:**

Name | Type |
------ | ------ |
`input` | `I` |

**Returns:** *function*

a curried a function that will be called with the data and handle the dead letter action

▸ (`input`: *`I`*): *`R` | null*

**Parameters:**

Name | Type |
------ | ------ |
`input` | `I` |
