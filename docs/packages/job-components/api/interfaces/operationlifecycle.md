---
title: Job Components: `OperationLifeCycle`
sidebar_label: OperationLifeCycle
---

# Interface: OperationLifeCycle

## Hierarchy

* **OperationLifeCycle**

  ↳ [WorkerOperationLifeCycle](workeroperationlifecycle.md)

  ↳ [SlicerOperationLifeCycle](sliceroperationlifecycle.md)

## Implemented by

* [APICore](../classes/apicore.md)
* [BatchProcessor](../classes/batchprocessor.md)
* [Collect](../classes/collect.md)
* [Core](../classes/core.md)
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
* [ParallelSlicer](../classes/parallelslicer.md)
* [ProcessorCore](../classes/processorcore.md)
* [Slicer](../classes/slicer.md)
* [SlicerCore](../classes/slicercore.md)
* [TestFetcher](../classes/testfetcher.md)
* [TestSlicer](../classes/testslicer.md)

## Index

### Methods

* [initialize](operationlifecycle.md#initialize)
* [shutdown](operationlifecycle.md#shutdown)

## Methods

###  initialize

▸ **initialize**(`initConfig?`: any): *Promise‹void›*

*Defined in [interfaces/operation-lifecycle.ts:11](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/interfaces/operation-lifecycle.ts#L11)*

Called during execution initialization,
when this is called perform any async setup.

**Parameters:**

Name | Type |
------ | ------ |
`initConfig?` | any |

**Returns:** *Promise‹void›*

___

###  shutdown

▸ **shutdown**(): *Promise‹void›*

*Defined in [interfaces/operation-lifecycle.ts:17](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/interfaces/operation-lifecycle.ts#L17)*

Called during execution shutdown,
when this is cleanup any open connections or destroy any in-memory state.

**Returns:** *Promise‹void›*
