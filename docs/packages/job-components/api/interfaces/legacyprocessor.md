---
title: Job Components :: LegacyProcessor
sidebar_label: LegacyProcessor
---

# Interface: LegacyProcessor

## Hierarchy

* [LegacyOperation](legacyoperation.md)

  * **LegacyProcessor**

### Index

#### Properties

* [crossValidation](legacyprocessor.md#optional-crossvalidation)
* [selfValidation](legacyprocessor.md#optional-selfvalidation)

#### Methods

* [newProcessor](legacyprocessor.md#newprocessor)
* [schema](legacyprocessor.md#schema)

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

## Methods

###  newProcessor

▸ **newProcessor**(`context`: *[Context](context.md)*, `opConfig`: *[OpConfig](opconfig.md)*, `executionConfig`: *[ExecutionConfig](executionconfig.md)*): *`Promise<ProcessorFn<any>>`*

*Defined in [interfaces/operations.ts:27](https://github.com/terascope/teraslice/blob/b0f73ab9/packages/job-components/src/interfaces/operations.ts#L27)*

**Parameters:**

Name | Type |
------ | ------ |
`context` | [Context](context.md) |
`opConfig` | [OpConfig](opconfig.md) |
`executionConfig` | [ExecutionConfig](executionconfig.md) |

**Returns:** *`Promise<ProcessorFn<any>>`*

___

###  schema

▸ **schema**(`context?`: *[Context](context.md)*): *[Schema](operationmodule.md#schema)‹*any*›*

*Overrides [LegacyOperation](legacyoperation.md).[schema](legacyoperation.md#schema)*

*Defined in [interfaces/operations.ts:26](https://github.com/terascope/teraslice/blob/b0f73ab9/packages/job-components/src/interfaces/operations.ts#L26)*

**Parameters:**

Name | Type |
------ | ------ |
`context?` | [Context](context.md) |

**Returns:** *[Schema](operationmodule.md#schema)‹*any*›*

