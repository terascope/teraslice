---
title: Job Components: `WorkerContext`
sidebar_label: WorkerContext
---

# Interface: WorkerContext

## Hierarchy

* [Context](context.md)

  ↳ **WorkerContext**

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

*Defined in [packages/job-components/src/interfaces/context.ts:152](https://github.com/terascope/teraslice/blob/653cf7530/packages/job-components/src/interfaces/context.ts#L152)*

___

###  arch

• **arch**: *string*

*Inherited from [Context](context.md).[arch](context.md#arch)*

*Defined in [packages/job-components/src/interfaces/context.ts:158](https://github.com/terascope/teraslice/blob/653cf7530/packages/job-components/src/interfaces/context.ts#L158)*

___

###  assignment

• **assignment**: *"execution_controller" | "worker"*

*Overrides [Context](context.md).[assignment](context.md#assignment)*

*Defined in [packages/job-components/src/interfaces/context.ts:153](https://github.com/terascope/teraslice/blob/653cf7530/packages/job-components/src/interfaces/context.ts#L153)*

___

###  cluster

• **cluster**: *[ContextClusterConfig](contextclusterconfig.md)*

*Inherited from [Context](context.md).[cluster](context.md#cluster)*

*Defined in [packages/job-components/src/interfaces/context.ts:165](https://github.com/terascope/teraslice/blob/653cf7530/packages/job-components/src/interfaces/context.ts#L165)*

___

###  foundation

• **foundation**: *[LegacyFoundationApis](legacyfoundationapis.md)*

*Inherited from [Context](context.md).[foundation](context.md#foundation)*

*Defined in [packages/job-components/src/interfaces/context.ts:160](https://github.com/terascope/teraslice/blob/653cf7530/packages/job-components/src/interfaces/context.ts#L160)*

___

###  logger

• **logger**: *Logger*

*Inherited from [Context](context.md).[logger](context.md#logger)*

*Defined in [packages/job-components/src/interfaces/context.ts:161](https://github.com/terascope/teraslice/blob/653cf7530/packages/job-components/src/interfaces/context.ts#L161)*

___

###  name

• **name**: *string*

*Inherited from [Context](context.md).[name](context.md#name)*

*Defined in [packages/job-components/src/interfaces/context.ts:162](https://github.com/terascope/teraslice/blob/653cf7530/packages/job-components/src/interfaces/context.ts#L162)*

___

###  platform

• **platform**: *string*

*Inherited from [Context](context.md).[platform](context.md#platform)*

*Defined in [packages/job-components/src/interfaces/context.ts:163](https://github.com/terascope/teraslice/blob/653cf7530/packages/job-components/src/interfaces/context.ts#L163)*

___

###  sysconfig

• **sysconfig**: *[SysConfig](sysconfig.md)*

*Inherited from [Context](context.md).[sysconfig](context.md#sysconfig)*

*Defined in [packages/job-components/src/interfaces/context.ts:164](https://github.com/terascope/teraslice/blob/653cf7530/packages/job-components/src/interfaces/context.ts#L164)*
