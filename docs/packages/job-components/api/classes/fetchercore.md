---
title: Job Components: `FetcherCore`
sidebar_label: FetcherCore
---

# Class: FetcherCore <**T**>

A base class for supporting "Fetcher" that run on a "Worker".
The "Fetcher" is a part of the "Reader" component of a job.
See [OperationCore](operationcore.md)

## Type parameters

▪ **T**

## Hierarchy

  * [OperationCore](operationcore.md)‹T›

  * **FetcherCore**

  * [Fetcher](fetcher.md)

## Implements

* [OperationLifeCycle](../interfaces/operationlifecycle.md)
* [WorkerOperationLifeCycle](../interfaces/workeroperationlifecycle.md)

## Index

### Constructors

* [constructor](fetchercore.md#constructor)

### Properties

* [context](fetchercore.md#context)
* [deadLetterAction](fetchercore.md#deadletteraction)
* [events](fetchercore.md#events)
* [executionConfig](fetchercore.md#executionconfig)
* [logger](fetchercore.md#logger)
* [opConfig](fetchercore.md#opconfig)

### Methods

* [createAPI](fetchercore.md#createapi)
* [getAPI](fetchercore.md#getapi)
* [handle](fetchercore.md#abstract-handle)
* [initialize](fetchercore.md#initialize)
* [rejectRecord](fetchercore.md#rejectrecord)
* [shutdown](fetchercore.md#shutdown)
* [tryRecord](fetchercore.md#tryrecord)

## Constructors

###  constructor

\+ **new FetcherCore**(`context`: [WorkerContext](../interfaces/workercontext.md), `opConfig`: [OpConfig](../interfaces/opconfig.md) & T, `executionConfig`: [ExecutionConfig](../interfaces/executionconfig.md)): *[FetcherCore](fetchercore.md)*

*Inherited from [OperationCore](operationcore.md).[constructor](operationcore.md#constructor)*

*Overrides [Core](core.md).[constructor](core.md#constructor)*

*Defined in [operations/core/operation-core.ts:28](https://github.com/terascope/teraslice/blob/0ae31df4/packages/job-components/src/operations/core/operation-core.ts#L28)*

**Parameters:**

Name | Type |
------ | ------ |
`context` | [WorkerContext](../interfaces/workercontext.md) |
`opConfig` | [OpConfig](../interfaces/opconfig.md) & T |
`executionConfig` | [ExecutionConfig](../interfaces/executionconfig.md) |

**Returns:** *[FetcherCore](fetchercore.md)*

## Properties

###  context

• **context**: *Readonly‹[WorkerContext](../interfaces/workercontext.md)›*

*Inherited from [Core](core.md).[context](core.md#context)*

*Defined in [operations/core/core.ts:10](https://github.com/terascope/teraslice/blob/0ae31df4/packages/job-components/src/operations/core/core.ts#L10)*

___

###  deadLetterAction

• **deadLetterAction**: *[DeadLetterAction](../overview.md#deadletteraction)*

*Inherited from [OperationCore](operationcore.md).[deadLetterAction](operationcore.md#deadletteraction)*

*Defined in [operations/core/operation-core.ts:28](https://github.com/terascope/teraslice/blob/0ae31df4/packages/job-components/src/operations/core/operation-core.ts#L28)*

___

###  events

• **events**: *EventEmitter*

*Inherited from [Core](core.md).[events](core.md#events)*

*Defined in [operations/core/core.ts:13](https://github.com/terascope/teraslice/blob/0ae31df4/packages/job-components/src/operations/core/core.ts#L13)*

___

###  executionConfig

• **executionConfig**: *Readonly‹[ExecutionConfig](../interfaces/executionconfig.md)›*

*Inherited from [Core](core.md).[executionConfig](core.md#executionconfig)*

*Defined in [operations/core/core.ts:11](https://github.com/terascope/teraslice/blob/0ae31df4/packages/job-components/src/operations/core/core.ts#L11)*

___

###  logger

• **logger**: *Logger*

*Inherited from [Core](core.md).[logger](core.md#logger)*

*Defined in [operations/core/core.ts:12](https://github.com/terascope/teraslice/blob/0ae31df4/packages/job-components/src/operations/core/core.ts#L12)*

___

###  opConfig

• **opConfig**: *Readonly‹[OpConfig](../interfaces/opconfig.md) & T›*

*Inherited from [OperationCore](operationcore.md).[opConfig](operationcore.md#opconfig)*

*Defined in [operations/core/operation-core.ts:27](https://github.com/terascope/teraslice/blob/0ae31df4/packages/job-components/src/operations/core/operation-core.ts#L27)*

## Methods

###  createAPI

▸ **createAPI**<**A**>(`name`: string, ...`params`: any[]): *Promise‹A›*

*Inherited from [OperationCore](operationcore.md).[createAPI](operationcore.md#createapi)*

*Defined in [operations/core/operation-core.ts:51](https://github.com/terascope/teraslice/blob/0ae31df4/packages/job-components/src/operations/core/operation-core.ts#L51)*

Create an API and add it to the operation lifecycle

**Type parameters:**

▪ **A**: *[OpAPI](../overview.md#opapi)*

**Parameters:**

Name | Type |
------ | ------ |
`name` | string |
`...params` | any[] |

**Returns:** *Promise‹A›*

___

###  getAPI

▸ **getAPI**<**A**>(`name`: string): *A*

*Inherited from [OperationCore](operationcore.md).[getAPI](operationcore.md#getapi)*

*Defined in [operations/core/operation-core.ts:58](https://github.com/terascope/teraslice/blob/0ae31df4/packages/job-components/src/operations/core/operation-core.ts#L58)*

Get a reference to an existing API

**Type parameters:**

▪ **A**: *[OpAPI](../overview.md#opapi)*

**Parameters:**

Name | Type |
------ | ------ |
`name` | string |

**Returns:** *A*

___

### `Abstract` handle

▸ **handle**(`sliceRequest?`: any): *Promise‹DataEntity[]›*

*Defined in [operations/core/fetcher-core.ts:16](https://github.com/terascope/teraslice/blob/0ae31df4/packages/job-components/src/operations/core/fetcher-core.ts#L16)*

A generic method called by the Teraslice framework to a give a "Fetcher"
the ability to handle the fetch operation

**Parameters:**

Name | Type |
------ | ------ |
`sliceRequest?` | any |

**Returns:** *Promise‹DataEntity[]›*

___

###  initialize

▸ **initialize**(): *Promise‹void›*

*Inherited from [OperationCore](operationcore.md).[initialize](operationcore.md#initialize)*

*Overrides [Core](core.md).[initialize](core.md#abstract-initialize)*

*Defined in [operations/core/operation-core.ts:40](https://github.com/terascope/teraslice/blob/0ae31df4/packages/job-components/src/operations/core/operation-core.ts#L40)*

**Returns:** *Promise‹void›*

___

###  rejectRecord

▸ **rejectRecord**(`input`: any, `err`: Error): *never | null*

*Inherited from [OperationCore](operationcore.md).[rejectRecord](operationcore.md#rejectrecord)*

*Defined in [operations/core/operation-core.ts:96](https://github.com/terascope/teraslice/blob/0ae31df4/packages/job-components/src/operations/core/operation-core.ts#L96)*

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
`err` | Error |

**Returns:** *never | null*

null

___

###  shutdown

▸ **shutdown**(): *Promise‹void›*

*Implementation of [WorkerOperationLifeCycle](../interfaces/workeroperationlifecycle.md)*

*Inherited from [OperationCore](operationcore.md).[shutdown](operationcore.md#shutdown)*

*Overrides [Core](core.md).[shutdown](core.md#abstract-shutdown)*

*Defined in [operations/core/operation-core.ts:44](https://github.com/terascope/teraslice/blob/0ae31df4/packages/job-components/src/operations/core/operation-core.ts#L44)*

**Returns:** *Promise‹void›*

___

###  tryRecord

▸ **tryRecord**<**I**, **R**>(`fn`: function): *function*

*Inherited from [OperationCore](operationcore.md).[tryRecord](operationcore.md#tryrecord)*

*Defined in [operations/core/operation-core.ts:71](https://github.com/terascope/teraslice/blob/0ae31df4/packages/job-components/src/operations/core/operation-core.ts#L71)*

Try catch a transformation on a record and place any failed records in a dead letter queue

See {@link #rejectRecord} for handling

**Type parameters:**

▪ **I**

▪ **R**

**Parameters:**

▪ **fn**: *function*

a function to transform the data with

▸ (`input`: I): *R*

**Parameters:**

Name | Type |
------ | ------ |
`input` | I |

**Returns:** *function*

a curried a function that will be called
with the data and handle the dead letter action

▸ (`input`: I): *R | null*

**Parameters:**

Name | Type |
------ | ------ |
`input` | I |
