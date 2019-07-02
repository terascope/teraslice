---
title: Job Components Operations Core Core Core
sidebar_label: Operations Core Core Core
---

> Operations Core Core Core for @terascope/job-components

[Globals](../overview.md) / ["operations/core/core"](../modules/_operations_core_core_.md) / [Core](_operations_core_core_.core.md) /

# Class: Core <**T**>

The core class for creating for all varients or base classes for an operation.

## Type parameters

▪ **T**: *[Context](../interfaces/_interfaces_context_.context.md)*

## Hierarchy

* **Core**

  * [SlicerCore](_operations_core_slicer_core_.slicercore.md)

  * [OperationCore](_operations_core_operation_core_.operationcore.md)

  * [APICore](_operations_core_api_core_.apicore.md)

## Implements

* [OperationLifeCycle](../interfaces/_interfaces_operation_lifecycle_.operationlifecycle.md)

### Index

#### Constructors

* [constructor](_operations_core_core_.core.md#constructor)

#### Properties

* [context](_operations_core_core_.core.md#context)
* [events](_operations_core_core_.core.md#events)
* [executionConfig](_operations_core_core_.core.md#executionconfig)
* [logger](_operations_core_core_.core.md#logger)

#### Methods

* [initialize](_operations_core_core_.core.md#abstract-initialize)
* [shutdown](_operations_core_core_.core.md#abstract-shutdown)

## Constructors

###  constructor

\+ **new Core**(`context`: *`T`*, `executionConfig`: *[ExecutionConfig](../interfaces/_interfaces_jobs_.executionconfig.md)*, `logger`: *`Logger`*): *[Core](_operations_core_core_.core.md)*

*Defined in [operations/core/core.ts:13](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/core.ts#L13)*

**Parameters:**

Name | Type |
------ | ------ |
`context` | `T` |
`executionConfig` | [ExecutionConfig](../interfaces/_interfaces_jobs_.executionconfig.md) |
`logger` | `Logger` |

**Returns:** *[Core](_operations_core_core_.core.md)*

## Properties

###  context

• **context**: *`Readonly<T>`*

*Defined in [operations/core/core.ts:10](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/core.ts#L10)*

___

###  events

• **events**: *`EventEmitter`*

*Defined in [operations/core/core.ts:13](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/core.ts#L13)*

___

###  executionConfig

• **executionConfig**: *`Readonly<ExecutionConfig>`*

*Defined in [operations/core/core.ts:11](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/core.ts#L11)*

___

###  logger

• **logger**: *`Logger`*

*Defined in [operations/core/core.ts:12](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/core.ts#L12)*

## Methods

### `Abstract` initialize

▸ **initialize**(`initConfig?`: *any*): *`Promise<void>`*

*Implementation of [OperationLifeCycle](../interfaces/_interfaces_operation_lifecycle_.operationlifecycle.md)*

*Defined in [operations/core/core.ts:22](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/core.ts#L22)*

**Parameters:**

Name | Type |
------ | ------ |
`initConfig?` | any |

**Returns:** *`Promise<void>`*

___

### `Abstract` shutdown

▸ **shutdown**(): *`Promise<void>`*

*Implementation of [OperationLifeCycle](../interfaces/_interfaces_operation_lifecycle_.operationlifecycle.md)*

*Defined in [operations/core/core.ts:24](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/core.ts#L24)*

**Returns:** *`Promise<void>`*
