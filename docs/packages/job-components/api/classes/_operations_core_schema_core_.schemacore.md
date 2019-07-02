---
title: Job Components Operations Core Schema Core Schemacore
sidebar_label: Operations Core Schema Core Schemacore
---

> Operations Core Schema Core Schemacore for @terascope/job-components

[Globals](../overview.md) / ["operations/core/schema-core"](../modules/_operations_core_schema_core_.md) / [SchemaCore](_operations_core_schema_core_.schemacore.md) /

# Class: SchemaCore <**T**>

A base class for supporting "Schema" definition

## Type parameters

▪ **T**

## Hierarchy

* **SchemaCore**

  * [ConvictSchema](_operations_convict_schema_.convictschema.md)

### Index

#### Constructors

* [constructor](_operations_core_schema_core_.schemacore.md#constructor)

#### Properties

* [context](_operations_core_schema_core_.schemacore.md#protected-context)
* [opType](_operations_core_schema_core_.schemacore.md#optype)

#### Methods

* [build](_operations_core_schema_core_.schemacore.md#abstract-build)
* [validate](_operations_core_schema_core_.schemacore.md#abstract-validate)
* [validateJob](_operations_core_schema_core_.schemacore.md#optional-abstract-validatejob)

## Constructors

###  constructor

\+ **new SchemaCore**(`context`: *[Context](../interfaces/_interfaces_context_.context.md)*, `opType`: *[OpType](../modules/_operations_core_schema_core_.md#optype)*): *[SchemaCore](_operations_core_schema_core_.schemacore.md)*

*Defined in [operations/core/schema-core.ts:9](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/schema-core.ts#L9)*

**Parameters:**

Name | Type |
------ | ------ |
`context` | [Context](../interfaces/_interfaces_context_.context.md) |
`opType` | [OpType](../modules/_operations_core_schema_core_.md#optype) |

**Returns:** *[SchemaCore](_operations_core_schema_core_.schemacore.md)*

## Properties

### `Protected` context

• **context**: *[Context](../interfaces/_interfaces_context_.context.md)*

*Defined in [operations/core/schema-core.ts:8](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/schema-core.ts#L8)*

___

###  opType

• **opType**: *[OpType](../modules/_operations_core_schema_core_.md#optype)*

*Defined in [operations/core/schema-core.ts:9](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/schema-core.ts#L9)*

## Methods

### `Abstract` build

▸ **build**(`context?`: *[Context](../interfaces/_interfaces_context_.context.md)*): *any*

*Defined in [operations/core/schema-core.ts:16](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/schema-core.ts#L16)*

**Parameters:**

Name | Type |
------ | ------ |
`context?` | [Context](../interfaces/_interfaces_context_.context.md) |

**Returns:** *any*

___

### `Abstract` validate

▸ **validate**(`inputConfig`: *any*): *[OpConfig](../interfaces/_interfaces_jobs_.opconfig.md) & `T`*

*Defined in [operations/core/schema-core.ts:17](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/schema-core.ts#L17)*

**Parameters:**

Name | Type |
------ | ------ |
`inputConfig` | any |

**Returns:** *[OpConfig](../interfaces/_interfaces_jobs_.opconfig.md) & `T`*

___

### `Optional` `Abstract` validateJob

▸ **validateJob**(`job`: *[ValidatedJobConfig](../interfaces/_interfaces_jobs_.validatedjobconfig.md)*): *void*

*Defined in [operations/core/schema-core.ts:18](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/schema-core.ts#L18)*

**Parameters:**

Name | Type |
------ | ------ |
`job` | [ValidatedJobConfig](../interfaces/_interfaces_jobs_.validatedjobconfig.md) |

**Returns:** *void*
