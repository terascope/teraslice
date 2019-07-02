---
title: Job Components :: ValidatedJobConfig
sidebar_label: ValidatedJobConfig
---

# Interface: ValidatedJobConfig

## Hierarchy

* **ValidatedJobConfig**

  * [ExecutionConfig](executionconfig.md)

### Index

#### Properties

* [analytics](validatedjobconfig.md#analytics)
* [apis](validatedjobconfig.md#apis)
* [assetIds](validatedjobconfig.md#optional-assetids)
* [assets](validatedjobconfig.md#assets)
* [cpu](validatedjobconfig.md#optional-cpu)
* [kubernetes_image](validatedjobconfig.md#optional-kubernetes_image)
* [lifecycle](validatedjobconfig.md#lifecycle)
* [max_retries](validatedjobconfig.md#max_retries)
* [memory](validatedjobconfig.md#optional-memory)
* [name](validatedjobconfig.md#name)
* [operations](validatedjobconfig.md#operations)
* [probation_window](validatedjobconfig.md#probation_window)
* [recycle_worker](validatedjobconfig.md#recycle_worker)
* [slicers](validatedjobconfig.md#slicers)
* [targets](validatedjobconfig.md#optional-targets)
* [volumes](validatedjobconfig.md#optional-volumes)
* [workers](validatedjobconfig.md#workers)

## Properties

###  analytics

• **analytics**: *boolean*

*Defined in [interfaces/jobs.ts:59](https://github.com/terascope/teraslice/blob/e480fc67/packages/job-components/src/interfaces/jobs.ts#L59)*

___

###  apis

• **apis**: *[APIConfig](apiconfig.md)[]*

*Defined in [interfaces/jobs.ts:65](https://github.com/terascope/teraslice/blob/e480fc67/packages/job-components/src/interfaces/jobs.ts#L65)*

___

### `Optional` assetIds

• **assetIds**? : *string[]*

*Defined in [interfaces/jobs.ts:61](https://github.com/terascope/teraslice/blob/e480fc67/packages/job-components/src/interfaces/jobs.ts#L61)*

___

###  assets

• **assets**: *string[]*

*Defined in [interfaces/jobs.ts:60](https://github.com/terascope/teraslice/blob/e480fc67/packages/job-components/src/interfaces/jobs.ts#L60)*

___

### `Optional` cpu

• **cpu**? : *undefined | number*

*Defined in [interfaces/jobs.ts:74](https://github.com/terascope/teraslice/blob/e480fc67/packages/job-components/src/interfaces/jobs.ts#L74)*

This will only be available in the context of k8s

___

### `Optional` kubernetes_image

• **kubernetes_image**? : *undefined | string*

*Defined in [interfaces/jobs.ts:80](https://github.com/terascope/teraslice/blob/e480fc67/packages/job-components/src/interfaces/jobs.ts#L80)*

This will only be available in the context of k8s

___

###  lifecycle

• **lifecycle**: *[LifeCycle](../overview.md#lifecycle)*

*Defined in [interfaces/jobs.ts:62](https://github.com/terascope/teraslice/blob/e480fc67/packages/job-components/src/interfaces/jobs.ts#L62)*

___

###  max_retries

• **max_retries**: *number*

*Defined in [interfaces/jobs.ts:63](https://github.com/terascope/teraslice/blob/e480fc67/packages/job-components/src/interfaces/jobs.ts#L63)*

___

### `Optional` memory

• **memory**? : *undefined | number*

*Defined in [interfaces/jobs.ts:76](https://github.com/terascope/teraslice/blob/e480fc67/packages/job-components/src/interfaces/jobs.ts#L76)*

This will only be available in the context of k8s

___

###  name

• **name**: *string*

*Defined in [interfaces/jobs.ts:64](https://github.com/terascope/teraslice/blob/e480fc67/packages/job-components/src/interfaces/jobs.ts#L64)*

___

###  operations

• **operations**: *[OpConfig](opconfig.md)[]*

*Defined in [interfaces/jobs.ts:66](https://github.com/terascope/teraslice/blob/e480fc67/packages/job-components/src/interfaces/jobs.ts#L66)*

___

###  probation_window

• **probation_window**: *number*

*Defined in [interfaces/jobs.ts:67](https://github.com/terascope/teraslice/blob/e480fc67/packages/job-components/src/interfaces/jobs.ts#L67)*

___

###  recycle_worker

• **recycle_worker**: *number*

*Defined in [interfaces/jobs.ts:68](https://github.com/terascope/teraslice/blob/e480fc67/packages/job-components/src/interfaces/jobs.ts#L68)*

___

###  slicers

• **slicers**: *number*

*Defined in [interfaces/jobs.ts:69](https://github.com/terascope/teraslice/blob/e480fc67/packages/job-components/src/interfaces/jobs.ts#L69)*

___

### `Optional` targets

• **targets**? : *[Targets](targets.md)[]*

*Defined in [interfaces/jobs.ts:72](https://github.com/terascope/teraslice/blob/e480fc67/packages/job-components/src/interfaces/jobs.ts#L72)*

This will only be available in the context of k8s

___

### `Optional` volumes

• **volumes**? : *[Volume](volume.md)[]*

*Defined in [interfaces/jobs.ts:78](https://github.com/terascope/teraslice/blob/e480fc67/packages/job-components/src/interfaces/jobs.ts#L78)*

This will only be available in the context of k8s

___

###  workers

• **workers**: *number*

*Defined in [interfaces/jobs.ts:70](https://github.com/terascope/teraslice/blob/e480fc67/packages/job-components/src/interfaces/jobs.ts#L70)*
