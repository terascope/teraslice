---
title: Job Components Interfaces Operation Lifecycle Workeroperationlifecycle
sidebar_label: Interfaces Operation Lifecycle Workeroperationlifecycle
---

> Interfaces Operation Lifecycle Workeroperationlifecycle for @terascope/job-components

[Globals](../overview.md) / ["interfaces/operation-lifecycle"](../modules/_interfaces_operation_lifecycle_.md) / [WorkerOperationLifeCycle](_interfaces_operation_lifecycle_.workeroperationlifecycle.md) /

# Interface: WorkerOperationLifeCycle

## Hierarchy

* [OperationLifeCycle](_interfaces_operation_lifecycle_.operationlifecycle.md)

  * **WorkerOperationLifeCycle**

## Implemented by

* [APICore](../classes/_operations_core_api_core_.apicore.md)
* [BatchProcessor](../classes/_operations_batch_processor_.batchprocessor.md)
* [Collect](../classes/_builtin_collect_processor_.collect.md)
* [Delay](../classes/_builtin_delay_processor_.delay.md)
* [EachProcessor](../classes/_operations_each_processor_.eachprocessor.md)
* [Fetcher](../classes/_operations_fetcher_.fetcher.md)
* [FetcherCore](../classes/_operations_core_fetcher_core_.fetchercore.md)
* [FilterProcessor](../classes/_operations_filter_processor_.filterprocessor.md)
* [JobObserver](../classes/_operations_job_observer_.jobobserver.md)
* [MapProcessor](../classes/_operations_map_processor_.mapprocessor.md)
* [Noop](../classes/_builtin_noop_processor_.noop.md)
* [Observer](../classes/_operations_observer_.observer.md)
* [OperationAPI](../classes/_operations_operation_api_.operationapi.md)
* [OperationCore](../classes/_operations_core_operation_core_.operationcore.md)
* [ProcessorCore](../classes/_operations_core_processor_core_.processorcore.md)
* [TestFetcher](../classes/_builtin_test_reader_fetcher_.testfetcher.md)
* [WorkerExecutionContext](../classes/_execution_context_worker_.workerexecutioncontext.md)

### Index

#### Methods

* [initialize](_interfaces_operation_lifecycle_.workeroperationlifecycle.md#initialize)
* [onFlushEnd](_interfaces_operation_lifecycle_.workeroperationlifecycle.md#optional-onflushend)
* [onFlushStart](_interfaces_operation_lifecycle_.workeroperationlifecycle.md#optional-onflushstart)
* [onOperationComplete](_interfaces_operation_lifecycle_.workeroperationlifecycle.md#optional-onoperationcomplete)
* [onOperationStart](_interfaces_operation_lifecycle_.workeroperationlifecycle.md#optional-onoperationstart)
* [onSliceFailed](_interfaces_operation_lifecycle_.workeroperationlifecycle.md#optional-onslicefailed)
* [onSliceFinalizing](_interfaces_operation_lifecycle_.workeroperationlifecycle.md#optional-onslicefinalizing)
* [onSliceFinished](_interfaces_operation_lifecycle_.workeroperationlifecycle.md#optional-onslicefinished)
* [onSliceInitialized](_interfaces_operation_lifecycle_.workeroperationlifecycle.md#optional-onsliceinitialized)
* [onSliceRetry](_interfaces_operation_lifecycle_.workeroperationlifecycle.md#optional-onsliceretry)
* [onSliceStarted](_interfaces_operation_lifecycle_.workeroperationlifecycle.md#optional-onslicestarted)
* [shutdown](_interfaces_operation_lifecycle_.workeroperationlifecycle.md#shutdown)

## Methods

###  initialize

▸ **initialize**(`initConfig?`: *any*): *`Promise<void>`*

*Inherited from [OperationLifeCycle](_interfaces_operation_lifecycle_.operationlifecycle.md).[initialize](_interfaces_operation_lifecycle_.operationlifecycle.md#initialize)*

*Defined in [interfaces/operation-lifecycle.ts:7](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/operation-lifecycle.ts#L7)*

Called during execution initialization

**Parameters:**

Name | Type |
------ | ------ |
`initConfig?` | any |

**Returns:** *`Promise<void>`*

___

### `Optional` onFlushEnd

▸ **onFlushEnd**(`sliceId`: *string*): *`Promise<void>`*

*Defined in [interfaces/operation-lifecycle.ts:79](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/operation-lifecycle.ts#L79)*

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

*Defined in [interfaces/operation-lifecycle.ts:73](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/operation-lifecycle.ts#L73)*

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

▸ **onOperationComplete**(`sliceId`: *string*, `index`: *number*, `processed`: *number*): *void*

*Defined in [interfaces/operation-lifecycle.ts:66](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/operation-lifecycle.ts#L66)*

Called immediately after an operation has ended

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`sliceId` | string | is the id of the slice being processed |
`index` | number | the index to the operation which completed |
`processed` | number | is the number of records returned from the op  |

**Returns:** *void*

___

### `Optional` onOperationStart

▸ **onOperationStart**(`sliceId`: *string*, `index`: *number*): *void*

*Defined in [interfaces/operation-lifecycle.ts:57](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/operation-lifecycle.ts#L57)*

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

*Defined in [interfaces/operation-lifecycle.ts:40](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/operation-lifecycle.ts#L40)*

Called after the slice has been marked as "Failed"

**Parameters:**

Name | Type |
------ | ------ |
`sliceId` | string |

**Returns:** *`Promise<void>`*

___

### `Optional` onSliceFinalizing

▸ **onSliceFinalizing**(`sliceId`: *string*): *`Promise<void>`*

*Defined in [interfaces/operation-lifecycle.ts:30](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/operation-lifecycle.ts#L30)*

Called after a slice is done with the last operation in the execution

**Parameters:**

Name | Type |
------ | ------ |
`sliceId` | string |

**Returns:** *`Promise<void>`*

___

### `Optional` onSliceFinished

▸ **onSliceFinished**(`sliceId`: *string*): *`Promise<void>`*

*Defined in [interfaces/operation-lifecycle.ts:35](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/operation-lifecycle.ts#L35)*

Called after the slice has been acknowledged by the "Execution Controller"

**Parameters:**

Name | Type |
------ | ------ |
`sliceId` | string |

**Returns:** *`Promise<void>`*

___

### `Optional` onSliceInitialized

▸ **onSliceInitialized**(`sliceId`: *string*): *`Promise<void>`*

*Defined in [interfaces/operation-lifecycle.ts:20](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/operation-lifecycle.ts#L20)*

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

*Defined in [interfaces/operation-lifecycle.ts:48](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/operation-lifecycle.ts#L48)*

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

*Defined in [interfaces/operation-lifecycle.ts:25](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/operation-lifecycle.ts#L25)*

Called after a the slice is sent to the "Fetcher"

**Parameters:**

Name | Type |
------ | ------ |
`sliceId` | string |

**Returns:** *`Promise<void>`*

___

###  shutdown

▸ **shutdown**(): *`Promise<void>`*

*Inherited from [OperationLifeCycle](_interfaces_operation_lifecycle_.operationlifecycle.md).[shutdown](_interfaces_operation_lifecycle_.operationlifecycle.md#shutdown)*

*Defined in [interfaces/operation-lifecycle.ts:12](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/operation-lifecycle.ts#L12)*

Called during execution shutdown

**Returns:** *`Promise<void>`*
