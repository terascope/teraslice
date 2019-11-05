---
title: Job Components: `LegacyOperation`
sidebar_label: LegacyOperation
---

# Interface: LegacyOperation

## Hierarchy

* **LegacyOperation**

  ↳ [LegacyReader](legacyreader.md)

  ↳ [LegacyProcessor](legacyprocessor.md)

## Index

### Properties

* [crossValidation](legacyoperation.md#optional-crossvalidation)
* [selfValidation](legacyoperation.md#optional-selfvalidation)

### Methods

* [schema](legacyoperation.md#schema)

## Properties

### `Optional` crossValidation

• **crossValidation**? : *[crossValidationFn](../overview.md#crossvalidationfn)*

*Defined in [interfaces/operations.ts:13](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/interfaces/operations.ts#L13)*

___

### `Optional` selfValidation

• **selfValidation**? : *[selfValidationFn](../overview.md#selfvalidationfn)*

*Defined in [interfaces/operations.ts:14](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/interfaces/operations.ts#L14)*

## Methods

###  schema

▸ **schema**(`context?`: [Context](context.md)): *[Schema](operationmodule.md#schema)‹any›*

*Defined in [interfaces/operations.ts:15](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/interfaces/operations.ts#L15)*

**Parameters:**

Name | Type |
------ | ------ |
`context?` | [Context](context.md) |

**Returns:** *[Schema](operationmodule.md#schema)‹any›*
