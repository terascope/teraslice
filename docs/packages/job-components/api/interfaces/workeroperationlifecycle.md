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

### Index

#### Methods

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

▸ **initialize**(`initConfig?`: *any*): *`Promise<void>`*

*Inherited from [OperationLifeCycle](operationlifecycle.md).[initialize](operationlifecycle.md#initialize)*

*Defined in [interfaces/operation-lifecycle.ts:9](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/interfaces/operation-lifecycle.ts#L9)*

Called during execution initialization,
when this is called perform any async setup.

**Parameters:**

Name | Type |
------ | ------ |
`initConfig?` | any |

**Returns:** *`Promise<void>`*

___

### `Optional` onFlushEnd

▸ **onFlushEnd**(`sliceId`: *string*): *`Promise<void>`*

*Defined in [interfaces/operation-lifecycle.ts:83](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/interfaces/operation-lifecycle.ts#L83)*

Called to notify the processors that the slice is finished being flushed
(shutdown will likely be called immediately afterwards)

**Parameters:**

Name | Type |
------ | ------ |
`sliceId` | string |

**Returns:** *`Promise<void>`*

___

### `Optional` onFlushStart

▸ **onFlushStart**(`sliceId`: *string*): *`Promise<void>`*

*Defined in [interfaces/operation-lifecycle.ts:77](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/interfaces/operation-lifecycle.ts#L77)*

Called to notify the processors that the next slice being
passed through will be an empty slice used to flush
any additional in-memory state.

**Parameters:**

Name | Type |
------ | ------ |
`sliceId` | string |

**Returns:** *`Promise<void>`*

___

### `Optional` onOperationComplete

▸ **onOperationComplete**(`sliceId`: *string*, `index`: *number*, `processed`: *number*, `records`: *`DataEntity`[]*): *void*

*Defined in [interfaces/operation-lifecycle.ts:70](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/interfaces/operation-lifecycle.ts#L70)*

Called immediately after an operation has ended

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`sliceId` | string | is the id of the slice being processed |
`index` | number | the index to the operation which completed |
`processed` | number | is the number of records returned from last op |
`records` | `DataEntity`[] | - |

**Returns:** *void*

___

### `Optional` onOperationStart

▸ **onOperationStart**(`sliceId`: *string*, `index`: *number*): *void*

*Defined in [interfaces/operation-lifecycle.ts:60](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/interfaces/operation-lifecycle.ts#L60)*

Called immediately before an operation is started

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`sliceId` | string | is the id of the slice being processed |
`index` | number | the index to the operation which completed |

**Returns:** *void*

___

### `Optional` onSliceFailed

▸ **onSliceFailed**(`sliceId`: *string*): *`Promise<void>`*

*Defined in [interfaces/operation-lifecycle.ts:43](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/interfaces/operation-lifecycle.ts#L43)*

Called after the slice has been marked as "Failed"

**Parameters:**

Name | Type |
------ | ------ |
`sliceId` | string |

**Returns:** *`Promise<void>`*

___

### `Optional` onSliceFinalizing

▸ **onSliceFinalizing**(`sliceId`: *string*): *`Promise<void>`*

*Defined in [interfaces/operation-lifecycle.ts:33](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/interfaces/operation-lifecycle.ts#L33)*

Called after a slice is done with the last operation in the execution

**Parameters:**

Name | Type |
------ | ------ |
`sliceId` | string |

**Returns:** *`Promise<void>`*

___

### `Optional` onSliceFinished

▸ **onSliceFinished**(`sliceId`: *string*): *`Promise<void>`*

*Defined in [interfaces/operation-lifecycle.ts:38](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/interfaces/operation-lifecycle.ts#L38)*

Called after the slice has been acknowledged by the "Execution Controller"

**Parameters:**

Name | Type |
------ | ------ |
`sliceId` | string |

**Returns:** *`Promise<void>`*

___

### `Optional` onSliceInitialized

▸ **onSliceInitialized**(`sliceId`: *string*): *`Promise<void>`*

*Defined in [interfaces/operation-lifecycle.ts:23](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/interfaces/operation-lifecycle.ts#L23)*

Called after a slice is initializated, but before the slice
has been handed to any operation.

**Parameters:**

Name | Type |
------ | ------ |
`sliceId` | string |

**Returns:** *`Promise<void>`*

___

### `Optional` onSliceRetry

▸ **onSliceRetry**(`sliceId`: *string*): *`Promise<void>`*

*Defined in [interfaces/operation-lifecycle.ts:51](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/interfaces/operation-lifecycle.ts#L51)*

Called after the operation failed to process the slice
but before the slice is retried.

**NOTE:** A retry can be stopped by throw an error inside this function

**Parameters:**

Name | Type |
------ | ------ |
`sliceId` | string |

**Returns:** *`Promise<void>`*

___

### `Optional` onSliceStarted

▸ **onSliceStarted**(`sliceId`: *string*): *`Promise<void>`*

*Defined in [interfaces/operation-lifecycle.ts:28](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/interfaces/operation-lifecycle.ts#L28)*

Called after a the slice is sent to the "Fetcher"

**Parameters:**

Name | Type |
------ | ------ |
`sliceId` | string |

**Returns:** *`Promise<void>`*

___

###  shutdown

▸ **shutdown**(): *`Promise<void>`*

*Inherited from [OperationLifeCycle](operationlifecycle.md).[shutdown](operationlifecycle.md#shutdown)*

*Defined in [interfaces/operation-lifecycle.ts:15](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/interfaces/operation-lifecycle.ts#L15)*

Called during execution shutdown,
when this is cleanup any open connections or destroy any in-memory state.

**Returns:** *`Promise<void>`*
