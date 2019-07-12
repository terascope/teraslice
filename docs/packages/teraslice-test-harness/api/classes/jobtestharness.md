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

### Index

#### Constructors

* [constructor](jobtestharness.md#constructor)

#### Accessors

* [apis](jobtestharness.md#apis)
* [processors](jobtestharness.md#processors)

#### Methods

* [fetcher](jobtestharness.md#fetcher)
* [initialize](jobtestharness.md#initialize)
* [run](jobtestharness.md#run)
* [setClients](jobtestharness.md#setclients)
* [shutdown](jobtestharness.md#shutdown)
* [slicer](jobtestharness.md#slicer)

## Constructors

###  constructor

\+ **new JobTestHarness**(`job`: `JobConfig`, `options`: [JobHarnessOptions](../interfaces/jobharnessoptions.md)): *[JobTestHarness](jobtestharness.md)*

*Defined in [job-test-harness.ts:25](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/teraslice-test-harness/src/job-test-harness.ts#L25)*

**Parameters:**

Name | Type |
------ | ------ |
`job` | `JobConfig` |
`options` | [JobHarnessOptions](../interfaces/jobharnessoptions.md) |

**Returns:** *[JobTestHarness](jobtestharness.md)*

## Accessors

###  apis

• **get apis**(): *object*

*Defined in [job-test-harness.ts:44](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/teraslice-test-harness/src/job-test-harness.ts#L44)*

**Returns:** *object*

___

###  processors

• **get processors**(): *`ProcessorCore<OpConfig>`[]*

*Defined in [job-test-harness.ts:40](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/teraslice-test-harness/src/job-test-harness.ts#L40)*

**Returns:** *`ProcessorCore<OpConfig>`[]*

## Methods

###  fetcher

▸ **fetcher**<**T**>(): *`T`*

*Defined in [job-test-harness.ts:36](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/teraslice-test-harness/src/job-test-harness.ts#L36)*

**Type parameters:**

▪ **T**: *`FetcherCore`*

**Returns:** *`T`*

___

###  initialize

▸ **initialize**(`recoveryData?`: object[]): *`Promise<void>`*

*Defined in [job-test-harness.ts:63](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/teraslice-test-harness/src/job-test-harness.ts#L63)*

Initialize the Operations in both of the Slicer
and Worker contexts.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`recoveryData?` | object[] | is an array of starting points to recover from the retry data is only passed to slicer  |

**Returns:** *`Promise<void>`*

___

###  run

▸ **run**(): *`Promise<BatchedResults>`*

*Defined in [job-test-harness.ts:74](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/teraslice-test-harness/src/job-test-harness.ts#L74)*

Create a batch of slices in the Slicer context
and then run each slice on the Worker context
in series.

**Returns:** *`Promise<BatchedResults>`*

batches of results

___

###  setClients

▸ **setClients**(`clients`: `TestClientConfig`[]): *`Promise<void>`*

*Defined in [job-test-harness.ts:52](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/teraslice-test-harness/src/job-test-harness.ts#L52)*

Set the Terafoundation Clients on both
the Slicer and Worker contexts

**Parameters:**

Name | Type |
------ | ------ |
`clients` | `TestClientConfig`[] |

**Returns:** *`Promise<void>`*

___

###  shutdown

▸ **shutdown**(): *`Promise<void>`*

*Defined in [job-test-harness.ts:112](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/teraslice-test-harness/src/job-test-harness.ts#L112)*

Shutdown both the Worker and Slicer test harness

**Returns:** *`Promise<void>`*

___

###  slicer

▸ **slicer**<**T**>(): *`T`*

*Defined in [job-test-harness.ts:32](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/teraslice-test-harness/src/job-test-harness.ts#L32)*

**Type parameters:**

▪ **T**: *`SlicerCore`*

**Returns:** *`T`*
