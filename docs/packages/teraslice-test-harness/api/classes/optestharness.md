---
title: Teraslice Test Harness :: OpTestHarness
sidebar_label: OpTestHarness
---

# Class: OpTestHarness

A simple test harness for running an single operation
with minimal customizations. Based of the older
teraslice-op-test-harness package.

This is useful for testing Data in -> out on a Fetcher,
Reader, or Processor.

## Hierarchy

* **OpTestHarness**

### Index

#### Constructors

* [constructor](optestharness.md#constructor)

#### Properties

* [harness](optestharness.md#harness)
* [opTester](optestharness.md#optester)

#### Accessors

* [operation](optestharness.md#operation)

#### Methods

* [initialize](optestharness.md#initialize)
* [run](optestharness.md#run)
* [setClients](optestharness.md#setclients)
* [shutdown](optestharness.md#shutdown)

## Constructors

###  constructor

\+ **new OpTestHarness**(`op`: *`OpHarness.OpTestHarnessInput`*, `options?`: *[OpTestHarnessOptions](../interfaces/optestharnessoptions.md)*): *[OpTestHarness](optestharness.md)*

*Defined in [op-test-harness.ts:15](https://github.com/terascope/teraslice/blob/b0f73ab9/packages/teraslice-test-harness/src/op-test-harness.ts#L15)*

**Parameters:**

Name | Type |
------ | ------ |
`op` | `OpHarness.OpTestHarnessInput` |
`options?` | [OpTestHarnessOptions](../interfaces/optestharnessoptions.md) |

**Returns:** *[OpTestHarness](optestharness.md)*

## Properties

###  harness

• **harness**: *`OpHarness.TestHarness`*

*Defined in [op-test-harness.ts:14](https://github.com/terascope/teraslice/blob/b0f73ab9/packages/teraslice-test-harness/src/op-test-harness.ts#L14)*

___

###  opTester

• **opTester**: *`OpHarness.OperationTester` | undefined*

*Defined in [op-test-harness.ts:15](https://github.com/terascope/teraslice/blob/b0f73ab9/packages/teraslice-test-harness/src/op-test-harness.ts#L15)*

## Accessors

###  operation

• **get operation**(): *`CoreOperation` | null*

*Defined in [op-test-harness.ts:35](https://github.com/terascope/teraslice/blob/b0f73ab9/packages/teraslice-test-harness/src/op-test-harness.ts#L35)*

Get the Operation from the op test harness

**Returns:** *`CoreOperation` | null*

## Methods

###  initialize

▸ **initialize**(`options?`: *`OpHarness.InitOptions`*): *`Promise<void>`*

*Defined in [op-test-harness.ts:43](https://github.com/terascope/teraslice/blob/b0f73ab9/packages/teraslice-test-harness/src/op-test-harness.ts#L43)*

Initialize the Operations on the ExecutionContext

**Parameters:**

Name | Type |
------ | ------ |
`options?` | `OpHarness.InitOptions` |

**Returns:** *`Promise<void>`*

___

###  run

▸ **run**(`input`: *`OpHarness.RunInput`*): *`Promise<OpHarness.RunResult>`*

*Defined in [op-test-harness.ts:53](https://github.com/terascope/teraslice/blob/b0f73ab9/packages/teraslice-test-harness/src/op-test-harness.ts#L53)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | `OpHarness.RunInput` |

**Returns:** *`Promise<OpHarness.RunResult>`*

___

###  setClients

▸ **setClients**(`clients`: *`TestClientConfig`[]*): *void*

*Defined in [op-test-harness.ts:28](https://github.com/terascope/teraslice/blob/b0f73ab9/packages/teraslice-test-harness/src/op-test-harness.ts#L28)*

Set the Terafoundation Clients on both
the Slicer and Worker contexts

**Parameters:**

Name | Type |
------ | ------ |
`clients` | `TestClientConfig`[] |

**Returns:** *void*

___

###  shutdown

▸ **shutdown**(): *`Promise<void>`*

*Defined in [op-test-harness.ts:64](https://github.com/terascope/teraslice/blob/b0f73ab9/packages/teraslice-test-harness/src/op-test-harness.ts#L64)*

Shutdown the Operations on the ExecutionContext

**Returns:** *`Promise<void>`*

