---
title: Job Components: `WorkerContextAPIs`
sidebar_label: WorkerContextAPIs
---

# Interface: WorkerContextAPIs

WorkerContext includes the type definitions for
the APIs available to Worker or Slicer.
This extends the Terafoundation Context.

## Hierarchy

  ↳ [ContextAPIs](contextapis.md)

  ↳ **WorkerContextAPIs**

## Indexable

* \[ **namespace**: *string*\]: any

WorkerContext includes the type definitions for
the APIs available to Worker or Slicer.
This extends the Terafoundation Context.

## Index

### Properties

* [assets](workercontextapis.md#assets)
* [executionContext](workercontextapis.md#executioncontext)
* [foundation](workercontextapis.md#foundation)
* [job_runner](workercontextapis.md#job_runner)
* [op_runner](workercontextapis.md#op_runner)

### Methods

* [registerAPI](workercontextapis.md#registerapi)

## Properties

###  assets

• **assets**: *[AssetsAPI](assetsapi.md)*

*Defined in [packages/job-components/src/interfaces/context.ts:136](https://github.com/terascope/teraslice/blob/f95bb5556/packages/job-components/src/interfaces/context.ts#L136)*

Includes an API for getting a client from Terafoundation

___

###  executionContext

• **executionContext**: *[ExecutionContextAPI](../classes/executioncontextapi.md)*

*Defined in [packages/job-components/src/interfaces/context.ts:148](https://github.com/terascope/teraslice/blob/f95bb5556/packages/job-components/src/interfaces/context.ts#L148)*

An API for registering and loading the new Job APIs

___

###  foundation

• **foundation**: *[FoundationApis](foundationapis.md)*

*Inherited from [ContextApis](contextapis.md).[foundation](contextapis.md#foundation)*

*Defined in [packages/job-components/src/interfaces/context.ts:93](https://github.com/terascope/teraslice/blob/f95bb5556/packages/job-components/src/interfaces/context.ts#L93)*

___

###  job_runner

• **job_runner**: *[JobRunnerAPI](jobrunnerapi.md)*

*Defined in [packages/job-components/src/interfaces/context.ts:144](https://github.com/terascope/teraslice/blob/f95bb5556/packages/job-components/src/interfaces/context.ts#L144)*

Includes an API for getting a opConfig from the job

___

###  op_runner

• **op_runner**: *[OpRunnerAPI](oprunnerapi.md)*

*Defined in [packages/job-components/src/interfaces/context.ts:140](https://github.com/terascope/teraslice/blob/f95bb5556/packages/job-components/src/interfaces/context.ts#L140)*

Includes an API for getting a client from Terafoundation

## Methods

###  registerAPI

▸ **registerAPI**(`namespace`: string, `apis`: any): *void*

*Inherited from [ContextApis](contextapis.md).[registerAPI](contextapis.md#registerapi)*

*Defined in [packages/job-components/src/interfaces/context.ts:94](https://github.com/terascope/teraslice/blob/f95bb5556/packages/job-components/src/interfaces/context.ts#L94)*

**Parameters:**

Name | Type |
------ | ------ |
`namespace` | string |
`apis` | any |

**Returns:** *void*
