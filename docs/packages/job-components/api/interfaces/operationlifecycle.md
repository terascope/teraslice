---
title: Job Components Operationlifecycle
sidebar_label: Operationlifecycle
---

[OperationLifeCycle](operationlifecycle.md) /

# Interface: OperationLifeCycle

## Hierarchy

* **OperationLifeCycle**

  * [WorkerOperationLifeCycle](workeroperationlifecycle.md)

  * [SlicerOperationLifeCycle](sliceroperationlifecycle.md)

## Implemented by

* [APICore](../classes/apicore.md)
* [BatchProcessor](../classes/batchprocessor.md)
* [Collect](../classes/collect.md)
* [Core](../classes/core.md)
* [Delay](../classes/delay.md)
* [EachProcessor](../classes/eachprocessor.md)
* [ExampleAPI](../classes/exampleapi.md)
* [ExampleAPI](../classes/exampleapi.md)
* [ExampleAPI](../classes/exampleapi.md)
* [ExampleBatch](../classes/examplebatch.md)
* [ExampleFetcher](../classes/examplefetcher.md)
* [ExampleObserver](../classes/exampleobserver.md)
* [ExampleObserver](../classes/exampleobserver.md)
* [ExampleSlicer](../classes/exampleslicer.md)
* [FailingFetcher](../classes/failingfetcher.md)
* [FailingSlicer](../classes/failingslicer.md)
* [Fetcher](../classes/fetcher.md)
* [FetcherCore](../classes/fetchercore.md)
* [FilterProcessor](../classes/filterprocessor.md)
* [JobObserver](../classes/jobobserver.md)
* [MapProcessor](../classes/mapprocessor.md)
* [Noop](../classes/noop.md)
* [Observer](../classes/observer.md)
* [OperationAPI](../classes/operationapi.md)
* [OperationCore](../classes/operationcore.md)
* [ParallelSlicer](../classes/parallelslicer.md)
* [ProcessorCore](../classes/processorcore.md)
* [Slicer](../classes/slicer.md)
* [SlicerCore](../classes/slicercore.md)
* [TestFetcher](../classes/testfetcher.md)
* [TestSlicer](../classes/testslicer.md)

### Index

#### Methods

* [initialize](operationlifecycle.md#initialize)
* [shutdown](operationlifecycle.md#shutdown)

## Methods

###  initialize

▸ **initialize**(`initConfig?`: *any*): *`Promise<void>`*

*Defined in [src/interfaces/operation-lifecycle.ts:7](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/interfaces/operation-lifecycle.ts#L7)*

Called during execution initialization

**Parameters:**

Name | Type |
------ | ------ |
`initConfig?` | any |

**Returns:** *`Promise<void>`*

___

###  shutdown

▸ **shutdown**(): *`Promise<void>`*

*Defined in [src/interfaces/operation-lifecycle.ts:12](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/interfaces/operation-lifecycle.ts#L12)*

Called during execution shutdown

**Returns:** *`Promise<void>`*
