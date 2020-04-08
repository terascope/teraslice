---
title: Job Components: `SchemaCore`
sidebar_label: SchemaCore
---

# Class: SchemaCore <**T**>

A base class for supporting "Schema" definition

## Type parameters

▪ **T**

## Hierarchy

* **SchemaCore**

  ↳ [ConvictSchema](convictschema.md)

## Index

### Constructors

* [constructor](schemacore.md#constructor)

### Properties

* [context](schemacore.md#protected-context)
* [opType](schemacore.md#optype)

### Methods

* [build](schemacore.md#abstract-build)
* [validate](schemacore.md#abstract-validate)
* [validateJob](schemacore.md#optional-abstract-validatejob)

## Constructors

###  constructor

\+ **new SchemaCore**(`context`: [Context](../interfaces/context.md), `opType`: [OpType](../overview.md#optype)): *[SchemaCore](schemacore.md)*

*Defined in [packages/job-components/src/operations/core/schema-core.ts:9](https://github.com/terascope/teraslice/blob/b843209f9/packages/job-components/src/operations/core/schema-core.ts#L9)*

**Parameters:**

Name | Type |
------ | ------ |
`context` | [Context](../interfaces/context.md) |
`opType` | [OpType](../overview.md#optype) |

**Returns:** *[SchemaCore](schemacore.md)*

## Properties

### `Protected` context

• **context**: *[Context](../interfaces/context.md)*

*Defined in [packages/job-components/src/operations/core/schema-core.ts:8](https://github.com/terascope/teraslice/blob/b843209f9/packages/job-components/src/operations/core/schema-core.ts#L8)*

___

###  opType

• **opType**: *[OpType](../overview.md#optype)*

*Defined in [packages/job-components/src/operations/core/schema-core.ts:9](https://github.com/terascope/teraslice/blob/b843209f9/packages/job-components/src/operations/core/schema-core.ts#L9)*

## Methods

### `Abstract` build

▸ **build**(`context?`: [Context](../interfaces/context.md)): *any*

*Defined in [packages/job-components/src/operations/core/schema-core.ts:16](https://github.com/terascope/teraslice/blob/b843209f9/packages/job-components/src/operations/core/schema-core.ts#L16)*

**Parameters:**

Name | Type |
------ | ------ |
`context?` | [Context](../interfaces/context.md) |

**Returns:** *any*

___

### `Abstract` validate

▸ **validate**(`inputConfig`: any): *[OpConfig](../interfaces/opconfig.md) & T*

*Defined in [packages/job-components/src/operations/core/schema-core.ts:17](https://github.com/terascope/teraslice/blob/b843209f9/packages/job-components/src/operations/core/schema-core.ts#L17)*

**Parameters:**

Name | Type |
------ | ------ |
`inputConfig` | any |

**Returns:** *[OpConfig](../interfaces/opconfig.md) & T*

___

### `Optional` `Abstract` validateJob

▸ **validateJob**(`job`: [ValidatedJobConfig](../interfaces/validatedjobconfig.md)): *void*

*Defined in [packages/job-components/src/operations/core/schema-core.ts:18](https://github.com/terascope/teraslice/blob/b843209f9/packages/job-components/src/operations/core/schema-core.ts#L18)*

**Parameters:**

Name | Type |
------ | ------ |
`job` | [ValidatedJobConfig](../interfaces/validatedjobconfig.md) |

**Returns:** *void*
