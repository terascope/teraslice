---
title: Job Components: `Core`
sidebar_label: Core
---

# Class: Core <**T**>

The core class for creating for all varients or base classes for an operation.

## Type parameters

▪ **T**: *[Context](../interfaces/context.md)*

## Hierarchy

* **Core**

  ↳ [SlicerCore](slicercore.md)

  ↳ [OperationCore](operationcore.md)

  ↳ [APICore](apicore.md)

## Implements

* [OperationLifeCycle](../interfaces/operationlifecycle.md)

## Index

### Constructors

* [constructor](core.md#constructor)

### Properties

* [context](core.md#context)
* [events](core.md#events)
* [executionConfig](core.md#executionconfig)
* [logger](core.md#logger)

### Methods

* [initialize](core.md#abstract-initialize)
* [shutdown](core.md#abstract-shutdown)

## Constructors

###  constructor

\+ **new Core**(`context`: T, `executionConfig`: [ExecutionConfig](../interfaces/executionconfig.md), `logger`: Logger): *[Core](core.md)*

*Defined in [packages/job-components/src/operations/core/core.ts:13](https://github.com/terascope/teraslice/blob/78714a985/packages/job-components/src/operations/core/core.ts#L13)*

**Parameters:**

Name | Type |
------ | ------ |
`context` | T |
`executionConfig` | [ExecutionConfig](../interfaces/executionconfig.md) |
`logger` | Logger |

**Returns:** *[Core](core.md)*

## Properties

###  context

• **context**: *Readonly‹T›*

*Defined in [packages/job-components/src/operations/core/core.ts:10](https://github.com/terascope/teraslice/blob/78714a985/packages/job-components/src/operations/core/core.ts#L10)*

___

###  events

• **events**: *EventEmitter*

*Defined in [packages/job-components/src/operations/core/core.ts:13](https://github.com/terascope/teraslice/blob/78714a985/packages/job-components/src/operations/core/core.ts#L13)*

___

###  executionConfig

• **executionConfig**: *Readonly‹[ExecutionConfig](../interfaces/executionconfig.md)›*

*Defined in [packages/job-components/src/operations/core/core.ts:11](https://github.com/terascope/teraslice/blob/78714a985/packages/job-components/src/operations/core/core.ts#L11)*

___

###  logger

• **logger**: *Logger*

*Defined in [packages/job-components/src/operations/core/core.ts:12](https://github.com/terascope/teraslice/blob/78714a985/packages/job-components/src/operations/core/core.ts#L12)*

## Methods

### `Abstract` initialize

▸ **initialize**(`initConfig?`: any): *Promise‹void›*

*Implementation of [OperationLifeCycle](../interfaces/operationlifecycle.md)*

*Defined in [packages/job-components/src/operations/core/core.ts:22](https://github.com/terascope/teraslice/blob/78714a985/packages/job-components/src/operations/core/core.ts#L22)*

**Parameters:**

Name | Type |
------ | ------ |
`initConfig?` | any |

**Returns:** *Promise‹void›*

___

### `Abstract` shutdown

▸ **shutdown**(): *Promise‹void›*

*Implementation of [OperationLifeCycle](../interfaces/operationlifecycle.md)*

*Defined in [packages/job-components/src/operations/core/core.ts:24](https://github.com/terascope/teraslice/blob/78714a985/packages/job-components/src/operations/core/core.ts#L24)*

**Returns:** *Promise‹void›*
