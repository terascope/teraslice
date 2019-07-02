---
title: Job Components Interfaces Jobs
sidebar_label: Interfaces Jobs
---

> Interfaces Jobs for @terascope/job-components

[Globals](../overview.md) / ["interfaces/jobs"](_interfaces_jobs_.md) /

# External module: "interfaces/jobs"

### Index

#### Interfaces

* [APIConfig](../interfaces/_interfaces_jobs_.apiconfig.md)
* [ExecutionConfig](../interfaces/_interfaces_jobs_.executionconfig.md)
* [LegacyExecutionContext](../interfaces/_interfaces_jobs_.legacyexecutioncontext.md)
* [OpConfig](../interfaces/_interfaces_jobs_.opconfig.md)
* [Targets](../interfaces/_interfaces_jobs_.targets.md)
* [ValidatedJobConfig](../interfaces/_interfaces_jobs_.validatedjobconfig.md)
* [Volume](../interfaces/_interfaces_jobs_.volume.md)

#### Type aliases

* [DeadLetterAPIFn](_interfaces_jobs_.md#deadletterapifn)
* [DeadLetterAction](_interfaces_jobs_.md#deadletteraction)
* [JobConfig](_interfaces_jobs_.md#jobconfig)
* [LifeCycle](_interfaces_jobs_.md#lifecycle)

## Type aliases

###  DeadLetterAPIFn

Ƭ **DeadLetterAPIFn**: *function*

*Defined in [interfaces/jobs.ts:35](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/jobs.ts#L35)*

A supported DeadLetterAPIFn

#### Type declaration:

▸ (`input`: *any*, `err`: *`Error`*): *void*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |
`err` | `Error` |

___

###  DeadLetterAction

Ƭ **DeadLetterAction**: *"throw" | "log" | "none" | string*

*Defined in [interfaces/jobs.ts:32](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/jobs.ts#L32)*

available dead letter queue actions

___

###  JobConfig

Ƭ **JobConfig**: *`Partial<ValidatedJobConfig>`*

*Defined in [interfaces/jobs.ts:56](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/jobs.ts#L56)*

JobConfig is the configuration that user specifies
for a Job

___

###  LifeCycle

Ƭ **LifeCycle**: *"once" | "persistent"*

*Defined in [interfaces/jobs.ts:50](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/jobs.ts#L50)*
