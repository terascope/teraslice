---
title: Job Components: `TestFetcher`
sidebar_label: TestFetcher
---

# Class: TestFetcher

## Hierarchy

  * [Fetcher](fetcher.md)‹*[TestReaderConfig](../interfaces/testreaderconfig.md)*›

  * **TestFetcher**

## Implements

* [OperationLifeCycle](../interfaces/operationlifecycle.md)
* [WorkerOperationLifeCycle](../interfaces/workeroperationlifecycle.md)

### Index

#### Constructors

* [constructor](testfetcher.md#constructor)

#### Properties

* [cachedData](testfetcher.md#cacheddata)
* [context](testfetcher.md#context)
* [deadLetterAction](testfetcher.md#deadletteraction)
* [events](testfetcher.md#events)
* [executionConfig](testfetcher.md#executionconfig)
* [lastFilePath](testfetcher.md#lastfilepath)
* [logger](testfetcher.md#logger)
* [opConfig](testfetcher.md#opconfig)

#### Methods

* [createAPI](testfetcher.md#createapi)
* [fetch](testfetcher.md#fetch)
* [getAPI](testfetcher.md#getapi)
* [handle](testfetcher.md#handle)
* [initialize](testfetcher.md#initialize)
* [rejectRecord](testfetcher.md#rejectrecord)
* [shutdown](testfetcher.md#shutdown)
* [tryRecord](testfetcher.md#tryrecord)

## Constructors

###  constructor

\+ **new TestFetcher**(`context`: *[WorkerContext](../interfaces/workercontext.md)*, `opConfig`: *[OpConfig](../interfaces/opconfig.md) & [TestReaderConfig](../interfaces/testreaderconfig.md)*, `executionConfig`: *[ExecutionConfig](../interfaces/executionconfig.md)*): *[TestFetcher](testfetcher.md)*

*Inherited from [OperationCore](operationcore.md).[constructor](operationcore.md#constructor)*

*Overrides [Core](core.md).[constructor](core.md#constructor)*

*Defined in [operations/core/operation-core.ts:24](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/operations/core/operation-core.ts#L24)*

**Parameters:**

Name | Type |
------ | ------ |
`context` | [WorkerContext](../interfaces/workercontext.md) |
`opConfig` | [OpConfig](../interfaces/opconfig.md) & [TestReaderConfig](../interfaces/testreaderconfig.md) |
`executionConfig` | [ExecutionConfig](../interfaces/executionconfig.md) |

**Returns:** *[TestFetcher](testfetcher.md)*

## Properties

###  cachedData

• **cachedData**: *`Buffer` | null* =  null

*Defined in [builtin/test-reader/fetcher.ts:11](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/builtin/test-reader/fetcher.ts#L11)*

___

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

###  lastFilePath

• **lastFilePath**: *string* = ""

*Defined in [builtin/test-reader/fetcher.ts:12](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/builtin/test-reader/fetcher.ts#L12)*

___

###  logger

• **logger**: *`Logger`*

*Inherited from [Core](core.md).[logger](core.md#logger)*

*Defined in [operations/core/core.ts:12](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/operations/core/core.ts#L12)*

___

###  opConfig

• **opConfig**: *`Readonly<OpConfig & TestReaderConfig>`*

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

###  fetch

▸ **fetch**(`slice?`: *[SliceRequest](../interfaces/slicerequest.md)[]*): *`Promise<any>`*

*Overrides [Fetcher](fetcher.md).[fetch](fetcher.md#abstract-fetch)*

*Defined in [builtin/test-reader/fetcher.ts:18](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/builtin/test-reader/fetcher.ts#L18)*

**Parameters:**

Name | Type |
------ | ------ |
`slice?` | [SliceRequest](../interfaces/slicerequest.md)[] |

**Returns:** *`Promise<any>`*

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

▸ **handle**(`sliceRequest?`: *any*): *`Promise<DataEntity[]>`*

*Inherited from [Fetcher](fetcher.md).[handle](fetcher.md#handle)*

*Overrides [FetcherCore](fetchercore.md).[handle](fetchercore.md#abstract-handle)*

*Defined in [operations/fetcher.ts:16](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/operations/fetcher.ts#L16)*

**Parameters:**

Name | Type |
------ | ------ |
`sliceRequest?` | any |

**Returns:** *`Promise<DataEntity[]>`*

___

###  initialize

▸ **initialize**(): *`Promise<void>`*

*Overrides [OperationCore](operationcore.md).[initialize](operationcore.md#initialize)*

*Defined in [builtin/test-reader/fetcher.ts:14](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/builtin/test-reader/fetcher.ts#L14)*

**Returns:** *`Promise<void>`*

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
