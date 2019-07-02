---
title: Job Components Legacyoperation
sidebar_label: Legacyoperation
---

[LegacyOperation](legacyoperation.md) /

# Interface: LegacyOperation

## Hierarchy

* **LegacyOperation**

  * [LegacyReader](legacyreader.md)

  * [LegacyProcessor](legacyprocessor.md)

### Index

#### Properties

* [crossValidation](legacyoperation.md#optional-crossvalidation)
* [selfValidation](legacyoperation.md#optional-selfvalidation)

#### Methods

* [schema](legacyoperation.md#schema)

## Properties

### `Optional` crossValidation

• **crossValidation**? : *[crossValidationFn](../overview.md#crossvalidationfn)*

*Defined in [src/interfaces/operations.ts:11](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/interfaces/operations.ts#L11)*

___

### `Optional` selfValidation

• **selfValidation**? : *[selfValidationFn](../overview.md#selfvalidationfn)*

*Defined in [src/interfaces/operations.ts:12](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/interfaces/operations.ts#L12)*

## Methods

###  schema

▸ **schema**(`context?`: *[Context](context.md)*): *[Schema](operationmodule.md#schema)‹*any*›*

*Defined in [src/interfaces/operations.ts:13](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/interfaces/operations.ts#L13)*

**Parameters:**

Name | Type |
------ | ------ |
`context?` | [Context](context.md) |

**Returns:** *[Schema](operationmodule.md#schema)‹*any*›*
