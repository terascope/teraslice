---
title: Job Components Interfaces Operation Lifecycle Operationlifecycle
sidebar_label: Interfaces Operation Lifecycle Operationlifecycle
---

> Interfaces Operation Lifecycle Operationlifecycle for @terascope/job-components

[Globals](../overview.md) / ["interfaces/operation-lifecycle"](../modules/_interfaces_operation_lifecycle_.md) / [OperationLifeCycle](_interfaces_operation_lifecycle_.operationlifecycle.md) /

# Interface: OperationLifeCycle

## Hierarchy

* **OperationLifeCycle**

  * [WorkerOperationLifeCycle](_interfaces_operation_lifecycle_.workeroperationlifecycle.md)

  * [SlicerOperationLifeCycle](_interfaces_operation_lifecycle_.sliceroperationlifecycle.md)

## Implemented by

* [APICore](../classes/_operations_core_api_core_.apicore.md)
* [BatchProcessor](../classes/_operations_batch_processor_.batchprocessor.md)
* [Collect](../classes/_builtin_collect_processor_.collect.md)
* [Core](../classes/_operations_core_core_.core.md)
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
* [ParallelSlicer](../classes/_operations_parallel_slicer_.parallelslicer.md)
* [ProcessorCore](../classes/_operations_core_processor_core_.processorcore.md)
* [Slicer](../classes/_operations_slicer_.slicer.md)
* [SlicerCore](../classes/_operations_core_slicer_core_.slicercore.md)
* [TestFetcher](../classes/_builtin_test_reader_fetcher_.testfetcher.md)
* [TestSlicer](../classes/_builtin_test_reader_slicer_.testslicer.md)

### Index

#### Methods

* [initialize](_interfaces_operation_lifecycle_.operationlifecycle.md#initialize)
* [shutdown](_interfaces_operation_lifecycle_.operationlifecycle.md#shutdown)

## Methods

###  initialize

▸ **initialize**(`initConfig?`: *any*): *`Promise<void>`*

*Defined in [interfaces/operation-lifecycle.ts:7](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/operation-lifecycle.ts#L7)*

Called during execution initialization

**Parameters:**

Name | Type |
------ | ------ |
`initConfig?` | any |

**Returns:** *`Promise<void>`*

___

###  shutdown

▸ **shutdown**(): *`Promise<void>`*

*Defined in [interfaces/operation-lifecycle.ts:12](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/operation-lifecycle.ts#L12)*

Called during execution shutdown

**Returns:** *`Promise<void>`*
