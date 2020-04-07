---
title: Job Components: `EachProcessor`
sidebar_label: EachProcessor
---

# Class: EachProcessor <**T**>

A variation of Processor that can process a single DataEntity at a time.
This processor should have limit the side-effects on the data.

## Type parameters

▪ **T**

## Hierarchy

  ↳ [ProcessorCore](processorcore.md)‹T›

  ↳ **EachProcessor**

## Implements

* [OperationLifeCycle](../interfaces/operationlifecycle.md)
* [WorkerOperationLifeCycle](../interfaces/workeroperationlifecycle.md)

## Index

### Constructors

* [constructor](eachprocessor.md#constructor)

### Properties

* [context](eachprocessor.md#context)
* [deadLetterAction](eachprocessor.md#deadletteraction)
* [events](eachprocessor.md#events)
* [executionConfig](eachprocessor.md#executionconfig)
* [logger](eachprocessor.md#logger)
* [opConfig](eachprocessor.md#opconfig)

### Methods

* [createAPI](eachprocessor.md#createapi)
* [forEach](eachprocessor.md#abstract-foreach)
* [getAPI](eachprocessor.md#getapi)
* [handle](eachprocessor.md#handle)
* [initialize](eachprocessor.md#initialize)
* [rejectRecord](eachprocessor.md#rejectrecord)
* [shutdown](eachprocessor.md#shutdown)
* [tryRecord](eachprocessor.md#tryrecord)

## Constructors

###  constructor

\+ **new EachProcessor**(`context`: [WorkerContext](../interfaces/workercontext.md), `opConfig`: [OpConfig](../interfaces/opconfig.md) & T, `executionConfig`: [ExecutionConfig](../interfaces/executionconfig.md)): *[EachProcessor](eachprocessor.md)*

*Inherited from [OperationCore](operationcore.md).[constructor](operationcore.md#constructor)*

*Overrides [Core](core.md).[constructor](core.md#constructor)*

*Defined in [packages/job-components/src/operations/core/operation-core.ts:28](https://github.com/terascope/teraslice/blob/f95bb5556/packages/job-components/src/operations/core/operation-core.ts#L28)*

**Parameters:**

Name | Type |
------ | ------ |
`context` | [WorkerContext](../interfaces/workercontext.md) |
`opConfig` | [OpConfig](../interfaces/opconfig.md) & T |
`executionConfig` | [ExecutionConfig](../interfaces/executionconfig.md) |

**Returns:** *[EachProcessor](eachprocessor.md)*

## Properties

###  context

• **context**: *Readonly‹[WorkerContext](../interfaces/workercontext.md)›*

*Inherited from [Core](core.md).[context](core.md#context)*

*Defined in [packages/job-components/src/operations/core/core.ts:10](https://github.com/terascope/teraslice/blob/f95bb5556/packages/job-components/src/operations/core/core.ts#L10)*

___

###  deadLetterAction

• **deadLetterAction**: *[DeadLetterAction](../overview.md#deadletteraction)*

*Inherited from [OperationCore](operationcore.md).[deadLetterAction](operationcore.md#deadletteraction)*

*Defined in [packages/job-components/src/operations/core/operation-core.ts:28](https://github.com/terascope/teraslice/blob/f95bb5556/packages/job-components/src/operations/core/operation-core.ts#L28)*

___

###  events

• **events**: *EventEmitter*

*Inherited from [Core](core.md).[events](core.md#events)*

*Defined in [packages/job-components/src/operations/core/core.ts:13](https://github.com/terascope/teraslice/blob/f95bb5556/packages/job-components/src/operations/core/core.ts#L13)*

___

###  executionConfig

• **executionConfig**: *Readonly‹[ExecutionConfig](../interfaces/executionconfig.md)›*

*Inherited from [Core](core.md).[executionConfig](core.md#executionconfig)*

*Defined in [packages/job-components/src/operations/core/core.ts:11](https://github.com/terascope/teraslice/blob/f95bb5556/packages/job-components/src/operations/core/core.ts#L11)*

___

###  logger

• **logger**: *Logger*

*Inherited from [Core](core.md).[logger](core.md#logger)*

*Defined in [packages/job-components/src/operations/core/core.ts:12](https://github.com/terascope/teraslice/blob/f95bb5556/packages/job-components/src/operations/core/core.ts#L12)*

___

###  opConfig

• **opConfig**: *Readonly‹[OpConfig](../interfaces/opconfig.md) & T›*

*Inherited from [OperationCore](operationcore.md).[opConfig](operationcore.md#opconfig)*

*Defined in [packages/job-components/src/operations/core/operation-core.ts:27](https://github.com/terascope/teraslice/blob/f95bb5556/packages/job-components/src/operations/core/operation-core.ts#L27)*

## Methods

###  createAPI

▸ **createAPI**<**A**>(`name`: string, ...`params`: any[]): *Promise‹A›*

*Inherited from [OperationCore](operationcore.md).[createAPI](operationcore.md#createapi)*

*Defined in [packages/job-components/src/operations/core/operation-core.ts:51](https://github.com/terascope/teraslice/blob/f95bb5556/packages/job-components/src/operations/core/operation-core.ts#L51)*

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

### `Abstract` forEach

▸ **forEach**(`data`: DataEntity, `index`: number, `array`: DataEntity[]): *void*

*Defined in [packages/job-components/src/operations/each-processor.ts:15](https://github.com/terascope/teraslice/blob/f95bb5556/packages/job-components/src/operations/each-processor.ts#L15)*

Called by {@link Processor#handle} and will handle single {@link DataEntity}

**Parameters:**

Name | Type |
------ | ------ |
`data` | DataEntity |
`index` | number |
`array` | DataEntity[] |

**Returns:** *void*

void in order to avoid side-effects

___

###  getAPI

▸ **getAPI**<**A**>(`name`: string): *A*

*Inherited from [OperationCore](operationcore.md).[getAPI](operationcore.md#getapi)*

*Defined in [packages/job-components/src/operations/core/operation-core.ts:58](https://github.com/terascope/teraslice/blob/f95bb5556/packages/job-components/src/operations/core/operation-core.ts#L58)*

Get a reference to an existing API

**Type parameters:**

▪ **A**: *[OpAPI](../overview.md#opapi)*

**Parameters:**

Name | Type |
------ | ------ |
`name` | string |

**Returns:** *A*

___

###  handle

▸ **handle**(`input`: DataEntity[]): *Promise‹DataEntity[]›*

*Overrides [ProcessorCore](processorcore.md).[handle](processorcore.md#abstract-handle)*

*Defined in [packages/job-components/src/operations/each-processor.ts:22](https://github.com/terascope/teraslice/blob/f95bb5556/packages/job-components/src/operations/each-processor.ts#L22)*

A generic method called by the Teraslice framework, calls {@link #forEach}

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`input` | DataEntity[] | an array of DataEntities |

**Returns:** *Promise‹DataEntity[]›*

an array of DataEntities

___

###  initialize

▸ **initialize**(): *Promise‹void›*

*Inherited from [OperationCore](operationcore.md).[initialize](operationcore.md#initialize)*

*Overrides [Core](core.md).[initialize](core.md#abstract-initialize)*

*Defined in [packages/job-components/src/operations/core/operation-core.ts:40](https://github.com/terascope/teraslice/blob/f95bb5556/packages/job-components/src/operations/core/operation-core.ts#L40)*

**Returns:** *Promise‹void›*

___

###  rejectRecord

▸ **rejectRecord**(`input`: any, `err`: Error): *never | null*

*Inherited from [OperationCore](operationcore.md).[rejectRecord](operationcore.md#rejectrecord)*

*Defined in [packages/job-components/src/operations/core/operation-core.ts:96](https://github.com/terascope/teraslice/blob/f95bb5556/packages/job-components/src/operations/core/operation-core.ts#L96)*

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

*Defined in [packages/job-components/src/operations/core/operation-core.ts:44](https://github.com/terascope/teraslice/blob/f95bb5556/packages/job-components/src/operations/core/operation-core.ts#L44)*

**Returns:** *Promise‹void›*

___

###  tryRecord

▸ **tryRecord**<**I**, **R**>(`fn`: function): *function*

*Inherited from [OperationCore](operationcore.md).[tryRecord](operationcore.md#tryrecord)*

*Defined in [packages/job-components/src/operations/core/operation-core.ts:71](https://github.com/terascope/teraslice/blob/f95bb5556/packages/job-components/src/operations/core/operation-core.ts#L71)*

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
