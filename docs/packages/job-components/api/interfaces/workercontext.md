---
title: Job Components: `WorkerContext`
sidebar_label: WorkerContext
---

# Interface: WorkerContext

## Hierarchy

* [Context](context.md)

  * **WorkerContext**

## Index

### Properties

* [apis](workercontext.md#apis)
* [arch](workercontext.md#arch)
* [assignment](workercontext.md#assignment)
* [cluster](workercontext.md#cluster)
* [foundation](workercontext.md#foundation)
* [logger](workercontext.md#logger)
* [name](workercontext.md#name)
* [platform](workercontext.md#platform)
* [sysconfig](workercontext.md#sysconfig)

## Properties

###  apis

• **apis**: *[WorkerContextAPIs](workercontextapis.md)*

*Overrides [Context](context.md).[apis](context.md#apis)*

*Defined in [interfaces/context.ts:138](https://github.com/terascope/teraslice/blob/d2d877b60/packages/job-components/src/interfaces/context.ts#L138)*

___

###  arch

• **arch**: *string*

*Inherited from [Context](context.md).[arch](context.md#arch)*

*Defined in [interfaces/context.ts:144](https://github.com/terascope/teraslice/blob/d2d877b60/packages/job-components/src/interfaces/context.ts#L144)*

___

###  assignment

• **assignment**: *"execution_controller" | "worker"*

*Overrides [Context](context.md).[assignment](context.md#assignment)*

*Defined in [interfaces/context.ts:139](https://github.com/terascope/teraslice/blob/d2d877b60/packages/job-components/src/interfaces/context.ts#L139)*

___

###  cluster

• **cluster**: *[ContextClusterConfig](contextclusterconfig.md)*

*Inherited from [Context](context.md).[cluster](context.md#cluster)*

*Defined in [interfaces/context.ts:151](https://github.com/terascope/teraslice/blob/d2d877b60/packages/job-components/src/interfaces/context.ts#L151)*

___

###  foundation

• **foundation**: *[LegacyFoundationApis](legacyfoundationapis.md)*

*Inherited from [Context](context.md).[foundation](context.md#foundation)*

*Defined in [interfaces/context.ts:146](https://github.com/terascope/teraslice/blob/d2d877b60/packages/job-components/src/interfaces/context.ts#L146)*

___

###  logger

• **logger**: *Logger*

*Inherited from [Context](context.md).[logger](context.md#logger)*

*Defined in [interfaces/context.ts:147](https://github.com/terascope/teraslice/blob/d2d877b60/packages/job-components/src/interfaces/context.ts#L147)*

___

###  name

• **name**: *string*

*Inherited from [Context](context.md).[name](context.md#name)*

*Defined in [interfaces/context.ts:148](https://github.com/terascope/teraslice/blob/d2d877b60/packages/job-components/src/interfaces/context.ts#L148)*

___

###  platform

• **platform**: *string*

*Inherited from [Context](context.md).[platform](context.md#platform)*

*Defined in [interfaces/context.ts:149](https://github.com/terascope/teraslice/blob/d2d877b60/packages/job-components/src/interfaces/context.ts#L149)*

___

###  sysconfig

• **sysconfig**: *[SysConfig](sysconfig.md)*

*Inherited from [Context](context.md).[sysconfig](context.md#sysconfig)*

*Defined in [interfaces/context.ts:150](https://github.com/terascope/teraslice/blob/d2d877b60/packages/job-components/src/interfaces/context.ts#L150)*
