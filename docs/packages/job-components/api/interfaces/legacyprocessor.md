---
title: Job Components: `LegacyProcessor`
sidebar_label: LegacyProcessor
---

# Interface: LegacyProcessor

## Hierarchy

* [LegacyOperation](legacyoperation.md)

  ↳ **LegacyProcessor**

## Index

### Properties

* [crossValidation](legacyprocessor.md#optional-crossvalidation)
* [selfValidation](legacyprocessor.md#optional-selfvalidation)

### Methods

* [newProcessor](legacyprocessor.md#newprocessor)
* [schema](legacyprocessor.md#schema)

## Properties

### `Optional` crossValidation

• **crossValidation**? : *[crossValidationFn](../overview.md#crossvalidationfn)*

*Inherited from [LegacyOperation](legacyoperation.md).[crossValidation](legacyoperation.md#optional-crossvalidation)*

*Defined in [packages/job-components/src/interfaces/operations.ts:13](https://github.com/terascope/teraslice/blob/78714a985/packages/job-components/src/interfaces/operations.ts#L13)*

___

### `Optional` selfValidation

• **selfValidation**? : *[selfValidationFn](../overview.md#selfvalidationfn)*

*Inherited from [LegacyOperation](legacyoperation.md).[selfValidation](legacyoperation.md#optional-selfvalidation)*

*Defined in [packages/job-components/src/interfaces/operations.ts:14](https://github.com/terascope/teraslice/blob/78714a985/packages/job-components/src/interfaces/operations.ts#L14)*

## Methods

###  newProcessor

▸ **newProcessor**(`context`: [Context](context.md), `opConfig`: [OpConfig](opconfig.md), `executionConfig`: [ExecutionConfig](executionconfig.md)): *Promise‹[ProcessorFn](../overview.md#processorfn)‹any››*

*Defined in [packages/job-components/src/interfaces/operations.ts:38](https://github.com/terascope/teraslice/blob/78714a985/packages/job-components/src/interfaces/operations.ts#L38)*

**Parameters:**

Name | Type |
------ | ------ |
`context` | [Context](context.md) |
`opConfig` | [OpConfig](opconfig.md) |
`executionConfig` | [ExecutionConfig](executionconfig.md) |

**Returns:** *Promise‹[ProcessorFn](../overview.md#processorfn)‹any››*

___

###  schema

▸ **schema**(`context?`: [Context](context.md)): *[Schema](operationmodule.md#schema)‹any›*

*Overrides [LegacyOperation](legacyoperation.md).[schema](legacyoperation.md#schema)*

*Defined in [packages/job-components/src/interfaces/operations.ts:37](https://github.com/terascope/teraslice/blob/78714a985/packages/job-components/src/interfaces/operations.ts#L37)*

**Parameters:**

Name | Type |
------ | ------ |
`context?` | [Context](context.md) |

**Returns:** *[Schema](operationmodule.md#schema)‹any›*
