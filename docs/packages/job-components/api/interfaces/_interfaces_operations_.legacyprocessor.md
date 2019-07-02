---
title: Job Components Interfaces Operations Legacyprocessor
sidebar_label: Interfaces Operations Legacyprocessor
---

> Interfaces Operations Legacyprocessor for @terascope/job-components

[Globals](../overview.md) / ["interfaces/operations"](../modules/_interfaces_operations_.md) / [LegacyProcessor](_interfaces_operations_.legacyprocessor.md) /

# Interface: LegacyProcessor

## Hierarchy

* [LegacyOperation](_interfaces_operations_.legacyoperation.md)

  * **LegacyProcessor**

### Index

#### Properties

* [crossValidation](_interfaces_operations_.legacyprocessor.md#optional-crossvalidation)
* [selfValidation](_interfaces_operations_.legacyprocessor.md#optional-selfvalidation)

#### Methods

* [newProcessor](_interfaces_operations_.legacyprocessor.md#newprocessor)
* [schema](_interfaces_operations_.legacyprocessor.md#schema)

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

## Methods

###  newProcessor

▸ **newProcessor**(`context`: *[Context](_interfaces_context_.context.md)*, `opConfig`: *[OpConfig](_interfaces_jobs_.opconfig.md)*, `executionConfig`: *[ExecutionConfig](_interfaces_jobs_.executionconfig.md)*): *`Promise<ProcessorFn<any>>`*

*Defined in [interfaces/operations.ts:27](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/operations.ts#L27)*

**Parameters:**

Name | Type |
------ | ------ |
`context` | [Context](_interfaces_context_.context.md) |
`opConfig` | [OpConfig](_interfaces_jobs_.opconfig.md) |
`executionConfig` | [ExecutionConfig](_interfaces_jobs_.executionconfig.md) |

**Returns:** *`Promise<ProcessorFn<any>>`*

___

###  schema

▸ **schema**(`context?`: *[Context](_interfaces_context_.context.md)*): *[Schema](_operations_interfaces_.operationmodule.md#schema)‹*any*›*

*Overrides [LegacyOperation](_interfaces_operations_.legacyoperation.md).[schema](_interfaces_operations_.legacyoperation.md#schema)*

*Defined in [interfaces/operations.ts:26](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/operations.ts#L26)*

**Parameters:**

Name | Type |
------ | ------ |
`context?` | [Context](_interfaces_context_.context.md) |

**Returns:** *[Schema](_operations_interfaces_.operationmodule.md#schema)‹*any*›*
