---
title: Job Components Interfaces Operations Legacyreader
sidebar_label: Interfaces Operations Legacyreader
---

> Interfaces Operations Legacyreader for @terascope/job-components

[Globals](../overview.md) / ["interfaces/operations"](../modules/_interfaces_operations_.md) / [LegacyReader](_interfaces_operations_.legacyreader.md) /

# Interface: LegacyReader

## Hierarchy

* [LegacyOperation](_interfaces_operations_.legacyoperation.md)

  * **LegacyReader**

### Index

#### Properties

* [crossValidation](_interfaces_operations_.legacyreader.md#optional-crossvalidation)
* [selfValidation](_interfaces_operations_.legacyreader.md#optional-selfvalidation)
* [slicerQueueLength](_interfaces_operations_.legacyreader.md#optional-slicerqueuelength)

#### Methods

* [newReader](_interfaces_operations_.legacyreader.md#newreader)
* [newSlicer](_interfaces_operations_.legacyreader.md#newslicer)
* [schema](_interfaces_operations_.legacyreader.md#schema)

## Properties

### `Optional` crossValidation

• **crossValidation**? : *[crossValidationFn](../modules/_interfaces_operations_.md#crossvalidationfn)*

*Inherited from [LegacyOperation](_interfaces_operations_.legacyoperation.md).[crossValidation](_interfaces_operations_.legacyoperation.md#optional-crossvalidation)*

*Defined in [interfaces/operations.ts:11](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/operations.ts#L11)*

___

### `Optional` selfValidation

• **selfValidation**? : *[selfValidationFn](../modules/_interfaces_operations_.md#selfvalidationfn)*

*Inherited from [LegacyOperation](_interfaces_operations_.legacyoperation.md).[selfValidation](_interfaces_operations_.legacyoperation.md#optional-selfvalidation)*

*Defined in [interfaces/operations.ts:12](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/operations.ts#L12)*

___

### `Optional` slicerQueueLength

• **slicerQueueLength**? : *[sliceQueueLengthFn](../modules/_interfaces_operations_.md#slicequeuelengthfn)*

*Defined in [interfaces/operations.ts:17](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/operations.ts#L17)*

## Methods

###  newReader

▸ **newReader**(`context`: *[Context](_interfaces_context_.context.md)*, `opConfig`: *[OpConfig](_interfaces_jobs_.opconfig.md)*, `exectutionConfig`: *[ExecutionConfig](_interfaces_jobs_.executionconfig.md)*): *`Promise<ReaderFn<any>>`*

*Defined in [interfaces/operations.ts:19](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/operations.ts#L19)*

**Parameters:**

Name | Type |
------ | ------ |
`context` | [Context](_interfaces_context_.context.md) |
`opConfig` | [OpConfig](_interfaces_jobs_.opconfig.md) |
`exectutionConfig` | [ExecutionConfig](_interfaces_jobs_.executionconfig.md) |

**Returns:** *`Promise<ReaderFn<any>>`*

___

###  newSlicer

▸ **newSlicer**(`context`: *[Context](_interfaces_context_.context.md)*, `executionContext`: *[LegacyExecutionContext](_interfaces_jobs_.legacyexecutioncontext.md)*, `recoveryData`: *object[]*, `logger`: *`Logger`*): *`Promise<SlicerFns>`*

*Defined in [interfaces/operations.ts:20](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/operations.ts#L20)*

**Parameters:**

Name | Type |
------ | ------ |
`context` | [Context](_interfaces_context_.context.md) |
`executionContext` | [LegacyExecutionContext](_interfaces_jobs_.legacyexecutioncontext.md) |
`recoveryData` | object[] |
`logger` | `Logger` |

**Returns:** *`Promise<SlicerFns>`*

___

###  schema

▸ **schema**(`context?`: *[Context](_interfaces_context_.context.md)*): *[Schema](_operations_interfaces_.operationmodule.md#schema)‹*any*›*

*Overrides [LegacyOperation](_interfaces_operations_.legacyoperation.md).[schema](_interfaces_operations_.legacyoperation.md#schema)*

*Defined in [interfaces/operations.ts:18](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/operations.ts#L18)*

**Parameters:**

Name | Type |
------ | ------ |
`context?` | [Context](_interfaces_context_.context.md) |

**Returns:** *[Schema](_operations_interfaces_.operationmodule.md#schema)‹*any*›*
