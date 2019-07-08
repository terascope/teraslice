---
title: Job Components: `OperationCore`
sidebar_label: OperationCore
---

# Class: OperationCore <**T**>

A base class for supporting operations that run on a "Worker",
that supports the job execution lifecycle events.
This class will likely not be used externally
since Teraslice only supports a few types varients based on this class.

See [Core](core.md) more information

## Type parameters

▪ **T**

## Hierarchy

* [Core](core.md)‹*[WorkerContext](../interfaces/workercontext.md)*›

  * **OperationCore**

  * [FetcherCore](fetchercore.md)

  * [ProcessorCore](processorcore.md)

## Implements

* [OperationLifeCycle](../interfaces/operationlifecycle.md)
* [WorkerOperationLifeCycle](../interfaces/workeroperationlifecycle.md)

### Index

#### Constructors

* [constructor](operationcore.md#constructor)

#### Properties

* [context](operationcore.md#context)
* [deadLetterAction](operationcore.md#deadletteraction)
* [events](operationcore.md#events)
* [executionConfig](operationcore.md#executionconfig)
* [logger](operationcore.md#logger)
* [opConfig](operationcore.md#opconfig)

#### Methods

* [createAPI](operationcore.md#createapi)
* [getAPI](operationcore.md#getapi)
* [initialize](operationcore.md#initialize)
* [rejectRecord](operationcore.md#rejectrecord)
* [shutdown](operationcore.md#shutdown)
* [tryRecord](operationcore.md#tryrecord)

## Constructors

###  constructor

\+ **new OperationCore**(`context`: *[WorkerContext](../interfaces/workercontext.md)*, `opConfig`: *[OpConfig](../interfaces/opconfig.md) & `T`*, `executionConfig`: *[ExecutionConfig](../interfaces/executionconfig.md)*): *[OperationCore](operationcore.md)*

*Overrides [Core](core.md).[constructor](core.md#constructor)*

*Defined in [operations/core/operation-core.ts:24](https://github.com/terascope/teraslice/blob/a2250fb9/packages/job-components/src/operations/core/operation-core.ts#L24)*

**Parameters:**

Name | Type |
------ | ------ |
`context` | [WorkerContext](../interfaces/workercontext.md) |
`opConfig` | [OpConfig](../interfaces/opconfig.md) & `T` |
`executionConfig` | [ExecutionConfig](../interfaces/executionconfig.md) |

**Returns:** *[OperationCore](operationcore.md)*

## Properties

###  context

• **context**: *`Readonly<WorkerContext>`*

*Inherited from [Core](core.md).[context](core.md#context)*

*Defined in [operations/core/core.ts:10](https://github.com/terascope/teraslice/blob/a2250fb9/packages/job-components/src/operations/core/core.ts#L10)*

___

###  deadLetterAction

• **deadLetterAction**: *[DeadLetterAction](../overview.md#deadletteraction)*

*Defined in [operations/core/operation-core.ts:24](https://github.com/terascope/teraslice/blob/a2250fb9/packages/job-components/src/operations/core/operation-core.ts#L24)*

___

###  events

• **events**: *`EventEmitter`*

*Inherited from [Core](core.md).[events](core.md#events)*

*Defined in [operations/core/core.ts:13](https://github.com/terascope/teraslice/blob/a2250fb9/packages/job-components/src/operations/core/core.ts#L13)*

___

###  executionConfig

• **executionConfig**: *`Readonly<ExecutionConfig>`*

*Inherited from [Core](core.md).[executionConfig](core.md#executionconfig)*

*Defined in [operations/core/core.ts:11](https://github.com/terascope/teraslice/blob/a2250fb9/packages/job-components/src/operations/core/core.ts#L11)*

___

###  logger

• **logger**: *`Logger`*

*Inherited from [Core](core.md).[logger](core.md#logger)*

*Defined in [operations/core/core.ts:12](https://github.com/terascope/teraslice/blob/a2250fb9/packages/job-components/src/operations/core/core.ts#L12)*

___

###  opConfig

• **opConfig**: *`Readonly<OpConfig & T>`*

*Defined in [operations/core/operation-core.ts:23](https://github.com/terascope/teraslice/blob/a2250fb9/packages/job-components/src/operations/core/operation-core.ts#L23)*

## Methods

###  createAPI

▸ **createAPI**<**A**>(`name`: *string*, ...`params`: *any[]*): *`Promise<A>`*

*Defined in [operations/core/operation-core.ts:52](https://github.com/terascope/teraslice/blob/a2250fb9/packages/job-components/src/operations/core/operation-core.ts#L52)*

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

###  getAPI

▸ **getAPI**<**A**>(`name`: *string*): *`A`*

*Defined in [operations/core/operation-core.ts:59](https://github.com/terascope/teraslice/blob/a2250fb9/packages/job-components/src/operations/core/operation-core.ts#L59)*

Get a reference to an existing API

**Type parameters:**

▪ **A**: *[OpAPI](../overview.md#opapi)*

**Parameters:**

Name | Type |
------ | ------ |
`name` | string |

**Returns:** *`A`*

___

###  initialize

▸ **initialize**(): *`Promise<void>`*

*Overrides [Core](core.md).[initialize](core.md#abstract-initialize)*

*Defined in [operations/core/operation-core.ts:41](https://github.com/terascope/teraslice/blob/a2250fb9/packages/job-components/src/operations/core/operation-core.ts#L41)*

**Returns:** *`Promise<void>`*

___

###  rejectRecord

▸ **rejectRecord**(`input`: *any*, `err`: *`Error`*): *never | null*

*Defined in [operations/core/operation-core.ts:96](https://github.com/terascope/teraslice/blob/a2250fb9/packages/job-components/src/operations/core/operation-core.ts#L96)*

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

*Overrides [Core](core.md).[shutdown](core.md#abstract-shutdown)*

*Defined in [operations/core/operation-core.ts:45](https://github.com/terascope/teraslice/blob/a2250fb9/packages/job-components/src/operations/core/operation-core.ts#L45)*

**Returns:** *`Promise<void>`*

___

###  tryRecord

▸ **tryRecord**<**I**, **R**>(`fn`: *function*): *function*

*Defined in [operations/core/operation-core.ts:71](https://github.com/terascope/teraslice/blob/a2250fb9/packages/job-components/src/operations/core/operation-core.ts#L71)*

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
