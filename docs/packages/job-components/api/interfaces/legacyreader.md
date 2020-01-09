---
title: Job Components: `LegacyReader`
sidebar_label: LegacyReader
---

# Interface: LegacyReader

## Hierarchy

* [LegacyOperation](legacyoperation.md)

  ↳ **LegacyReader**

## Index

### Properties

* [crossValidation](legacyreader.md#optional-crossvalidation)
* [selfValidation](legacyreader.md#optional-selfvalidation)
* [slicerQueueLength](legacyreader.md#optional-slicerqueuelength)

### Methods

* [newReader](legacyreader.md#newreader)
* [newSlicer](legacyreader.md#newslicer)
* [schema](legacyreader.md#schema)

## Properties

### `Optional` crossValidation

• **crossValidation**? : *[crossValidationFn](../overview.md#crossvalidationfn)*

*Inherited from [LegacyOperation](legacyoperation.md).[crossValidation](legacyoperation.md#optional-crossvalidation)*

*Defined in [interfaces/operations.ts:13](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/interfaces/operations.ts#L13)*

___

### `Optional` selfValidation

• **selfValidation**? : *[selfValidationFn](../overview.md#selfvalidationfn)*

*Inherited from [LegacyOperation](legacyoperation.md).[selfValidation](legacyoperation.md#optional-selfvalidation)*

*Defined in [interfaces/operations.ts:14](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/interfaces/operations.ts#L14)*

___

### `Optional` slicerQueueLength

• **slicerQueueLength**? : *[sliceQueueLengthFn](../overview.md#slicequeuelengthfn)*

*Defined in [interfaces/operations.ts:19](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/interfaces/operations.ts#L19)*

## Methods

###  newReader

▸ **newReader**(`context`: [Context](context.md), `opConfig`: [OpConfig](opconfig.md), `exectutionConfig`: [ExecutionConfig](executionconfig.md)): *Promise‹[ReaderFn](../overview.md#readerfn)‹any››*

*Defined in [interfaces/operations.ts:21](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/interfaces/operations.ts#L21)*

**Parameters:**

Name | Type |
------ | ------ |
`context` | [Context](context.md) |
`opConfig` | [OpConfig](opconfig.md) |
`exectutionConfig` | [ExecutionConfig](executionconfig.md) |

**Returns:** *Promise‹[ReaderFn](../overview.md#readerfn)‹any››*

___

###  newSlicer

▸ **newSlicer**(`context`: [Context](context.md), `executionContext`: [LegacyExecutionContext](legacyexecutioncontext.md), `recoveryData`: object[], `logger`: Logger): *Promise‹[SlicerFns](../overview.md#slicerfns)›*

*Defined in [interfaces/operations.ts:26](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/interfaces/operations.ts#L26)*

**Parameters:**

Name | Type |
------ | ------ |
`context` | [Context](context.md) |
`executionContext` | [LegacyExecutionContext](legacyexecutioncontext.md) |
`recoveryData` | object[] |
`logger` | Logger |

**Returns:** *Promise‹[SlicerFns](../overview.md#slicerfns)›*

___

###  schema

▸ **schema**(`context?`: [Context](context.md)): *[Schema](operationmodule.md#schema)‹any›*

*Overrides [LegacyOperation](legacyoperation.md).[schema](legacyoperation.md#schema)*

*Defined in [interfaces/operations.ts:20](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/interfaces/operations.ts#L20)*

**Parameters:**

Name | Type |
------ | ------ |
`context?` | [Context](context.md) |

**Returns:** *[Schema](operationmodule.md#schema)‹any›*
