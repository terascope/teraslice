---
title: Job Components: `MapProcessor`
sidebar_label: MapProcessor
---

# Class: MapProcessor <**T**>

A variation of Processor that can process a single DataEntity at a time.
This processor should return a modified DataEntity.

## Type parameters

▪ **T**

## Hierarchy

  * [ProcessorCore](processorcore.md)‹*`T`*›

  * **MapProcessor**

## Implements

* [OperationLifeCycle](../interfaces/operationlifecycle.md)
* [WorkerOperationLifeCycle](../interfaces/workeroperationlifecycle.md)

### Index

#### Constructors

* [constructor](mapprocessor.md#constructor)

#### Properties

* [context](mapprocessor.md#context)
* [deadLetterAction](mapprocessor.md#deadletteraction)
* [events](mapprocessor.md#events)
* [executionConfig](mapprocessor.md#executionconfig)
* [logger](mapprocessor.md#logger)
* [opConfig](mapprocessor.md#opconfig)

#### Methods

* [createAPI](mapprocessor.md#createapi)
* [getAPI](mapprocessor.md#getapi)
* [handle](mapprocessor.md#handle)
* [initialize](mapprocessor.md#initialize)
* [map](mapprocessor.md#abstract-map)
* [rejectRecord](mapprocessor.md#rejectrecord)
* [shutdown](mapprocessor.md#shutdown)
* [tryRecord](mapprocessor.md#tryrecord)

## Constructors

###  constructor

\+ **new MapProcessor**(`context`: *[WorkerContext](../interfaces/workercontext.md)*, `opConfig`: *[OpConfig](../interfaces/opconfig.md) & `T`*, `executionConfig`: *[ExecutionConfig](../interfaces/executionconfig.md)*): *[MapProcessor](mapprocessor.md)*

*Inherited from [OperationCore](operationcore.md).[constructor](operationcore.md#constructor)*

*Overrides [Core](core.md).[constructor](core.md#constructor)*

*Defined in [operations/core/operation-core.ts:24](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/operations/core/operation-core.ts#L24)*

**Parameters:**

Name | Type |
------ | ------ |
`context` | [WorkerContext](../interfaces/workercontext.md) |
`opConfig` | [OpConfig](../interfaces/opconfig.md) & `T` |
`executionConfig` | [ExecutionConfig](../interfaces/executionconfig.md) |

**Returns:** *[MapProcessor](mapprocessor.md)*

## Properties

###  context

• **context**: *`Readonly<WorkerContext>`*

*Inherited from [Core](core.md).[context](core.md#context)*

*Defined in [operations/core/core.ts:10](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/operations/core/core.ts#L10)*

___

###  deadLetterAction

• **deadLetterAction**: *[DeadLetterAction](../overview.md#deadletteraction)*

*Inherited from [OperationCore](operationcore.md).[deadLetterAction](operationcore.md#deadletteraction)*

*Defined in [operations/core/operation-core.ts:24](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/operations/core/operation-core.ts#L24)*

___

###  events

• **events**: *`EventEmitter`*

*Inherited from [Core](core.md).[events](core.md#events)*

*Defined in [operations/core/core.ts:13](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/operations/core/core.ts#L13)*

___

###  executionConfig

• **executionConfig**: *`Readonly<ExecutionConfig>`*

*Inherited from [Core](core.md).[executionConfig](core.md#executionconfig)*

*Defined in [operations/core/core.ts:11](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/operations/core/core.ts#L11)*

___

###  logger

• **logger**: *`Logger`*

*Inherited from [Core](core.md).[logger](core.md#logger)*

*Defined in [operations/core/core.ts:12](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/operations/core/core.ts#L12)*

___

###  opConfig

• **opConfig**: *`Readonly<OpConfig & T>`*

*Inherited from [OperationCore](operationcore.md).[opConfig](operationcore.md#opconfig)*

*Defined in [operations/core/operation-core.ts:23](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/operations/core/operation-core.ts#L23)*

## Methods

###  createAPI

▸ **createAPI**<**A**>(`name`: *string*, ...`params`: *any[]*): *`Promise<A>`*

*Inherited from [OperationCore](operationcore.md).[createAPI](operationcore.md#createapi)*

*Defined in [operations/core/operation-core.ts:52](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/operations/core/operation-core.ts#L52)*

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

*Defined in [operations/core/operation-core.ts:59](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/operations/core/operation-core.ts#L59)*

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

*Overrides [ProcessorCore](processorcore.md).[handle](processorcore.md#abstract-handle)*

*Defined in [operations/map-processor.ts:22](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/operations/map-processor.ts#L22)*

A generic method called by the Teraslice framework, calls {@link #map}

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`input` | `DataEntity`[] | an array of DataEntities |

**Returns:** *`Promise<DataEntity[]>`*

an array of DataEntities

___

###  initialize

▸ **initialize**(): *`Promise<void>`*

*Inherited from [OperationCore](operationcore.md).[initialize](operationcore.md#initialize)*

*Overrides [Core](core.md).[initialize](core.md#abstract-initialize)*

*Defined in [operations/core/operation-core.ts:41](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/operations/core/operation-core.ts#L41)*

**Returns:** *`Promise<void>`*

___

### `Abstract` map

▸ **map**(`data`: *`DataEntity`*): *`DataEntity`*

*Defined in [operations/map-processor.ts:15](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/operations/map-processor.ts#L15)*

Called by {@link Processor#handle} and will handle single {@link DataEntity}

**Parameters:**

Name | Type |
------ | ------ |
`data` | `DataEntity` |

**Returns:** *`DataEntity`*

a DataEntity

___

###  rejectRecord

▸ **rejectRecord**(`input`: *any*, `err`: *`Error`*): *never | null*

*Inherited from [OperationCore](operationcore.md).[rejectRecord](operationcore.md#rejectrecord)*

*Defined in [operations/core/operation-core.ts:96](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/operations/core/operation-core.ts#L96)*

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

null

___

###  shutdown

▸ **shutdown**(): *`Promise<void>`*

*Implementation of [WorkerOperationLifeCycle](../interfaces/workeroperationlifecycle.md)*

*Inherited from [OperationCore](operationcore.md).[shutdown](operationcore.md#shutdown)*

*Overrides [Core](core.md).[shutdown](core.md#abstract-shutdown)*

*Defined in [operations/core/operation-core.ts:45](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/operations/core/operation-core.ts#L45)*

**Returns:** *`Promise<void>`*

___

###  tryRecord

▸ **tryRecord**<**I**, **R**>(`fn`: *function*): *function*

*Inherited from [OperationCore](operationcore.md).[tryRecord](operationcore.md#tryrecord)*

*Defined in [operations/core/operation-core.ts:71](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/operations/core/operation-core.ts#L71)*

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
