---
title: Job Components Delay
sidebar_label: Delay
---

[Delay](delay.md) /

# Class: Delay

## Hierarchy

  * [BatchProcessor](batchprocessor.md)‹*[DelayConfig](../interfaces/delayconfig.md)*›

  * **Delay**

## Implements

* [OperationLifeCycle](../interfaces/operationlifecycle.md)
* [WorkerOperationLifeCycle](../interfaces/workeroperationlifecycle.md)

### Index

#### Constructors

* [constructor](delay.md#constructor)

#### Properties

* [context](delay.md#context)
* [deadLetterAction](delay.md#deadletteraction)
* [events](delay.md#events)
* [executionConfig](delay.md#executionconfig)
* [logger](delay.md#logger)
* [opConfig](delay.md#opconfig)

#### Methods

* [createAPI](delay.md#createapi)
* [getAPI](delay.md#getapi)
* [handle](delay.md#handle)
* [initialize](delay.md#initialize)
* [onBatch](delay.md#onbatch)
* [rejectRecord](delay.md#rejectrecord)
* [shutdown](delay.md#shutdown)
* [tryRecord](delay.md#tryrecord)

## Constructors

###  constructor

\+ **new Delay**(`context`: *[WorkerContext](../interfaces/workercontext.md)*, `opConfig`: *[OpConfig](../interfaces/opconfig.md) & [DelayConfig](../interfaces/delayconfig.md)*, `executionConfig`: *[ExecutionConfig](../interfaces/executionconfig.md)*): *[Delay](delay.md)*

*Inherited from [OperationCore](operationcore.md).[constructor](operationcore.md#constructor)*

*Overrides [Core](core.md).[constructor](core.md#constructor)*

*Defined in [src/operations/core/operation-core.ts:23](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/operations/core/operation-core.ts#L23)*

**Parameters:**

Name | Type |
------ | ------ |
`context` | [WorkerContext](../interfaces/workercontext.md) |
`opConfig` | [OpConfig](../interfaces/opconfig.md) & [DelayConfig](../interfaces/delayconfig.md) |
`executionConfig` | [ExecutionConfig](../interfaces/executionconfig.md) |

**Returns:** *[Delay](delay.md)*

## Properties

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

• **opConfig**: *`Readonly<OpConfig & DelayConfig>`*

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

▸ **handle**(`input`: *`DataEntity`[]*): *`Promise<DataEntity[]>`*

*Inherited from [BatchProcessor](batchprocessor.md).[handle](batchprocessor.md#handle)*

*Overrides [ProcessorCore](processorcore.md).[handle](processorcore.md#abstract-handle)*

*Defined in [src/operations/batch-processor.ts:16](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/operations/batch-processor.ts#L16)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | `DataEntity`[] |

**Returns:** *`Promise<DataEntity[]>`*

___

###  initialize

▸ **initialize**(): *`Promise<void>`*

*Inherited from [OperationCore](operationcore.md).[initialize](operationcore.md#initialize)*

*Overrides [Core](core.md).[initialize](core.md#abstract-initialize)*

*Defined in [src/operations/core/operation-core.ts:40](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/operations/core/operation-core.ts#L40)*

**Returns:** *`Promise<void>`*

___

###  onBatch

▸ **onBatch**(`data`: *`DataEntity`[]*): *`Promise<DataEntity<object>[]>`*

*Overrides [BatchProcessor](batchprocessor.md).[onBatch](batchprocessor.md#abstract-onbatch)*

*Defined in [src/builtin/delay/processor.ts:6](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/builtin/delay/processor.ts#L6)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | `DataEntity`[] |

**Returns:** *`Promise<DataEntity<object>[]>`*

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

*Inherited from [OperationCore](operationcore.md).[shutdown](operationcore.md#shutdown)*

*Overrides [Core](core.md).[shutdown](core.md#abstract-shutdown)*

*Defined in [src/operations/core/operation-core.ts:44](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/operations/core/operation-core.ts#L44)*

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
