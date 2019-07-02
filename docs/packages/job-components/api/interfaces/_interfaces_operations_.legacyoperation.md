---
title: Job Components Interfaces Operations Legacyoperation
sidebar_label: Interfaces Operations Legacyoperation
---

> Interfaces Operations Legacyoperation for @terascope/job-components

[Globals](../overview.md) / ["interfaces/operations"](../modules/_interfaces_operations_.md) / [LegacyOperation](_interfaces_operations_.legacyoperation.md) /

# Interface: LegacyOperation

## Hierarchy

* **LegacyOperation**

  * [LegacyReader](_interfaces_operations_.legacyreader.md)

  * [LegacyProcessor](_interfaces_operations_.legacyprocessor.md)

### Index

#### Properties

* [crossValidation](_interfaces_operations_.legacyoperation.md#optional-crossvalidation)
* [selfValidation](_interfaces_operations_.legacyoperation.md#optional-selfvalidation)

#### Methods

* [schema](_interfaces_operations_.legacyoperation.md#schema)

## Properties

### `Optional` crossValidation

• **crossValidation**? : *[crossValidationFn](../modules/_interfaces_operations_.md#crossvalidationfn)*

*Defined in [interfaces/operations.ts:11](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/operations.ts#L11)*

___

### `Optional` selfValidation

• **selfValidation**? : *[selfValidationFn](../modules/_interfaces_operations_.md#selfvalidationfn)*

*Defined in [interfaces/operations.ts:12](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/operations.ts#L12)*

## Methods

###  schema

▸ **schema**(`context?`: *[Context](_interfaces_context_.context.md)*): *[Schema](_operations_interfaces_.operationmodule.md#schema)‹*any*›*

*Defined in [interfaces/operations.ts:13](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/operations.ts#L13)*

**Parameters:**

Name | Type |
------ | ------ |
`context?` | [Context](_interfaces_context_.context.md) |

**Returns:** *[Schema](_operations_interfaces_.operationmodule.md#schema)‹*any*›*
