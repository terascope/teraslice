---
title: Job Components Operations Filter Processor Filterprocessor
sidebar_label: Operations Filter Processor Filterprocessor
---

> Operations Filter Processor Filterprocessor for @terascope/job-components

[Globals](../overview.md) / ["operations/filter-processor"](../modules/_operations_filter_processor_.md) / [FilterProcessor](_operations_filter_processor_.filterprocessor.md) /

# Class: FilterProcessor <**T**>

A variation of Processor that can process a single DataEntity at a time.
This processor is used to removed data from the batch of data

## Type parameters

▪ **T**

## Hierarchy

  * [ProcessorCore](_operations_core_processor_core_.processorcore.md)‹*`T`*›

  * **FilterProcessor**

## Implements

* [OperationLifeCycle](../interfaces/_interfaces_operation_lifecycle_.operationlifecycle.md)
* [WorkerOperationLifeCycle](../interfaces/_interfaces_operation_lifecycle_.workeroperationlifecycle.md)

### Index

#### Constructors

* [constructor](_operations_filter_processor_.filterprocessor.md#constructor)

#### Properties

* [context](_operations_filter_processor_.filterprocessor.md#context)
* [deadLetterAction](_operations_filter_processor_.filterprocessor.md#deadletteraction)
* [events](_operations_filter_processor_.filterprocessor.md#events)
* [executionConfig](_operations_filter_processor_.filterprocessor.md#executionconfig)
* [logger](_operations_filter_processor_.filterprocessor.md#logger)
* [opConfig](_operations_filter_processor_.filterprocessor.md#opconfig)

#### Methods

* [createAPI](_operations_filter_processor_.filterprocessor.md#createapi)
* [filter](_operations_filter_processor_.filterprocessor.md#abstract-filter)
* [getAPI](_operations_filter_processor_.filterprocessor.md#getapi)
* [handle](_operations_filter_processor_.filterprocessor.md#handle)
* [initialize](_operations_filter_processor_.filterprocessor.md#initialize)
* [rejectRecord](_operations_filter_processor_.filterprocessor.md#rejectrecord)
* [shutdown](_operations_filter_processor_.filterprocessor.md#shutdown)
* [tryRecord](_operations_filter_processor_.filterprocessor.md#tryrecord)

## Constructors

###  constructor

\+ **new FilterProcessor**(`context`: *[WorkerContext](../interfaces/_interfaces_context_.workercontext.md)*, `opConfig`: *[OpConfig](../interfaces/_interfaces_jobs_.opconfig.md) & `T`*, `executionConfig`: *[ExecutionConfig](../interfaces/_interfaces_jobs_.executionconfig.md)*): *[FilterProcessor](_operations_filter_processor_.filterprocessor.md)*

*Inherited from [OperationCore](_operations_core_operation_core_.operationcore.md).[constructor](_operations_core_operation_core_.operationcore.md#constructor)*

*Overrides [Core](_operations_core_core_.core.md).[constructor](_operations_core_core_.core.md#constructor)*

*Defined in [operations/core/operation-core.ts:23](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/operation-core.ts#L23)*

**Parameters:**

Name | Type |
------ | ------ |
`context` | [WorkerContext](../interfaces/_interfaces_context_.workercontext.md) |
`opConfig` | [OpConfig](../interfaces/_interfaces_jobs_.opconfig.md) & `T` |
`executionConfig` | [ExecutionConfig](../interfaces/_interfaces_jobs_.executionconfig.md) |

**Returns:** *[FilterProcessor](_operations_filter_processor_.filterprocessor.md)*

## Properties

###  context

• **context**: *`Readonly<WorkerContext>`*

*Inherited from [Core](_operations_core_core_.core.md).[context](_operations_core_core_.core.md#context)*

*Defined in [operations/core/core.ts:10](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/core.ts#L10)*

___

###  deadLetterAction

• **deadLetterAction**: *[DeadLetterAction](../modules/_interfaces_jobs_.md#deadletteraction)*

*Inherited from [OperationCore](_operations_core_operation_core_.operationcore.md).[deadLetterAction](_operations_core_operation_core_.operationcore.md#deadletteraction)*

*Defined in [operations/core/operation-core.ts:23](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/operation-core.ts#L23)*

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

___

###  opConfig

• **opConfig**: *`Readonly<OpConfig & T>`*

*Inherited from [OperationCore](_operations_core_operation_core_.operationcore.md).[opConfig](_operations_core_operation_core_.operationcore.md#opconfig)*

*Defined in [operations/core/operation-core.ts:22](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/operation-core.ts#L22)*

## Methods

###  createAPI

▸ **createAPI**<**A**>(`name`: *string*, ...`params`: *any[]*): *`Promise<A>`*

*Inherited from [OperationCore](_operations_core_operation_core_.operationcore.md).[createAPI](_operations_core_operation_core_.operationcore.md#createapi)*

*Defined in [operations/core/operation-core.ts:51](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/operation-core.ts#L51)*

Create an API and add it to the operation lifecycle

**Type parameters:**

▪ **A**: *[OpAPI](../modules/_interfaces_operations_.md#opapi)*

**Parameters:**

Name | Type |
------ | ------ |
`name` | string |
`...params` | any[] |

**Returns:** *`Promise<A>`*

___

### `Abstract` filter

▸ **filter**(`data`: *`DataEntity`*): *boolean*

*Defined in [operations/filter-processor.ts:15](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/filter-processor.ts#L15)*

Called by {@link Processor#handle} and will handle single {@link DataEntity}

**Parameters:**

Name | Type |
------ | ------ |
`data` | `DataEntity` |

**Returns:** *boolean*

a thruthy value to indicate whether the data should be passed on.

___

###  getAPI

▸ **getAPI**<**A**>(`name`: *string*): *`A`*

*Inherited from [OperationCore](_operations_core_operation_core_.operationcore.md).[getAPI](_operations_core_operation_core_.operationcore.md#getapi)*

*Defined in [operations/core/operation-core.ts:58](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/operation-core.ts#L58)*

Get a reference to an existing API

**Type parameters:**

▪ **A**: *[OpAPI](../modules/_interfaces_operations_.md#opapi)*

**Parameters:**

Name | Type |
------ | ------ |
`name` | string |

**Returns:** *`A`*

___

###  handle

▸ **handle**(`input`: *`DataEntity`[]*): *`Promise<DataEntity[]>`*

*Overrides [ProcessorCore](_operations_core_processor_core_.processorcore.md).[handle](_operations_core_processor_core_.processorcore.md#abstract-handle)*

*Defined in [operations/filter-processor.ts:22](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/filter-processor.ts#L22)*

A generic method called by the Teraslice framework, calls {@link #filter}

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`input` | `DataEntity`[] | an array of DataEntities |

**Returns:** *`Promise<DataEntity[]>`*

an array of DataEntities

___

###  initialize

▸ **initialize**(): *`Promise<void>`*

*Inherited from [OperationCore](_operations_core_operation_core_.operationcore.md).[initialize](_operations_core_operation_core_.operationcore.md#initialize)*

*Overrides [Core](_operations_core_core_.core.md).[initialize](_operations_core_core_.core.md#abstract-initialize)*

*Defined in [operations/core/operation-core.ts:40](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/operation-core.ts#L40)*

**Returns:** *`Promise<void>`*

___

###  rejectRecord

▸ **rejectRecord**(`input`: *any*, `err`: *`Error`*): *never | null*

*Inherited from [OperationCore](_operations_core_operation_core_.operationcore.md).[rejectRecord](_operations_core_operation_core_.operationcore.md#rejectrecord)*

*Defined in [operations/core/operation-core.ts:95](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/operation-core.ts#L95)*

Reject a record using the dead letter action

Based on [OpConfig._dead_letter_action](../interfaces/_interfaces_jobs_.opconfig.md#optional-_dead_letter_action) the transformation can
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

*Implementation of [WorkerOperationLifeCycle](../interfaces/_interfaces_operation_lifecycle_.workeroperationlifecycle.md)*

*Inherited from [OperationCore](_operations_core_operation_core_.operationcore.md).[shutdown](_operations_core_operation_core_.operationcore.md#shutdown)*

*Overrides [Core](_operations_core_core_.core.md).[shutdown](_operations_core_core_.core.md#abstract-shutdown)*

*Defined in [operations/core/operation-core.ts:44](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/operation-core.ts#L44)*

**Returns:** *`Promise<void>`*

___

###  tryRecord

▸ **tryRecord**<**I**, **R**>(`fn`: *function*): *function*

*Inherited from [OperationCore](_operations_core_operation_core_.operationcore.md).[tryRecord](_operations_core_operation_core_.operationcore.md#tryrecord)*

*Defined in [operations/core/operation-core.ts:70](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/operation-core.ts#L70)*

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
