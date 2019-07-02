---
title: Job Components Builtin Delay Schema Schema
sidebar_label: Builtin Delay Schema Schema
---

> Builtin Delay Schema Schema for @terascope/job-components

[Globals](../overview.md) / ["builtin/delay/schema"](../modules/_builtin_delay_schema_.md) / [Schema](_builtin_delay_schema_.schema.md) /

# Class: Schema <**S**>

## Type parameters

▪ **S**

## Hierarchy

  * [ConvictSchema](_operations_convict_schema_.convictschema.md)‹*[DelayConfig](../interfaces/_builtin_delay_interfaces_.delayconfig.md)*›

  * **Schema**

### Index

#### Constructors

* [constructor](_builtin_delay_schema_.schema.md#constructor)

#### Properties

* [context](_builtin_delay_schema_.schema.md#protected-context)
* [opType](_builtin_delay_schema_.schema.md#optype)
* [schema](_builtin_delay_schema_.schema.md#schema)

#### Methods

* [build](_builtin_delay_schema_.schema.md#build)
* [validate](_builtin_delay_schema_.schema.md#validate)
* [validateJob](_builtin_delay_schema_.schema.md#validatejob)
* [type](_builtin_delay_schema_.schema.md#static-type)

## Constructors

###  constructor

\+ **new Schema**(`context`: *[Context](../interfaces/_interfaces_context_.context.md)*, `opType`: *[OpType](../modules/_operations_core_schema_core_.md#optype)*): *[Schema](_builtin_delay_schema_.schema.md)*

*Inherited from [ConvictSchema](_operations_convict_schema_.convictschema.md).[constructor](_operations_convict_schema_.convictschema.md#constructor)*

*Overrides [SchemaCore](_operations_core_schema_core_.schemacore.md).[constructor](_operations_core_schema_core_.schemacore.md#constructor)*

*Defined in [operations/convict-schema.ts:10](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/convict-schema.ts#L10)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`context` | [Context](../interfaces/_interfaces_context_.context.md) | - |
`opType` | [OpType](../modules/_operations_core_schema_core_.md#optype) | "operation" |

**Returns:** *[Schema](_builtin_delay_schema_.schema.md)*

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

*Inherited from [ConvictSchema](_operations_convict_schema_.convictschema.md).[schema](_operations_convict_schema_.convictschema.md#schema)*

*Defined in [operations/convict-schema.ts:10](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/convict-schema.ts#L10)*

## Methods

###  build

▸ **build**(): *object*

*Overrides [ConvictSchema](_operations_convict_schema_.convictschema.md).[build](_operations_convict_schema_.convictschema.md#abstract-build)*

*Defined in [builtin/delay/schema.ts:5](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/builtin/delay/schema.ts#L5)*

**Returns:** *object*

___

###  validate

▸ **validate**(`inputConfig`: *any*): *[APIConfig](../interfaces/_interfaces_jobs_.apiconfig.md) & [DelayConfig](../interfaces/_builtin_delay_interfaces_.delayconfig.md)*

*Inherited from [ConvictSchema](_operations_convict_schema_.convictschema.md).[validate](_operations_convict_schema_.convictschema.md#validate)*

*Overrides [SchemaCore](_operations_core_schema_core_.schemacore.md).[validate](_operations_core_schema_core_.schemacore.md#abstract-validate)*

*Defined in [operations/convict-schema.ts:17](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/convict-schema.ts#L17)*

**Parameters:**

Name | Type |
------ | ------ |
`inputConfig` | any |

**Returns:** *[APIConfig](../interfaces/_interfaces_jobs_.apiconfig.md) & [DelayConfig](../interfaces/_builtin_delay_interfaces_.delayconfig.md)*

▸ **validate**(`inputConfig`: *any*): *[OpConfig](../interfaces/_interfaces_jobs_.opconfig.md) & [DelayConfig](../interfaces/_builtin_delay_interfaces_.delayconfig.md)*

*Inherited from [ConvictSchema](_operations_convict_schema_.convictschema.md).[validate](_operations_convict_schema_.convictschema.md#validate)*

*Overrides [SchemaCore](_operations_core_schema_core_.schemacore.md).[validate](_operations_core_schema_core_.schemacore.md#abstract-validate)*

*Defined in [operations/convict-schema.ts:18](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/convict-schema.ts#L18)*

**Parameters:**

Name | Type |
------ | ------ |
`inputConfig` | any |

**Returns:** *[OpConfig](../interfaces/_interfaces_jobs_.opconfig.md) & [DelayConfig](../interfaces/_builtin_delay_interfaces_.delayconfig.md)*

___

###  validateJob

▸ **validateJob**(`job`: *any*): *void*

*Inherited from [ConvictSchema](_operations_convict_schema_.convictschema.md).[validateJob](_operations_convict_schema_.convictschema.md#validatejob)*

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

*Inherited from [ConvictSchema](_operations_convict_schema_.convictschema.md).[type](_operations_convict_schema_.convictschema.md#static-type)*

*Defined in [operations/convict-schema.ts:32](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/convict-schema.ts#L32)*

**Returns:** *string*
