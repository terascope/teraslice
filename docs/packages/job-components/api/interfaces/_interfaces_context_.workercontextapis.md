---
title: Job Components Interfaces Context Workercontextapis
sidebar_label: Interfaces Context Workercontextapis
---

> Interfaces Context Workercontextapis for @terascope/job-components

[Globals](../overview.md) / ["interfaces/context"](../modules/_interfaces_context_.md) / [WorkerContextAPIs](_interfaces_context_.workercontextapis.md) /

# Interface: WorkerContextAPIs

WorkerContext includes the type definitions for
the APIs available to Worker.
This extends the Terafoundation Context.

## Hierarchy

  * [ContextAPIs](_interfaces_context_.contextapis.md)

  * **WorkerContextAPIs**

## Indexable

● \[▪ **namespace**: *string*\]: any

WorkerContext includes the type definitions for
the APIs available to Worker.
This extends the Terafoundation Context.

### Index

#### Properties

* [assets](_interfaces_context_.workercontextapis.md#assets)
* [executionContext](_interfaces_context_.workercontextapis.md#executioncontext)
* [foundation](_interfaces_context_.workercontextapis.md#foundation)
* [job_runner](_interfaces_context_.workercontextapis.md#job_runner)
* [op_runner](_interfaces_context_.workercontextapis.md#op_runner)

#### Methods

* [registerAPI](_interfaces_context_.workercontextapis.md#registerapi)

## Properties

###  assets

• **assets**: *[AssetsAPI](_interfaces_context_.assetsapi.md)*

*Defined in [interfaces/context.ts:126](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/context.ts#L126)*

Includes an API for getting a client from Terafoundation

___

###  executionContext

• **executionContext**: *[ExecutionContextAPI](../classes/_execution_context_api_.executioncontextapi.md)*

*Defined in [interfaces/context.ts:132](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/context.ts#L132)*

An API for registering and loading the new Job APIs

___

###  foundation

• **foundation**: *[FoundationApis](_interfaces_context_.foundationapis.md)*

*Inherited from [ContextApis](_interfaces_context_.contextapis-1.md).[foundation](_interfaces_context_.contextapis-1.md#foundation)*

*Defined in [interfaces/context.ts:82](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/context.ts#L82)*

___

###  job_runner

• **job_runner**: *[JobRunnerAPI](_interfaces_context_.jobrunnerapi.md)*

*Defined in [interfaces/context.ts:130](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/context.ts#L130)*

Includes an API for getting a opConfig from the job

___

###  op_runner

• **op_runner**: *[OpRunnerAPI](_interfaces_context_.oprunnerapi.md)*

*Defined in [interfaces/context.ts:128](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/context.ts#L128)*

Includes an API for getting a client from Terafoundation

## Methods

###  registerAPI

▸ **registerAPI**(`namespace`: *string*, `apis`: *any*): *void*

*Inherited from [ContextApis](_interfaces_context_.contextapis-1.md).[registerAPI](_interfaces_context_.contextapis-1.md#registerapi)*

*Defined in [interfaces/context.ts:83](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/context.ts#L83)*

**Parameters:**

Name | Type |
------ | ------ |
`namespace` | string |
`apis` | any |

**Returns:** *void*
