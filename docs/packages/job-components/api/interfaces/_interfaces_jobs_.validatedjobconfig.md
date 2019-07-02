---
title: Job Components Interfaces Jobs Validatedjobconfig
sidebar_label: Interfaces Jobs Validatedjobconfig
---

> Interfaces Jobs Validatedjobconfig for @terascope/job-components

[Globals](../overview.md) / ["interfaces/jobs"](../modules/_interfaces_jobs_.md) / [ValidatedJobConfig](_interfaces_jobs_.validatedjobconfig.md) /

# Interface: ValidatedJobConfig

## Hierarchy

* **ValidatedJobConfig**

  * [ExecutionConfig](_interfaces_jobs_.executionconfig.md)

### Index

#### Properties

* [analytics](_interfaces_jobs_.validatedjobconfig.md#analytics)
* [apis](_interfaces_jobs_.validatedjobconfig.md#apis)
* [assetIds](_interfaces_jobs_.validatedjobconfig.md#optional-assetids)
* [assets](_interfaces_jobs_.validatedjobconfig.md#assets)
* [cpu](_interfaces_jobs_.validatedjobconfig.md#optional-cpu)
* [kubernetes_image](_interfaces_jobs_.validatedjobconfig.md#optional-kubernetes_image)
* [lifecycle](_interfaces_jobs_.validatedjobconfig.md#lifecycle)
* [max_retries](_interfaces_jobs_.validatedjobconfig.md#max_retries)
* [memory](_interfaces_jobs_.validatedjobconfig.md#optional-memory)
* [name](_interfaces_jobs_.validatedjobconfig.md#name)
* [operations](_interfaces_jobs_.validatedjobconfig.md#operations)
* [probation_window](_interfaces_jobs_.validatedjobconfig.md#probation_window)
* [recycle_worker](_interfaces_jobs_.validatedjobconfig.md#recycle_worker)
* [slicers](_interfaces_jobs_.validatedjobconfig.md#slicers)
* [targets](_interfaces_jobs_.validatedjobconfig.md#optional-targets)
* [volumes](_interfaces_jobs_.validatedjobconfig.md#optional-volumes)
* [workers](_interfaces_jobs_.validatedjobconfig.md#workers)

## Properties

###  analytics

• **analytics**: *boolean*

*Defined in [interfaces/jobs.ts:59](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/jobs.ts#L59)*

___

###  apis

• **apis**: *[APIConfig](_interfaces_jobs_.apiconfig.md)[]*

*Defined in [interfaces/jobs.ts:65](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/jobs.ts#L65)*

___

### `Optional` assetIds

• **assetIds**? : *string[]*

*Defined in [interfaces/jobs.ts:61](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/jobs.ts#L61)*

___

###  assets

• **assets**: *string[]*

*Defined in [interfaces/jobs.ts:60](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/jobs.ts#L60)*

___

### `Optional` cpu

• **cpu**? : *undefined | number*

*Defined in [interfaces/jobs.ts:74](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/jobs.ts#L74)*

This will only be available in the context of k8s

___

### `Optional` kubernetes_image

• **kubernetes_image**? : *undefined | string*

*Defined in [interfaces/jobs.ts:80](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/jobs.ts#L80)*

This will only be available in the context of k8s

___

###  lifecycle

• **lifecycle**: *[LifeCycle](../modules/_interfaces_jobs_.md#lifecycle)*

*Defined in [interfaces/jobs.ts:62](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/jobs.ts#L62)*

___

###  max_retries

• **max_retries**: *number*

*Defined in [interfaces/jobs.ts:63](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/jobs.ts#L63)*

___

### `Optional` memory

• **memory**? : *undefined | number*

*Defined in [interfaces/jobs.ts:76](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/jobs.ts#L76)*

This will only be available in the context of k8s

___

###  name

• **name**: *string*

*Defined in [interfaces/jobs.ts:64](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/jobs.ts#L64)*

___

###  operations

• **operations**: *[OpConfig](_interfaces_jobs_.opconfig.md)[]*

*Defined in [interfaces/jobs.ts:66](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/jobs.ts#L66)*

___

###  probation_window

• **probation_window**: *number*

*Defined in [interfaces/jobs.ts:67](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/jobs.ts#L67)*

___

###  recycle_worker

• **recycle_worker**: *number*

*Defined in [interfaces/jobs.ts:68](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/jobs.ts#L68)*

___

###  slicers

• **slicers**: *number*

*Defined in [interfaces/jobs.ts:69](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/jobs.ts#L69)*

___

### `Optional` targets

• **targets**? : *[Targets](_interfaces_jobs_.targets.md)[]*

*Defined in [interfaces/jobs.ts:72](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/jobs.ts#L72)*

This will only be available in the context of k8s

___

### `Optional` volumes

• **volumes**? : *[Volume](_interfaces_jobs_.volume.md)[]*

*Defined in [interfaces/jobs.ts:78](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/jobs.ts#L78)*

This will only be available in the context of k8s

___

###  workers

• **workers**: *number*

*Defined in [interfaces/jobs.ts:70](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/jobs.ts#L70)*
