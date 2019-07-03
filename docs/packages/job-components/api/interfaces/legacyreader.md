---
title: Job Components :: LegacyReader
sidebar_label: LegacyReader
---

# Interface: LegacyReader

## Hierarchy

* [LegacyOperation](legacyoperation.md)

  * **LegacyReader**

### Index

#### Properties

* [crossValidation](legacyreader.md#optional-crossvalidation)
* [selfValidation](legacyreader.md#optional-selfvalidation)
* [slicerQueueLength](legacyreader.md#optional-slicerqueuelength)

#### Methods

* [newReader](legacyreader.md#newreader)
* [newSlicer](legacyreader.md#newslicer)
* [schema](legacyreader.md#schema)

## Properties

### `Optional` crossValidation

• **crossValidation**? : *[crossValidationFn](../overview.md#crossvalidationfn)*

*Inherited from [LegacyOperation](legacyoperation.md).[crossValidation](legacyoperation.md#optional-crossvalidation)*

*Defined in [interfaces/operations.ts:11](https://github.com/terascope/teraslice/blob/b0f73ab9/packages/job-components/src/interfaces/operations.ts#L11)*

___

### `Optional` selfValidation

• **selfValidation**? : *[selfValidationFn](../overview.md#selfvalidationfn)*

*Inherited from [LegacyOperation](legacyoperation.md).[selfValidation](legacyoperation.md#optional-selfvalidation)*

*Defined in [interfaces/operations.ts:12](https://github.com/terascope/teraslice/blob/b0f73ab9/packages/job-components/src/interfaces/operations.ts#L12)*

___

### `Optional` slicerQueueLength

• **slicerQueueLength**? : *[sliceQueueLengthFn](../overview.md#slicequeuelengthfn)*

*Defined in [interfaces/operations.ts:17](https://github.com/terascope/teraslice/blob/b0f73ab9/packages/job-components/src/interfaces/operations.ts#L17)*

## Methods

###  newReader

▸ **newReader**(`context`: *[Context](context.md)*, `opConfig`: *[OpConfig](opconfig.md)*, `exectutionConfig`: *[ExecutionConfig](executionconfig.md)*): *`Promise<ReaderFn<any>>`*

*Defined in [interfaces/operations.ts:19](https://github.com/terascope/teraslice/blob/b0f73ab9/packages/job-components/src/interfaces/operations.ts#L19)*

**Parameters:**

Name | Type |
------ | ------ |
`context` | [Context](context.md) |
`opConfig` | [OpConfig](opconfig.md) |
`exectutionConfig` | [ExecutionConfig](executionconfig.md) |

**Returns:** *`Promise<ReaderFn<any>>`*

___

###  newSlicer

▸ **newSlicer**(`context`: *[Context](context.md)*, `executionContext`: *[LegacyExecutionContext](legacyexecutioncontext.md)*, `recoveryData`: *object[]*, `logger`: *`Logger`*): *`Promise<SlicerFns>`*

*Defined in [interfaces/operations.ts:20](https://github.com/terascope/teraslice/blob/b0f73ab9/packages/job-components/src/interfaces/operations.ts#L20)*

**Parameters:**

Name | Type |
------ | ------ |
`context` | [Context](context.md) |
`executionContext` | [LegacyExecutionContext](legacyexecutioncontext.md) |
`recoveryData` | object[] |
`logger` | `Logger` |

**Returns:** *`Promise<SlicerFns>`*

___

###  schema

▸ **schema**(`context?`: *[Context](context.md)*): *[Schema](operationmodule.md#schema)‹*any*›*

*Overrides [LegacyOperation](legacyoperation.md).[schema](legacyoperation.md#schema)*

*Defined in [interfaces/operations.ts:18](https://github.com/terascope/teraslice/blob/b0f73ab9/packages/job-components/src/interfaces/operations.ts#L18)*

**Parameters:**

Name | Type |
------ | ------ |
`context?` | [Context](context.md) |

**Returns:** *[Schema](operationmodule.md#schema)‹*any*›*

