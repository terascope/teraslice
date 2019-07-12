---
title: Job Components: `Schema`
sidebar_label: Schema
---

# Class: Schema <**S, S, S, S**>

## Type parameters

▪ **S**

▪ **S**

▪ **S**

▪ **S**

## Hierarchy

  * [ConvictSchema](convictschema.md)‹*[CollectConfig](../interfaces/collectconfig.md)*›

  * [ConvictSchema](convictschema.md)‹*[DelayConfig](../interfaces/delayconfig.md)*›

  * [ConvictSchema](convictschema.md)‹*object*›

  * [ConvictSchema](convictschema.md)‹*[TestReaderConfig](../interfaces/testreaderconfig.md)*›

  * **Schema**

### Index

#### Constructors

* [constructor](schema.md#constructor)

#### Properties

* [context](schema.md#protected-context)
* [opType](schema.md#optype)
* [schema](schema.md#schema)

#### Methods

* [build](schema.md#build)
* [validate](schema.md#validate)
* [validateJob](schema.md#validatejob)
* [type](schema.md#static-type)

## Constructors

###  constructor

\+ **new Schema**(`context`: [Context](../interfaces/context.md), `opType`: [OpType](../overview.md#optype)): *[Schema](schema.md)*

*Inherited from [ConvictSchema](convictschema.md).[constructor](convictschema.md#constructor)*

*Overrides [SchemaCore](schemacore.md).[constructor](schemacore.md#constructor)*

*Defined in [operations/convict-schema.ts:10](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/job-components/src/operations/convict-schema.ts#L10)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`context` | [Context](../interfaces/context.md) | - |
`opType` | [OpType](../overview.md#optype) | "operation" |

**Returns:** *[Schema](schema.md)*

## Properties

### `Protected` context

• **context**: *[Context](../interfaces/context.md)*

*Inherited from [SchemaCore](schemacore.md).[context](schemacore.md#protected-context)*

*Overrides [SchemaCore](schemacore.md).[context](schemacore.md#protected-context)*

*Defined in [operations/core/schema-core.ts:8](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/job-components/src/operations/core/schema-core.ts#L8)*

___

###  opType

• **opType**: *[OpType](../overview.md#optype)*

*Inherited from [SchemaCore](schemacore.md).[opType](schemacore.md#optype)*

*Overrides [SchemaCore](schemacore.md).[opType](schemacore.md#optype)*

*Defined in [operations/core/schema-core.ts:9](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/job-components/src/operations/core/schema-core.ts#L9)*

___

###  schema

• **schema**: *`convict.Schema<S>`*

*Inherited from [ConvictSchema](convictschema.md).[schema](convictschema.md#schema)*

*Overrides [ConvictSchema](convictschema.md).[schema](convictschema.md#schema)*

*Defined in [operations/convict-schema.ts:10](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/job-components/src/operations/convict-schema.ts#L10)*

## Methods

###  build

▸ **build**(): *object*

*Overrides [ConvictSchema](convictschema.md).[build](convictschema.md#abstract-build)*

*Defined in [builtin/collect/schema.ts:5](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/job-components/src/builtin/collect/schema.ts#L5)*

**Returns:** *object*

___

###  validate

▸ **validate**(`inputConfig`: any): *[APIConfig](../interfaces/apiconfig.md) & [CollectConfig](../interfaces/collectconfig.md)*

*Inherited from [ConvictSchema](convictschema.md).[validate](convictschema.md#validate)*

*Overrides [SchemaCore](schemacore.md).[validate](schemacore.md#abstract-validate)*

*Defined in [operations/convict-schema.ts:17](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/job-components/src/operations/convict-schema.ts#L17)*

**Parameters:**

Name | Type |
------ | ------ |
`inputConfig` | any |

**Returns:** *[APIConfig](../interfaces/apiconfig.md) & [CollectConfig](../interfaces/collectconfig.md)*

▸ **validate**(`inputConfig`: any): *[OpConfig](../interfaces/opconfig.md) & [CollectConfig](../interfaces/collectconfig.md)*

*Inherited from [ConvictSchema](convictschema.md).[validate](convictschema.md#validate)*

*Overrides [SchemaCore](schemacore.md).[validate](schemacore.md#abstract-validate)*

*Defined in [operations/convict-schema.ts:18](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/job-components/src/operations/convict-schema.ts#L18)*

**Parameters:**

Name | Type |
------ | ------ |
`inputConfig` | any |

**Returns:** *[OpConfig](../interfaces/opconfig.md) & [CollectConfig](../interfaces/collectconfig.md)*

___

###  validateJob

▸ **validateJob**(`job`: any): *void*

*Inherited from [ConvictSchema](convictschema.md).[validateJob](convictschema.md#validatejob)*

*Overrides [SchemaCore](schemacore.md).[validateJob](schemacore.md#optional-abstract-validatejob)*

*Defined in [operations/convict-schema.ts:28](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/job-components/src/operations/convict-schema.ts#L28)*

**Parameters:**

Name | Type |
------ | ------ |
`job` | any |

**Returns:** *void*

___

### `Static` type

▸ **type**(): *string*

*Inherited from [ConvictSchema](convictschema.md).[type](convictschema.md#static-type)*

*Overrides [ConvictSchema](convictschema.md).[type](convictschema.md#static-type)*

*Defined in [operations/convict-schema.ts:32](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/job-components/src/operations/convict-schema.ts#L32)*

**Returns:** *string*
