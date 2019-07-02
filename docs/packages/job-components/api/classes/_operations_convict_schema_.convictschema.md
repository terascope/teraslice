---
title: Job Components Operations Convict Schema Convictschema
sidebar_label: Operations Convict Schema Convictschema
---

> Operations Convict Schema Convictschema for @terascope/job-components

[Globals](../overview.md) / ["operations/convict-schema"](../modules/_operations_convict_schema_.md) / [ConvictSchema](_operations_convict_schema_.convictschema.md) /

# Class: ConvictSchema <**T, S**>

A base class for supporting convict "Schema" definitions

## Type parameters

▪ **T**: *`Object`*

▪ **S**

## Hierarchy

* [SchemaCore](_operations_core_schema_core_.schemacore.md)‹*`T`*›

  * **ConvictSchema**

  * [Schema](_builtin_collect_schema_.schema.md)

  * [Schema](_builtin_delay_schema_.schema.md)

  * [Schema](_builtin_noop_schema_.schema.md)

  * [Schema](_builtin_test_reader_schema_.schema.md)

### Index

#### Constructors

* [constructor](_operations_convict_schema_.convictschema.md#constructor)

#### Properties

* [context](_operations_convict_schema_.convictschema.md#protected-context)
* [opType](_operations_convict_schema_.convictschema.md#optype)
* [schema](_operations_convict_schema_.convictschema.md#schema)

#### Methods

* [build](_operations_convict_schema_.convictschema.md#abstract-build)
* [validate](_operations_convict_schema_.convictschema.md#validate)
* [validateJob](_operations_convict_schema_.convictschema.md#validatejob)
* [type](_operations_convict_schema_.convictschema.md#static-type)

## Constructors

###  constructor

\+ **new ConvictSchema**(`context`: *[Context](../interfaces/_interfaces_context_.context.md)*, `opType`: *[OpType](../modules/_operations_core_schema_core_.md#optype)*): *[ConvictSchema](_operations_convict_schema_.convictschema.md)*

*Overrides [SchemaCore](_operations_core_schema_core_.schemacore.md).[constructor](_operations_core_schema_core_.schemacore.md#constructor)*

*Defined in [operations/convict-schema.ts:10](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/convict-schema.ts#L10)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`context` | [Context](../interfaces/_interfaces_context_.context.md) | - |
`opType` | [OpType](../modules/_operations_core_schema_core_.md#optype) | "operation" |

**Returns:** *[ConvictSchema](_operations_convict_schema_.convictschema.md)*

## Properties

### `Protected` context

• **context**: *[Context](../interfaces/_interfaces_context_.context.md)*

*Inherited from [SchemaCore](_operations_core_schema_core_.schemacore.md).[context](_operations_core_schema_core_.schemacore.md#protected-context)*

*Defined in [operations/core/schema-core.ts:8](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/schema-core.ts#L8)*

___

###  opType

• **opType**: *[OpType](../modules/_operations_core_schema_core_.md#optype)*

*Inherited from [SchemaCore](_operations_core_schema_core_.schemacore.md).[opType](_operations_core_schema_core_.schemacore.md#optype)*

*Defined in [operations/core/schema-core.ts:9](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/schema-core.ts#L9)*

___

###  schema

• **schema**: *`convict.Schema<S>`*

*Defined in [operations/convict-schema.ts:10](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/convict-schema.ts#L10)*

## Methods

### `Abstract` build

▸ **build**<**U**>(`context?`: *[Context](../interfaces/_interfaces_context_.context.md)*): *`convict.Schema<S & U>`*

*Overrides [SchemaCore](_operations_core_schema_core_.schemacore.md).[build](_operations_core_schema_core_.schemacore.md#abstract-build)*

*Defined in [operations/convict-schema.ts:36](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/convict-schema.ts#L36)*

**Type parameters:**

▪ **U**

**Parameters:**

Name | Type |
------ | ------ |
`context?` | [Context](../interfaces/_interfaces_context_.context.md) |

**Returns:** *`convict.Schema<S & U>`*

___

###  validate

▸ **validate**(`inputConfig`: *any*): *[APIConfig](../interfaces/_interfaces_jobs_.apiconfig.md) & `T`*

*Overrides [SchemaCore](_operations_core_schema_core_.schemacore.md).[validate](_operations_core_schema_core_.schemacore.md#abstract-validate)*

*Defined in [operations/convict-schema.ts:17](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/convict-schema.ts#L17)*

**Parameters:**

Name | Type |
------ | ------ |
`inputConfig` | any |

**Returns:** *[APIConfig](../interfaces/_interfaces_jobs_.apiconfig.md) & `T`*

▸ **validate**(`inputConfig`: *any*): *[OpConfig](../interfaces/_interfaces_jobs_.opconfig.md) & `T`*

*Overrides [SchemaCore](_operations_core_schema_core_.schemacore.md).[validate](_operations_core_schema_core_.schemacore.md#abstract-validate)*

*Defined in [operations/convict-schema.ts:18](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/convict-schema.ts#L18)*

**Parameters:**

Name | Type |
------ | ------ |
`inputConfig` | any |

**Returns:** *[OpConfig](../interfaces/_interfaces_jobs_.opconfig.md) & `T`*

___

###  validateJob

▸ **validateJob**(`job`: *any*): *void*

*Overrides [SchemaCore](_operations_core_schema_core_.schemacore.md).[validateJob](_operations_core_schema_core_.schemacore.md#optional-abstract-validatejob)*

*Defined in [operations/convict-schema.ts:28](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/convict-schema.ts#L28)*

**Parameters:**

Name | Type |
------ | ------ |
`job` | any |

**Returns:** *void*

___

### `Static` type

▸ **type**(): *string*

*Defined in [operations/convict-schema.ts:32](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/convict-schema.ts#L32)*

**Returns:** *string*
