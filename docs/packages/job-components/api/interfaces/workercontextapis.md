---
title: Job Components: `WorkerContextAPIs`
sidebar_label: WorkerContextAPIs
---

# Interface: WorkerContextAPIs

WorkerContext includes the type definitions for
the APIs available to Worker.
This extends the Terafoundation Context.

## Hierarchy

  * [ContextAPIs](contextapis.md)

  * **WorkerContextAPIs**

## Indexable

● \[▪ **namespace**: *string*\]: any

WorkerContext includes the type definitions for
the APIs available to Worker.
This extends the Terafoundation Context.

### Index

#### Properties

* [assets](workercontextapis.md#assets)
* [executionContext](workercontextapis.md#executioncontext)
* [foundation](workercontextapis.md#foundation)
* [job_runner](workercontextapis.md#job_runner)
* [op_runner](workercontextapis.md#op_runner)

#### Methods

* [registerAPI](workercontextapis.md#registerapi)

## Properties

###  assets

• **assets**: *[AssetsAPI](assetsapi.md)*

*Defined in [interfaces/context.ts:126](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/job-components/src/interfaces/context.ts#L126)*

Includes an API for getting a client from Terafoundation

___

###  executionContext

• **executionContext**: *[ExecutionContextAPI](../classes/executioncontextapi.md)*

*Defined in [interfaces/context.ts:132](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/job-components/src/interfaces/context.ts#L132)*

An API for registering and loading the new Job APIs

___

###  foundation

• **foundation**: *[FoundationApis](foundationapis.md)*

*Inherited from [ContextApis](contextapis.md).[foundation](contextapis.md#foundation)*

*Defined in [interfaces/context.ts:82](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/job-components/src/interfaces/context.ts#L82)*

___

###  job_runner

• **job_runner**: *[JobRunnerAPI](jobrunnerapi.md)*

*Defined in [interfaces/context.ts:130](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/job-components/src/interfaces/context.ts#L130)*

Includes an API for getting a opConfig from the job

___

###  op_runner

• **op_runner**: *[OpRunnerAPI](oprunnerapi.md)*

*Defined in [interfaces/context.ts:128](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/job-components/src/interfaces/context.ts#L128)*

Includes an API for getting a client from Terafoundation

## Methods

###  registerAPI

▸ **registerAPI**(`namespace`: *string*, `apis`: *any*): *void*

*Inherited from [ContextApis](contextapis.md).[registerAPI](contextapis.md#registerapi)*

*Defined in [interfaces/context.ts:83](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/job-components/src/interfaces/context.ts#L83)*

**Parameters:**

Name | Type |
------ | ------ |
`namespace` | string |
`apis` | any |

**Returns:** *void*

