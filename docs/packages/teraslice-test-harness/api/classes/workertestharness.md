---
title: Teraslice Test Harness: `WorkerTestHarness`
sidebar_label: WorkerTestHarness
---

# Class: WorkerTestHarness

A test harness for testing Operations that run on Workers,
mainly Fetchers and Processors.

This is useful for testing Fetcher and Processors together or individually.

**`todo`** Add support for attaching APIs and Observers

## Hierarchy

* [BaseTestHarness](basetestharness.md)‹*`WorkerExecutionContext`*›

  * **WorkerTestHarness**

## Index

### Constructors

* [constructor](workertestharness.md#constructor)

### Properties

* [context](workertestharness.md#protected-context)
* [events](workertestharness.md#events)
* [executionContext](workertestharness.md#protected-executioncontext)

### Accessors

* [apis](workertestharness.md#apis)
* [processors](workertestharness.md#processors)

### Methods

* [fetcher](workertestharness.md#fetcher)
* [flush](workertestharness.md#flush)
* [getOperation](workertestharness.md#getoperation)
* [initialize](workertestharness.md#initialize)
* [makeContextConfig](workertestharness.md#protected-makecontextconfig)
* [runSlice](workertestharness.md#runslice)
* [setClients](workertestharness.md#setclients)
* [shutdown](workertestharness.md#shutdown)
* [testFetcher](workertestharness.md#static-testfetcher)
* [testProcessor](workertestharness.md#static-testprocessor)

## Constructors

###  constructor

\+ **new WorkerTestHarness**(`job`: `JobConfig`, `options`: [JobHarnessOptions](../interfaces/jobharnessoptions.md)): *[WorkerTestHarness](workertestharness.md)*

*Overrides [BaseTestHarness](basetestharness.md).[constructor](basetestharness.md#constructor)*

*Defined in [worker-test-harness.ts:25](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/teraslice-test-harness/src/worker-test-harness.ts#L25)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`job` | `JobConfig` | - |
`options` | [JobHarnessOptions](../interfaces/jobharnessoptions.md) |  {} |

**Returns:** *[WorkerTestHarness](workertestharness.md)*

## Properties

### `Protected` context

• **context**: *`TestContext`*

*Inherited from [BaseTestHarness](basetestharness.md).[context](basetestharness.md#protected-context)*

*Defined in [base-test-harness.ts:26](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/teraslice-test-harness/src/base-test-harness.ts#L26)*

___

###  events

• **events**: *`EventEmitter`*

*Inherited from [BaseTestHarness](basetestharness.md).[events](basetestharness.md#events)*

*Defined in [base-test-harness.ts:24](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/teraslice-test-harness/src/base-test-harness.ts#L24)*

___

### `Protected` executionContext

• **executionContext**: *`WorkerExecutionContext`*

*Inherited from [BaseTestHarness](basetestharness.md).[executionContext](basetestharness.md#protected-executioncontext)*

*Defined in [base-test-harness.ts:25](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/teraslice-test-harness/src/base-test-harness.ts#L25)*

## Accessors

###  apis

• **get apis**(): *object*

*Defined in [worker-test-harness.ts:65](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/teraslice-test-harness/src/worker-test-harness.ts#L65)*

**Returns:** *object*

___

###  processors

• **get processors**(): *`ProcessorCore<OpConfig>`[]*

*Defined in [worker-test-harness.ts:61](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/teraslice-test-harness/src/worker-test-harness.ts#L61)*

**Returns:** *`ProcessorCore<OpConfig>`[]*

## Methods

###  fetcher

▸ **fetcher**<**T**>(): *`T`*

*Defined in [worker-test-harness.ts:57](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/teraslice-test-harness/src/worker-test-harness.ts#L57)*

**Type parameters:**

▪ **T**: *`FetcherCore`*

**Returns:** *`T`*

___

###  flush

▸ **flush**(): *`Promise<DataEntity[] | undefined>`*

*Defined in [worker-test-harness.ts:127](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/teraslice-test-harness/src/worker-test-harness.ts#L127)*

Shutdown the Operations on the ExecutionContext

**Returns:** *`Promise<DataEntity[] | undefined>`*

▸ **flush**(`options`: object): *`Promise<DataEntity[] | undefined>`*

*Defined in [worker-test-harness.ts:128](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/teraslice-test-harness/src/worker-test-harness.ts#L128)*

**Parameters:**

Name | Type |
------ | ------ |
`options` | object |

**Returns:** *`Promise<DataEntity[] | undefined>`*

▸ **flush**(`options`: object): *`Promise<RunSliceResult | undefined>`*

*Defined in [worker-test-harness.ts:129](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/teraslice-test-harness/src/worker-test-harness.ts#L129)*

**Parameters:**

Name | Type |
------ | ------ |
`options` | object |

**Returns:** *`Promise<RunSliceResult | undefined>`*

___

###  getOperation

▸ **getOperation**<**T**>(`findBy`: string | number): *`T`*

*Defined in [worker-test-harness.ts:69](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/teraslice-test-harness/src/worker-test-harness.ts#L69)*

**Type parameters:**

▪ **T**: *`OperationCore`*

**Parameters:**

Name | Type |
------ | ------ |
`findBy` | string \| number |

**Returns:** *`T`*

___

###  initialize

▸ **initialize**(): *`Promise<void>`*

*Overrides [BaseTestHarness](basetestharness.md).[initialize](basetestharness.md#initialize)*

*Defined in [worker-test-harness.ts:76](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/teraslice-test-harness/src/worker-test-harness.ts#L76)*

Initialize the Operations on the ExecutionContext

**Returns:** *`Promise<void>`*

___

### `Protected` makeContextConfig

▸ **makeContextConfig**(`job`: `JobConfig`, `assetDir`: string): *`ExecutionContextConfig`*

*Inherited from [BaseTestHarness](basetestharness.md).[makeContextConfig](basetestharness.md#protected-makecontextconfig)*

*Defined in [base-test-harness.ts:58](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/teraslice-test-harness/src/base-test-harness.ts#L58)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`job` | `JobConfig` | - |
`assetDir` | string |  process.cwd() |

**Returns:** *`ExecutionContextConfig`*

___

###  runSlice

▸ **runSlice**(`input`: `Slice` | `SliceRequest`): *`Promise<DataEntity[]>`*

*Defined in [worker-test-harness.ts:94](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/teraslice-test-harness/src/worker-test-harness.ts#L94)*

Given a slice run pass it the Fetcher and then subsequent
operations. This will also fire lifecycle events
which may be triggered any extra APIs.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`input` | `Slice` \| `SliceRequest` | The input slice, can optionally include all of the slice metadata. Use `newTestSlice()` to create a test slice. |

**Returns:** *`Promise<DataEntity[]>`*

an Array of DataEntities or a SliceResult

▸ **runSlice**(`input`: `Slice` | `SliceRequest`, `options`: object): *`Promise<DataEntity[]>`*

*Defined in [worker-test-harness.ts:95](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/teraslice-test-harness/src/worker-test-harness.ts#L95)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | `Slice` \| `SliceRequest` |
`options` | object |

**Returns:** *`Promise<DataEntity[]>`*

▸ **runSlice**(`input`: `Slice` | `SliceRequest`, `options`: object): *`Promise<RunSliceResult>`*

*Defined in [worker-test-harness.ts:96](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/teraslice-test-harness/src/worker-test-harness.ts#L96)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | `Slice` \| `SliceRequest` |
`options` | object |

**Returns:** *`Promise<RunSliceResult>`*

___

###  setClients

▸ **setClients**(`clients`: `TestClientConfig`[]): *void*

*Inherited from [BaseTestHarness](basetestharness.md).[setClients](basetestharness.md#setclients)*

*Defined in [base-test-harness.ts:47](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/teraslice-test-harness/src/base-test-harness.ts#L47)*

**Parameters:**

Name | Type |
------ | ------ |
`clients` | `TestClientConfig`[] |

**Returns:** *void*

___

###  shutdown

▸ **shutdown**(): *`Promise<void>`*

*Overrides [BaseTestHarness](basetestharness.md).[shutdown](basetestharness.md#shutdown)*

*Defined in [worker-test-harness.ts:140](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/teraslice-test-harness/src/worker-test-harness.ts#L140)*

**Returns:** *`Promise<void>`*

___

### `Static` testFetcher

▸ **testFetcher**(`opConfig`: `OpConfig`, `options?`: [JobHarnessOptions](../interfaces/jobharnessoptions.md)): *[WorkerTestHarness](workertestharness.md)*

*Defined in [worker-test-harness.ts:44](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/teraslice-test-harness/src/worker-test-harness.ts#L44)*

**Parameters:**

Name | Type |
------ | ------ |
`opConfig` | `OpConfig` |
`options?` | [JobHarnessOptions](../interfaces/jobharnessoptions.md) |

**Returns:** *[WorkerTestHarness](workertestharness.md)*

___

### `Static` testProcessor

▸ **testProcessor**(`opConfig`: `OpConfig`, `options?`: [JobHarnessOptions](../interfaces/jobharnessoptions.md)): *[WorkerTestHarness](workertestharness.md)*

*Defined in [worker-test-harness.ts:30](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/teraslice-test-harness/src/worker-test-harness.ts#L30)*

**Parameters:**

Name | Type |
------ | ------ |
`opConfig` | `OpConfig` |
`options?` | [JobHarnessOptions](../interfaces/jobharnessoptions.md) |

**Returns:** *[WorkerTestHarness](workertestharness.md)*
