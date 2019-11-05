---
title: Job Components: `Collect`
sidebar_label: Collect
---

# Class: Collect

## Hierarchy

  ↳ [BatchProcessor](batchprocessor.md)‹[CollectConfig](../interfaces/collectconfig.md)›

  ↳ **Collect**

## Implements

* [OperationLifeCycle](../interfaces/operationlifecycle.md)
* [WorkerOperationLifeCycle](../interfaces/workeroperationlifecycle.md)

## Index

### Constructors

* [constructor](collect.md#constructor)

### Properties

* [collector](collect.md#collector)
* [context](collect.md#context)
* [deadLetterAction](collect.md#deadletteraction)
* [events](collect.md#events)
* [executionConfig](collect.md#executionconfig)
* [logger](collect.md#logger)
* [opConfig](collect.md#opconfig)

### Methods

* [createAPI](collect.md#createapi)
* [getAPI](collect.md#getapi)
* [handle](collect.md#handle)
* [initialize](collect.md#initialize)
* [onBatch](collect.md#onbatch)
* [rejectRecord](collect.md#rejectrecord)
* [shutdown](collect.md#shutdown)
* [tryRecord](collect.md#tryrecord)

## Constructors

###  constructor

\+ **new Collect**(`context`: [WorkerContext](../interfaces/workercontext.md), `opConfig`: [CollectConfig](../interfaces/collectconfig.md), `executionConfig`: [ExecutionConfig](../interfaces/executionconfig.md)): *[Collect](collect.md)*

*Overrides [OperationCore](operationcore.md).[constructor](operationcore.md#constructor)*

*Defined in [builtin/collect/processor.ts:7](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/builtin/collect/processor.ts#L7)*

**Parameters:**

Name | Type |
------ | ------ |
`context` | [WorkerContext](../interfaces/workercontext.md) |
`opConfig` | [CollectConfig](../interfaces/collectconfig.md) |
`executionConfig` | [ExecutionConfig](../interfaces/executionconfig.md) |

**Returns:** *[Collect](collect.md)*

## Properties

###  collector

• **collector**: *Collector‹DataEntity›*

*Defined in [builtin/collect/processor.ts:7](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/builtin/collect/processor.ts#L7)*

___

###  context

• **context**: *Readonly‹[WorkerContext](../interfaces/workercontext.md)›*

*Inherited from [Core](core.md).[context](core.md#context)*

*Defined in [operations/core/core.ts:10](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/operations/core/core.ts#L10)*

___

###  deadLetterAction

• **deadLetterAction**: *[DeadLetterAction](../overview.md#deadletteraction)*

*Inherited from [OperationCore](operationcore.md).[deadLetterAction](operationcore.md#deadletteraction)*

*Defined in [operations/core/operation-core.ts:28](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/operations/core/operation-core.ts#L28)*

___

###  events

• **events**: *EventEmitter*

*Inherited from [Core](core.md).[events](core.md#events)*

*Defined in [operations/core/core.ts:13](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/operations/core/core.ts#L13)*

___

###  executionConfig

• **executionConfig**: *Readonly‹[ExecutionConfig](../interfaces/executionconfig.md)›*

*Inherited from [Core](core.md).[executionConfig](core.md#executionconfig)*

*Defined in [operations/core/core.ts:11](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/operations/core/core.ts#L11)*

___

###  logger

• **logger**: *Logger*

*Inherited from [Core](core.md).[logger](core.md#logger)*

*Defined in [operations/core/core.ts:12](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/operations/core/core.ts#L12)*

___

###  opConfig

• **opConfig**: *Readonly‹[OpConfig](../interfaces/opconfig.md) & [CollectConfig](../interfaces/collectconfig.md)›*

*Inherited from [OperationCore](operationcore.md).[opConfig](operationcore.md#opconfig)*

*Defined in [operations/core/operation-core.ts:27](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/operations/core/operation-core.ts#L27)*

## Methods

###  createAPI

▸ **createAPI**<**A**>(`name`: string, ...`params`: any[]): *Promise‹A›*

*Inherited from [OperationCore](operationcore.md).[createAPI](operationcore.md#createapi)*

*Defined in [operations/core/operation-core.ts:51](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/operations/core/operation-core.ts#L51)*

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

*Defined in [operations/core/operation-core.ts:58](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/operations/core/operation-core.ts#L58)*

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

*Inherited from [BatchProcessor](batchprocessor.md).[handle](batchprocessor.md#handle)*

*Overrides [ProcessorCore](processorcore.md).[handle](processorcore.md#abstract-handle)*

*Defined in [operations/batch-processor.ts:15](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/operations/batch-processor.ts#L15)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | DataEntity[] |

**Returns:** *Promise‹DataEntity[]›*

___

###  initialize

▸ **initialize**(): *Promise‹void›*

*Inherited from [OperationCore](operationcore.md).[initialize](operationcore.md#initialize)*

*Overrides [Core](core.md).[initialize](core.md#abstract-initialize)*

*Defined in [operations/core/operation-core.ts:40](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/operations/core/operation-core.ts#L40)*

**Returns:** *Promise‹void›*

___

###  onBatch

▸ **onBatch**(`batch`: DataEntity[]): *Promise‹DataEntity‹object, __type›[]›*

*Overrides [BatchProcessor](batchprocessor.md).[onBatch](batchprocessor.md#abstract-onbatch)*

*Defined in [builtin/collect/processor.ts:14](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/builtin/collect/processor.ts#L14)*

**Parameters:**

Name | Type |
------ | ------ |
`batch` | DataEntity[] |

**Returns:** *Promise‹DataEntity‹object, __type›[]›*

___

###  rejectRecord

▸ **rejectRecord**(`input`: any, `err`: Error): *never | null*

*Inherited from [OperationCore](operationcore.md).[rejectRecord](operationcore.md#rejectrecord)*

*Defined in [operations/core/operation-core.ts:96](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/operations/core/operation-core.ts#L96)*

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

*Overrides [OperationCore](operationcore.md).[shutdown](operationcore.md#shutdown)*

*Defined in [builtin/collect/processor.ts:20](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/builtin/collect/processor.ts#L20)*

**Returns:** *Promise‹void›*

___

###  tryRecord

▸ **tryRecord**<**I**, **R**>(`fn`: function): *function*

*Inherited from [OperationCore](operationcore.md).[tryRecord](operationcore.md#tryrecord)*

*Defined in [operations/core/operation-core.ts:71](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/operations/core/operation-core.ts#L71)*

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
