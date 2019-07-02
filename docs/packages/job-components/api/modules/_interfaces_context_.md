---
title: Job Components Interfaces Context
sidebar_label: Interfaces Context
---

> Interfaces Context for @terascope/job-components

[Globals](../overview.md) / ["interfaces/context"](_interfaces_context_.md) /

# External module: "interfaces/context"

### Index

#### Interfaces

* [AssetsAPI](../interfaces/_interfaces_context_.assetsapi.md)
* [ClusterStateConfig](../interfaces/_interfaces_context_.clusterstateconfig.md)
* [ConnectionConfig](../interfaces/_interfaces_context_.connectionconfig.md)
* [Context](../interfaces/_interfaces_context_.context.md)
* [ContextAPIs](../interfaces/_interfaces_context_.contextapis.md)
* [ContextApis](../interfaces/_interfaces_context_.contextapis-1.md)
* [ContextClusterConfig](../interfaces/_interfaces_context_.contextclusterconfig.md)
* [FoundationApis](../interfaces/_interfaces_context_.foundationapis.md)
* [GetClientConfig](../interfaces/_interfaces_context_.getclientconfig.md)
* [IndexRolloverFrequency](../interfaces/_interfaces_context_.indexrolloverfrequency.md)
* [JobRunnerAPI](../interfaces/_interfaces_context_.jobrunnerapi.md)
* [LegacyFoundationApis](../interfaces/_interfaces_context_.legacyfoundationapis.md)
* [OpRunnerAPI](../interfaces/_interfaces_context_.oprunnerapi.md)
* [SysConfig](../interfaces/_interfaces_context_.sysconfig.md)
* [TerafoundationConfig](../interfaces/_interfaces_context_.terafoundationconfig.md)
* [TerasliceConfig](../interfaces/_interfaces_context_.terasliceconfig.md)
* [WorkerContext](../interfaces/_interfaces_context_.workercontext.md)
* [WorkerContextAPIs](../interfaces/_interfaces_context_.workercontextapis.md)

#### Type aliases

* [Assignment](_interfaces_context_.md#assignment)
* [ClientFactoryFn](_interfaces_context_.md#clientfactoryfn)
* [ClusterManagerType](_interfaces_context_.md#clustermanagertype)
* [RolloverFrequency](_interfaces_context_.md#rolloverfrequency)

## Type aliases

###  Assignment

Ƭ **Assignment**: *"assets_service" | "cluster_master" | "node_master" | "execution_controller" | "worker"*

*Defined in [interfaces/context.ts:158](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/context.ts#L158)*

___

###  ClientFactoryFn

Ƭ **ClientFactoryFn**: *function*

*Defined in [interfaces/context.ts:67](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/context.ts#L67)*

#### Type declaration:

▸ (`config`: *object*, `logger`: *`Logger`*, `options`: *[ConnectionConfig](../interfaces/_interfaces_context_.connectionconfig.md)*): *object*

**Parameters:**

Name | Type |
------ | ------ |
`config` | object |
`logger` | `Logger` |
`options` | [ConnectionConfig](../interfaces/_interfaces_context_.connectionconfig.md) |

___

###  ClusterManagerType

Ƭ **ClusterManagerType**: *"native" | "kubernetes"*

*Defined in [interfaces/context.ts:17](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/context.ts#L17)*

___

###  RolloverFrequency

Ƭ **RolloverFrequency**: *"daily" | "montly" | "yearly"*

*Defined in [interfaces/context.ts:10](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/context.ts#L10)*
