---
title: Job Components Convictschema
sidebar_label: Convictschema
---

[ConvictSchema](convictschema.md) /

# Class: ConvictSchema <**T, S**>

A base class for supporting convict "Schema" definitions

## Type parameters

▪ **T**: *`Object`*

▪ **S**

## Hierarchy

* [SchemaCore](schemacore.md)‹*`T`*›

  * **ConvictSchema**

  * [Schema](schema.md)

  * [Schema](schema.md)

  * [Schema](schema.md)

  * [Schema](schema.md)

  * [Schema](schema.md)

  * [Schema](schema.md)

  * [Schema](schema.md)

  * [Schema](schema.md)

  * [Schema](schema.md)

  * [Schema](schema.md)

### Index

#### Constructors

* [constructor](convictschema.md#constructor)

#### Properties

* [context](convictschema.md#protected-context)
* [opType](convictschema.md#optype)
* [schema](convictschema.md#schema)

#### Methods

* [build](convictschema.md#abstract-build)
* [validate](convictschema.md#validate)
* [validateJob](convictschema.md#validatejob)
* [type](convictschema.md#static-type)

## Constructors

###  constructor

\+ **new ConvictSchema**(`context`: *[Context](../interfaces/context.md)*, `opType`: *[OpType](../overview.md#optype)*): *[ConvictSchema](convictschema.md)*

*Overrides [SchemaCore](schemacore.md).[constructor](schemacore.md#constructor)*

*Defined in [src/operations/convict-schema.ts:10](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/operations/convict-schema.ts#L10)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`context` | [Context](../interfaces/context.md) | - |
`opType` | [OpType](../overview.md#optype) | "operation" |

**Returns:** *[ConvictSchema](convictschema.md)*

## Properties

### `Protected` context

• **context**: *[Context](../interfaces/context.md)*

*Inherited from [SchemaCore](schemacore.md).[context](schemacore.md#protected-context)*

*Defined in [src/operations/core/schema-core.ts:8](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/operations/core/schema-core.ts#L8)*

___

###  opType

• **opType**: *[OpType](../overview.md#optype)*

*Inherited from [SchemaCore](schemacore.md).[opType](schemacore.md#optype)*

*Defined in [src/operations/core/schema-core.ts:9](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/operations/core/schema-core.ts#L9)*

___

###  schema

• **schema**: *`convict.Schema<S>`*

*Defined in [src/operations/convict-schema.ts:10](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/operations/convict-schema.ts#L10)*

## Methods

### `Abstract` build

▸ **build**<**U**>(`context?`: *[Context](../interfaces/context.md)*): *`convict.Schema<S & U>`*

*Overrides [SchemaCore](schemacore.md).[build](schemacore.md#abstract-build)*

*Defined in [src/operations/convict-schema.ts:36](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/operations/convict-schema.ts#L36)*

**Type parameters:**

▪ **U**

**Parameters:**

Name | Type |
------ | ------ |
`context?` | [Context](../interfaces/context.md) |

**Returns:** *`convict.Schema<S & U>`*

___

###  validate

▸ **validate**(`inputConfig`: *any*): *[APIConfig](../interfaces/apiconfig.md) & `T`*

*Overrides [SchemaCore](schemacore.md).[validate](schemacore.md#abstract-validate)*

*Defined in [src/operations/convict-schema.ts:17](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/operations/convict-schema.ts#L17)*

**Parameters:**

Name | Type |
------ | ------ |
`inputConfig` | any |

**Returns:** *[APIConfig](../interfaces/apiconfig.md) & `T`*

▸ **validate**(`inputConfig`: *any*): *[OpConfig](../interfaces/opconfig.md) & `T`*

*Overrides [SchemaCore](schemacore.md).[validate](schemacore.md#abstract-validate)*

*Defined in [src/operations/convict-schema.ts:18](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/operations/convict-schema.ts#L18)*

**Parameters:**

Name | Type |
------ | ------ |
`inputConfig` | any |

**Returns:** *[OpConfig](../interfaces/opconfig.md) & `T`*

___

###  validateJob

▸ **validateJob**(`job`: *any*): *void*

*Overrides [SchemaCore](schemacore.md).[validateJob](schemacore.md#optional-abstract-validatejob)*

*Defined in [src/operations/convict-schema.ts:28](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/operations/convict-schema.ts#L28)*

**Parameters:**

Name | Type |
------ | ------ |
`job` | any |

**Returns:** *void*

___

### `Static` type

▸ **type**(): *string*

*Defined in [src/operations/convict-schema.ts:32](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/operations/convict-schema.ts#L32)*

**Returns:** *string*
