---
title: Teraslice Test Harness: `BaseTestHarness`
sidebar_label: BaseTestHarness
---

# Class: BaseTestHarness <**U**>

A base class for the Slicer and Worker TestHarnesses

**`todo`** Add support for validating the asset.json?

## Type parameters

▪ **U**: *[ExecutionContext](../overview.md#executioncontext)*

## Hierarchy

* **BaseTestHarness**

  ↳ [SlicerTestHarness](slicertestharness.md)

  ↳ [WorkerTestHarness](workertestharness.md)

## Index

### Constructors

* [constructor](basetestharness.md#constructor)

### Properties

* [context](basetestharness.md#protected-context)
* [events](basetestharness.md#events)
* [executionContext](basetestharness.md#protected-executioncontext)

### Methods

* [initialize](basetestharness.md#initialize)
* [makeContextConfig](basetestharness.md#protected-makecontextconfig)
* [setClients](basetestharness.md#setclients)
* [shutdown](basetestharness.md#shutdown)

## Constructors

###  constructor

\+ **new BaseTestHarness**(`job`: JobConfig, `options`: [JobHarnessOptions](../interfaces/jobharnessoptions.md), `assignment`: Assignment): *[BaseTestHarness](basetestharness.md)*

*Defined in [base-test-harness.ts:26](https://github.com/terascope/teraslice/blob/b843209f9/packages/teraslice-test-harness/src/base-test-harness.ts#L26)*

**Parameters:**

Name | Type |
------ | ------ |
`job` | JobConfig |
`options` | [JobHarnessOptions](../interfaces/jobharnessoptions.md) |
`assignment` | Assignment |

**Returns:** *[BaseTestHarness](basetestharness.md)*

## Properties

### `Protected` context

• **context**: *TestContext*

*Defined in [base-test-harness.ts:26](https://github.com/terascope/teraslice/blob/b843209f9/packages/teraslice-test-harness/src/base-test-harness.ts#L26)*

___

###  events

• **events**: *EventEmitter*

*Defined in [base-test-harness.ts:24](https://github.com/terascope/teraslice/blob/b843209f9/packages/teraslice-test-harness/src/base-test-harness.ts#L24)*

___

### `Protected` executionContext

• **executionContext**: *U*

*Defined in [base-test-harness.ts:25](https://github.com/terascope/teraslice/blob/b843209f9/packages/teraslice-test-harness/src/base-test-harness.ts#L25)*

## Methods

###  initialize

▸ **initialize**(): *Promise‹void›*

*Defined in [base-test-harness.ts:44](https://github.com/terascope/teraslice/blob/b843209f9/packages/teraslice-test-harness/src/base-test-harness.ts#L44)*

Initialize any test cod

**Returns:** *Promise‹void›*

___

### `Protected` makeContextConfig

▸ **makeContextConfig**(`job`: JobConfig, `assetDir`: string): *ExecutionContextConfig*

*Defined in [base-test-harness.ts:58](https://github.com/terascope/teraslice/blob/b843209f9/packages/teraslice-test-harness/src/base-test-harness.ts#L58)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`job` | JobConfig | - |
`assetDir` | string |  process.cwd() |

**Returns:** *ExecutionContextConfig*

___

###  setClients

▸ **setClients**(`clients`: TestClientConfig[]): *void*

*Defined in [base-test-harness.ts:47](https://github.com/terascope/teraslice/blob/b843209f9/packages/teraslice-test-harness/src/base-test-harness.ts#L47)*

**Parameters:**

Name | Type |
------ | ------ |
`clients` | TestClientConfig[] |

**Returns:** *void*

___

###  shutdown

▸ **shutdown**(): *Promise‹void›*

*Defined in [base-test-harness.ts:54](https://github.com/terascope/teraslice/blob/b843209f9/packages/teraslice-test-harness/src/base-test-harness.ts#L54)*

Cleanup test code

**Returns:** *Promise‹void›*
