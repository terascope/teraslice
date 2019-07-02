---
title: Job Components Interfaces Jobs Executionconfig
sidebar_label: Interfaces Jobs Executionconfig
---

> Interfaces Jobs Executionconfig for @terascope/job-components

[Globals](../overview.md) / ["interfaces/jobs"](../modules/_interfaces_jobs_.md) / [ExecutionConfig](_interfaces_jobs_.executionconfig.md) /

# Interface: ExecutionConfig

## Hierarchy

* [ValidatedJobConfig](_interfaces_jobs_.validatedjobconfig.md)

  * **ExecutionConfig**

### Index

#### Properties

* [analytics](_interfaces_jobs_.executionconfig.md#analytics)
* [apis](_interfaces_jobs_.executionconfig.md#apis)
* [assetIds](_interfaces_jobs_.executionconfig.md#optional-assetids)
* [assets](_interfaces_jobs_.executionconfig.md#assets)
* [cpu](_interfaces_jobs_.executionconfig.md#optional-cpu)
* [ex_id](_interfaces_jobs_.executionconfig.md#ex_id)
* [job_id](_interfaces_jobs_.executionconfig.md#job_id)
* [kubernetes_image](_interfaces_jobs_.executionconfig.md#optional-kubernetes_image)
* [lifecycle](_interfaces_jobs_.executionconfig.md#lifecycle)
* [max_retries](_interfaces_jobs_.executionconfig.md#max_retries)
* [memory](_interfaces_jobs_.executionconfig.md#optional-memory)
* [name](_interfaces_jobs_.executionconfig.md#name)
* [operations](_interfaces_jobs_.executionconfig.md#operations)
* [probation_window](_interfaces_jobs_.executionconfig.md#probation_window)
* [recycle_worker](_interfaces_jobs_.executionconfig.md#recycle_worker)
* [slicer_hostname](_interfaces_jobs_.executionconfig.md#slicer_hostname)
* [slicer_port](_interfaces_jobs_.executionconfig.md#slicer_port)
* [slicers](_interfaces_jobs_.executionconfig.md#slicers)
* [targets](_interfaces_jobs_.executionconfig.md#optional-targets)
* [volumes](_interfaces_jobs_.executionconfig.md#optional-volumes)
* [workers](_interfaces_jobs_.executionconfig.md#workers)

## Properties

###  analytics

• **analytics**: *boolean*

*Inherited from [ValidatedJobConfig](_interfaces_jobs_.validatedjobconfig.md).[analytics](_interfaces_jobs_.validatedjobconfig.md#analytics)*

*Defined in [interfaces/jobs.ts:59](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/jobs.ts#L59)*

___

###  apis

• **apis**: *[APIConfig](_interfaces_jobs_.apiconfig.md)[]*

*Inherited from [ValidatedJobConfig](_interfaces_jobs_.validatedjobconfig.md).[apis](_interfaces_jobs_.validatedjobconfig.md#apis)*

*Defined in [interfaces/jobs.ts:65](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/jobs.ts#L65)*

___

### `Optional` assetIds

• **assetIds**? : *string[]*

*Inherited from [ValidatedJobConfig](_interfaces_jobs_.validatedjobconfig.md).[assetIds](_interfaces_jobs_.validatedjobconfig.md#optional-assetids)*

*Defined in [interfaces/jobs.ts:61](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/jobs.ts#L61)*

___

###  assets

• **assets**: *string[]*

*Inherited from [ValidatedJobConfig](_interfaces_jobs_.validatedjobconfig.md).[assets](_interfaces_jobs_.validatedjobconfig.md#assets)*

*Defined in [interfaces/jobs.ts:60](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/jobs.ts#L60)*

___

### `Optional` cpu

• **cpu**? : *undefined | number*

*Inherited from [ValidatedJobConfig](_interfaces_jobs_.validatedjobconfig.md).[cpu](_interfaces_jobs_.validatedjobconfig.md#optional-cpu)*

*Defined in [interfaces/jobs.ts:74](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/jobs.ts#L74)*

This will only be available in the context of k8s

___

###  ex_id

• **ex_id**: *string*

*Defined in [interfaces/jobs.ts:94](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/jobs.ts#L94)*

___

###  job_id

• **job_id**: *string*

*Defined in [interfaces/jobs.ts:95](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/jobs.ts#L95)*

___

### `Optional` kubernetes_image

• **kubernetes_image**? : *undefined | string*

*Inherited from [ValidatedJobConfig](_interfaces_jobs_.validatedjobconfig.md).[kubernetes_image](_interfaces_jobs_.validatedjobconfig.md#optional-kubernetes_image)*

*Defined in [interfaces/jobs.ts:80](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/jobs.ts#L80)*

This will only be available in the context of k8s

___

###  lifecycle

• **lifecycle**: *[LifeCycle](../modules/_interfaces_jobs_.md#lifecycle)*

*Inherited from [ValidatedJobConfig](_interfaces_jobs_.validatedjobconfig.md).[lifecycle](_interfaces_jobs_.validatedjobconfig.md#lifecycle)*

*Defined in [interfaces/jobs.ts:62](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/jobs.ts#L62)*

___

###  max_retries

• **max_retries**: *number*

*Inherited from [ValidatedJobConfig](_interfaces_jobs_.validatedjobconfig.md).[max_retries](_interfaces_jobs_.validatedjobconfig.md#max_retries)*

*Defined in [interfaces/jobs.ts:63](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/jobs.ts#L63)*

___

### `Optional` memory

• **memory**? : *undefined | number*

*Inherited from [ValidatedJobConfig](_interfaces_jobs_.validatedjobconfig.md).[memory](_interfaces_jobs_.validatedjobconfig.md#optional-memory)*

*Defined in [interfaces/jobs.ts:76](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/jobs.ts#L76)*

This will only be available in the context of k8s

___

###  name

• **name**: *string*

*Inherited from [ValidatedJobConfig](_interfaces_jobs_.validatedjobconfig.md).[name](_interfaces_jobs_.validatedjobconfig.md#name)*

*Defined in [interfaces/jobs.ts:64](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/jobs.ts#L64)*

___

###  operations

• **operations**: *[OpConfig](_interfaces_jobs_.opconfig.md)[]*

*Inherited from [ValidatedJobConfig](_interfaces_jobs_.validatedjobconfig.md).[operations](_interfaces_jobs_.validatedjobconfig.md#operations)*

*Defined in [interfaces/jobs.ts:66](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/jobs.ts#L66)*

___

###  probation_window

• **probation_window**: *number*

*Inherited from [ValidatedJobConfig](_interfaces_jobs_.validatedjobconfig.md).[probation_window](_interfaces_jobs_.validatedjobconfig.md#probation_window)*

*Defined in [interfaces/jobs.ts:67](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/jobs.ts#L67)*

___

###  recycle_worker

• **recycle_worker**: *number*

*Inherited from [ValidatedJobConfig](_interfaces_jobs_.validatedjobconfig.md).[recycle_worker](_interfaces_jobs_.validatedjobconfig.md#recycle_worker)*

*Defined in [interfaces/jobs.ts:68](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/jobs.ts#L68)*

___

###  slicer_hostname

• **slicer_hostname**: *string*

*Defined in [interfaces/jobs.ts:96](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/jobs.ts#L96)*

___

###  slicer_port

• **slicer_port**: *number*

*Defined in [interfaces/jobs.ts:97](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/jobs.ts#L97)*

___

###  slicers

• **slicers**: *number*

*Inherited from [ValidatedJobConfig](_interfaces_jobs_.validatedjobconfig.md).[slicers](_interfaces_jobs_.validatedjobconfig.md#slicers)*

*Defined in [interfaces/jobs.ts:69](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/jobs.ts#L69)*

___

### `Optional` targets

• **targets**? : *[Targets](_interfaces_jobs_.targets.md)[]*

*Inherited from [ValidatedJobConfig](_interfaces_jobs_.validatedjobconfig.md).[targets](_interfaces_jobs_.validatedjobconfig.md#optional-targets)*

*Defined in [interfaces/jobs.ts:72](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/jobs.ts#L72)*

This will only be available in the context of k8s

___

### `Optional` volumes

• **volumes**? : *[Volume](_interfaces_jobs_.volume.md)[]*

*Inherited from [ValidatedJobConfig](_interfaces_jobs_.validatedjobconfig.md).[volumes](_interfaces_jobs_.validatedjobconfig.md#optional-volumes)*

*Defined in [interfaces/jobs.ts:78](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/jobs.ts#L78)*

This will only be available in the context of k8s

___

###  workers

• **workers**: *number*

*Inherited from [ValidatedJobConfig](_interfaces_jobs_.validatedjobconfig.md).[workers](_interfaces_jobs_.validatedjobconfig.md#workers)*

*Defined in [interfaces/jobs.ts:70](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/jobs.ts#L70)*
