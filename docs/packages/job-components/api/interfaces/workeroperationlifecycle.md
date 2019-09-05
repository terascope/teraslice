---
title: Job Components: `WorkerOperationLifeCycle`
sidebar_label: WorkerOperationLifeCycle
---

# Interface: WorkerOperationLifeCycle

## Hierarchy

* [OperationLifeCycle](operationlifecycle.md)

  * **WorkerOperationLifeCycle**

## Implemented by

* [APICore](../classes/apicore.md)
* [BatchProcessor](../classes/batchprocessor.md)
* [Collect](../classes/collect.md)
* [Delay](../classes/delay.md)
* [EachProcessor](../classes/eachprocessor.md)
* [Fetcher](../classes/fetcher.md)
* [FetcherCore](../classes/fetchercore.md)
* [FilterProcessor](../classes/filterprocessor.md)
* [JobObserver](../classes/jobobserver.md)
* [MapProcessor](../classes/mapprocessor.md)
* [Noop](../classes/noop.md)
* [Observer](../classes/observer.md)
* [OperationAPI](../classes/operationapi.md)
* [OperationCore](../classes/operationcore.md)
* [ProcessorCore](../classes/processorcore.md)
* [TestFetcher](../classes/testfetcher.md)
* [WorkerExecutionContext](../classes/workerexecutioncontext.md)

## Index

### Methods

