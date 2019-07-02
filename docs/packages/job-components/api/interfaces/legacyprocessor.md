---
title: Job Components Legacyprocessor
sidebar_label: Legacyprocessor
---

[LegacyProcessor](legacyprocessor.md) /

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

*Defined in [src/interfaces/operations.ts:11](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/interfaces/operations.ts#L11)*

___

### `Optional` selfValidation

• **selfValidation**? : *[selfValidationFn](../overview.md#selfvalidationfn)*

*Inherited from [LegacyOperation](legacyoperation.md).[selfValidation](legacyoperation.md#optional-selfvalidation)*

*Defined in [src/interfaces/operations.ts:12](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/interfaces/operations.ts#L12)*

## Methods

###  newProcessor

▸ **newProcessor**(`context`: *[Context](context.md)*, `opConfig`: *[OpConfig](opconfig.md)*, `executionConfig`: *[ExecutionConfig](executionconfig.md)*): *`Promise<ProcessorFn<any>>`*

*Defined in [src/interfaces/operations.ts:27](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/interfaces/operations.ts#L27)*

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

*Defined in [src/interfaces/operations.ts:26](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/interfaces/operations.ts#L26)*

**Parameters:**

Name | Type |
------ | ------ |
`context?` | [Context](context.md) |

**Returns:** *[Schema](operationmodule.md#schema)‹*any*›*
