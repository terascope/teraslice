---
title: Teraslice Test Harness: `JobTestHarness`
sidebar_label: JobTestHarness
---

# Class: JobTestHarness

A test harness for both the Slicer and Fetcher,
utilizing both the Slicer and Worker test harnesses.

This is useful for testing Readers.

**`todo`** Handle more than one worker?

## Hierarchy

* **JobTestHarness**

## Index

### Constructors

* [constructor](jobtestharness.md#constructor)

### Accessors

* [apis](jobtestharness.md#apis)
* [processors](jobtestharness.md#processors)

### Methods

* [fetcher](jobtestharness.md#fetcher)
* [initialize](jobtestharness.md#initialize)
* [run](jobtestharness.md#run)
* [setClients](jobtestharness.md#setclients)
* [shutdown](jobtestharness.md#shutdown)
* [slicer](jobtestharness.md#slicer)

## Constructors

###  constructor

\+ **new JobTestHarness**(`job`: JobConfig, `options`: [JobHarnessOptions](../interfaces/jobharnessoptions.md)): *[JobTestHarness](jobtestharness.md)*

*Defined in [job-test-harness.ts:26](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-test-harness/src/job-test-harness.ts#L26)*

**Parameters:**

Name | Type |
------ | ------ |
`job` | JobConfig |
`options` | [JobHarnessOptions](../interfaces/jobharnessoptions.md) |

**Returns:** *[JobTestHarness](jobtestharness.md)*

## Accessors

###  apis

• **get apis**(): *object*

*Defined in [job-test-harness.ts:45](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-test-harness/src/job-test-harness.ts#L45)*

**Returns:** *object*

___

###  processors

• **get processors**(): *ProcessorCore‹OpConfig›[]*

*Defined in [job-test-harness.ts:41](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-test-harness/src/job-test-harness.ts#L41)*

**Returns:** *ProcessorCore‹OpConfig›[]*

## Methods

###  fetcher

▸ **fetcher**<**T**>(): *T*

*Defined in [job-test-harness.ts:37](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-test-harness/src/job-test-harness.ts#L37)*

**Type parameters:**

▪ **T**: *FetcherCore*

**Returns:** *T*

___

###  initialize

▸ **initialize**(`recoveryData?`: SlicerRecoveryData[]): *Promise‹void›*

*Defined in [job-test-harness.ts:64](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-test-harness/src/job-test-harness.ts#L64)*

Initialize the Operations in both of the Slicer
and Worker contexts.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`recoveryData?` | SlicerRecoveryData[] | is an array of starting points to recover from the retry data is only passed to slicer  |

**Returns:** *Promise‹void›*

___

###  run

▸ **run**(): *Promise‹[BatchedResults](../overview.md#batchedresults)›*

*Defined in [job-test-harness.ts:75](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-test-harness/src/job-test-harness.ts#L75)*

Create a batch of slices in the Slicer context
and then run each slice on the Worker context
in series.

**Returns:** *Promise‹[BatchedResults](../overview.md#batchedresults)›*

batches of results

___

###  setClients

▸ **setClients**(`clients`: TestClientConfig[]): *Promise‹void›*

*Defined in [job-test-harness.ts:53](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-test-harness/src/job-test-harness.ts#L53)*

Set the Terafoundation Clients on both
the Slicer and Worker contexts

**Parameters:**

Name | Type |
------ | ------ |
`clients` | TestClientConfig[] |

**Returns:** *Promise‹void›*

___

###  shutdown

▸ **shutdown**(): *Promise‹void›*

*Defined in [job-test-harness.ts:116](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-test-harness/src/job-test-harness.ts#L116)*

Shutdown both the Worker and Slicer test harness

**Returns:** *Promise‹void›*

___

###  slicer

▸ **slicer**<**T**>(): *T*

*Defined in [job-test-harness.ts:33](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-test-harness/src/job-test-harness.ts#L33)*

**Type parameters:**

▪ **T**: *SlicerCore*

**Returns:** *T*
