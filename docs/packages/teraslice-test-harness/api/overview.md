---
title: Teraslice Test Harness API Overview
sidebar_label: API
---

## Index

### Classes

* [BaseTestHarness](classes/basetestharness.md)
* [JobTestHarness](classes/jobtestharness.md)
* [OpTestHarness](classes/optestharness.md)
* [SlicerTestHarness](classes/slicertestharness.md)
* [WorkerTestHarness](classes/workertestharness.md)

### Interfaces

* [JobHarnessOptions](interfaces/jobharnessoptions.md)
* [OpTestHarnessOptions](interfaces/optestharnessoptions.md)

### Type aliases

* [AnyOperationConstructor](overview.md#anyoperationconstructor)
* [BatchedResults](overview.md#batchedresults)
* [Context](overview.md#context)
* [ExecutionContext](overview.md#executioncontext)

### Functions

* [isAssetDirRoot](overview.md#isassetdirroot)
* [isBaseAssetDir](overview.md#isbaseassetdir)
* [resolveAssetDir](overview.md#resolveassetdir)

## Type aliases

###  AnyOperationConstructor

Ƭ **AnyOperationConstructor**: *ProcessorConstructor | SlicerConstructor*

*Defined in [interfaces.ts:22](https://github.com/terascope/teraslice/blob/0ae31df4/packages/teraslice-test-harness/src/interfaces.ts#L22)*

___

###  BatchedResults

Ƭ **BatchedResults**: *DataEntity[][]*

*Defined in [job-test-harness.ts:123](https://github.com/terascope/teraslice/blob/0ae31df4/packages/teraslice-test-harness/src/job-test-harness.ts#L123)*

___

###  Context

Ƭ **Context**: *WorkerContext*

*Defined in [interfaces.ts:11](https://github.com/terascope/teraslice/blob/0ae31df4/packages/teraslice-test-harness/src/interfaces.ts#L11)*

___

###  ExecutionContext

Ƭ **ExecutionContext**: *WorkerExecutionContext | SlicerExecutionContext*

*Defined in [interfaces.ts:10](https://github.com/terascope/teraslice/blob/0ae31df4/packages/teraslice-test-harness/src/interfaces.ts#L10)*

## Functions

###  isAssetDirRoot

▸ **isAssetDirRoot**(`assetDir`: string): *boolean*

*Defined in [utils.ts:27](https://github.com/terascope/teraslice/blob/0ae31df4/packages/teraslice-test-harness/src/utils.ts#L27)*

**Parameters:**

Name | Type |
------ | ------ |
`assetDir` | string |

**Returns:** *boolean*

___

###  isBaseAssetDir

▸ **isBaseAssetDir**(`assetDir`: string): *boolean*

*Defined in [utils.ts:21](https://github.com/terascope/teraslice/blob/0ae31df4/packages/teraslice-test-harness/src/utils.ts#L21)*

**Parameters:**

Name | Type |
------ | ------ |
`assetDir` | string |

**Returns:** *boolean*

___

###  resolveAssetDir

▸ **resolveAssetDir**(`assetDir`: string): *string*

*Defined in [utils.ts:4](https://github.com/terascope/teraslice/blob/0ae31df4/packages/teraslice-test-harness/src/utils.ts#L4)*

**Parameters:**

Name | Type |
------ | ------ |
`assetDir` | string |

**Returns:** *string*