* [initialize](workeroperationlifecycle.md#initialize)
* [onFlushEnd](workeroperationlifecycle.md#optional-onflushend)
* [onFlushStart](workeroperationlifecycle.md#optional-onflushstart)
* [onOperationComplete](workeroperationlifecycle.md#optional-onoperationcomplete)
* [onOperationStart](workeroperationlifecycle.md#optional-onoperationstart)
* [onSliceFailed](workeroperationlifecycle.md#optional-onslicefailed)
* [onSliceFinalizing](workeroperationlifecycle.md#optional-onslicefinalizing)
* [onSliceFinished](workeroperationlifecycle.md#optional-onslicefinished)
* [onSliceInitialized](workeroperationlifecycle.md#optional-onsliceinitialized)
* [onSliceRetry](workeroperationlifecycle.md#optional-onsliceretry)
* [onSliceStarted](workeroperationlifecycle.md#optional-onslicestarted)
* [shutdown](workeroperationlifecycle.md#shutdown)

## Methods

###  initialize

▸ **initialize**(`initConfig?`: any): *Promise‹void›*

*Inherited from [OperationLifeCycle](operationlifecycle.md).[initialize](operationlifecycle.md#initialize)*

*Defined in [interfaces/operation-lifecycle.ts:11](https://github.com/terascope/teraslice/blob/0ae31df4/packages/job-components/src/interfaces/operation-lifecycle.ts#L11)*

Called during execution initialization,
when this is called perform any async setup.

**Parameters:**

Name | Type |
------ | ------ |
`initConfig?` | any |

**Returns:** *Promise‹void›*

___

### `Optional` onFlushEnd

▸ **onFlushEnd**(`sliceId`: string): *Promise‹void›*

*Defined in [interfaces/operation-lifecycle.ts:90](https://github.com/terascope/teraslice/blob/0ae31df4/packages/job-components/src/interfaces/operation-lifecycle.ts#L90)*

Called to notify the processors that the slice is finished being flushed
(shutdown will likely be called immediately afterwards)

**Parameters:**

Name | Type |
------ | ------ |
`sliceId` | string |

**Returns:** *Promise‹void›*

___

### `Optional` onFlushStart

▸ **onFlushStart**(`sliceId`: string): *Promise‹void›*

*Defined in [interfaces/operation-lifecycle.ts:84](https://github.com/terascope/teraslice/blob/0ae31df4/packages/job-components/src/interfaces/operation-lifecycle.ts#L84)*

Called to notify the processors that the next slice being
passed through will be an empty slice used to flush
any additional in-memory state.

**Parameters:**

Name | Type |
------ | ------ |
`sliceId` | string |

**Returns:** *Promise‹void›*

___

### `Optional` onOperationComplete

▸ **onOperationComplete**(`sliceId`: string, `index`: number, `processed`: number, `records`: DataEntity[]): *void*

*Defined in [interfaces/operation-lifecycle.ts:72](https://github.com/terascope/teraslice/blob/0ae31df4/packages/job-components/src/interfaces/operation-lifecycle.ts#L72)*

Called immediately after an operation has ended

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`sliceId` | string | is the id of the slice being processed |
`index` | number | the index to the operation which completed |
`processed` | number | is the number of records returned from last op |
`records` | DataEntity[] | - |

**Returns:** *void*

___

### `Optional` onOperationStart

▸ **onOperationStart**(`sliceId`: string, `index`: number): *void*

*Defined in [interfaces/operation-lifecycle.ts:62](https://github.com/terascope/teraslice/blob/0ae31df4/packages/job-components/src/interfaces/operation-lifecycle.ts#L62)*

Called immediately before an operation is started

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`sliceId` | string | is the id of the slice being processed |
`index` | number | the index to the operation which completed |

**Returns:** *void*

___

### `Optional` onSliceFailed

▸ **onSliceFailed**(`sliceId`: string): *Promise‹void›*

*Defined in [interfaces/operation-lifecycle.ts:45](https://github.com/terascope/teraslice/blob/0ae31df4/packages/job-components/src/interfaces/operation-lifecycle.ts#L45)*

Called after the slice has been marked as "Failed"

**Parameters:**

Name | Type |
------ | ------ |
`sliceId` | string |

**Returns:** *Promise‹void›*

___

### `Optional` onSliceFinalizing

▸ **onSliceFinalizing**(`sliceId`: string): *Promise‹void›*

*Defined in [interfaces/operation-lifecycle.ts:35](https://github.com/terascope/teraslice/blob/0ae31df4/packages/job-components/src/interfaces/operation-lifecycle.ts#L35)*

Called after a slice is done with the last operation in the execution

**Parameters:**

Name | Type |
------ | ------ |
`sliceId` | string |

**Returns:** *Promise‹void›*

___

### `Optional` onSliceFinished

▸ **onSliceFinished**(`sliceId`: string): *Promise‹void›*

*Defined in [interfaces/operation-lifecycle.ts:40](https://github.com/terascope/teraslice/blob/0ae31df4/packages/job-components/src/interfaces/operation-lifecycle.ts#L40)*

Called after the slice has been acknowledged by the "Execution Controller"

**Parameters:**

Name | Type |
------ | ------ |
`sliceId` | string |

**Returns:** *Promise‹void›*

___

### `Optional` onSliceInitialized

▸ **onSliceInitialized**(`sliceId`: string): *Promise‹void›*

*Defined in [interfaces/operation-lifecycle.ts:25](https://github.com/terascope/teraslice/blob/0ae31df4/packages/job-components/src/interfaces/operation-lifecycle.ts#L25)*

Called after a slice is initializated, but before the slice
has been handed to any operation.

**Parameters:**

Name | Type |
------ | ------ |
`sliceId` | string |

**Returns:** *Promise‹void›*

___

### `Optional` onSliceRetry

▸ **onSliceRetry**(`sliceId`: string): *Promise‹void›*

*Defined in [interfaces/operation-lifecycle.ts:53](https://github.com/terascope/teraslice/blob/0ae31df4/packages/job-components/src/interfaces/operation-lifecycle.ts#L53)*

Called after the operation failed to process the slice
but before the slice is retried.

**NOTE:** A retry can be stopped by throw an error inside this function

**Parameters:**

Name | Type |
------ | ------ |
`sliceId` | string |

**Returns:** *Promise‹void›*

___

### `Optional` onSliceStarted

▸ **onSliceStarted**(`sliceId`: string): *Promise‹void›*

*Defined in [interfaces/operation-lifecycle.ts:30](https://github.com/terascope/teraslice/blob/0ae31df4/packages/job-components/src/interfaces/operation-lifecycle.ts#L30)*

Called after a the slice is sent to the "Fetcher"

**Parameters:**

Name | Type |
------ | ------ |
`sliceId` | string |

**Returns:** *Promise‹void›*

___

###  shutdown

▸ **shutdown**(): *Promise‹void›*

*Inherited from [OperationLifeCycle](operationlifecycle.md).[shutdown](operationlifecycle.md#shutdown)*

*Defined in [interfaces/operation-lifecycle.ts:17](https://github.com/terascope/teraslice/blob/0ae31df4/packages/job-components/src/interfaces/operation-lifecycle.ts#L17)*

Called during execution shutdown,
when this is cleanup any open connections or destroy any in-memory state.

**Returns:** *Promise‹void›*
