---
title: Job Components: `ValidatedJobConfig`
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
* [slicers](validatedjobconfig.md#slicers)
* [targets](validatedjobconfig.md#optional-targets)
* [volumes](validatedjobconfig.md#optional-volumes)
* [workers](validatedjobconfig.md#workers)

## Properties

###  analytics

• **analytics**: *boolean*

*Defined in [interfaces/jobs.ts:59](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/interfaces/jobs.ts#L59)*

___

###  apis

• **apis**: *[APIConfig](apiconfig.md)[]*

*Defined in [interfaces/jobs.ts:65](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/interfaces/jobs.ts#L65)*

___

### `Optional` assetIds

• **assetIds**? : *string[]*

*Defined in [interfaces/jobs.ts:61](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/interfaces/jobs.ts#L61)*

___

###  assets

• **assets**: *string[]*

*Defined in [interfaces/jobs.ts:60](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/interfaces/jobs.ts#L60)*

___

### `Optional` cpu

• **cpu**? : *undefined | number*

*Defined in [interfaces/jobs.ts:73](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/interfaces/jobs.ts#L73)*

This will only be available in the context of k8s

___

### `Optional` kubernetes_image

• **kubernetes_image**? : *undefined | string*

*Defined in [interfaces/jobs.ts:79](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/interfaces/jobs.ts#L79)*

This will only be available in the context of k8s

___

###  lifecycle

• **lifecycle**: *[LifeCycle](../overview.md#lifecycle)*

*Defined in [interfaces/jobs.ts:62](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/interfaces/jobs.ts#L62)*

___

###  max_retries

• **max_retries**: *number*

*Defined in [interfaces/jobs.ts:63](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/interfaces/jobs.ts#L63)*

___

### `Optional` memory

• **memory**? : *undefined | number*

*Defined in [interfaces/jobs.ts:75](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/interfaces/jobs.ts#L75)*

This will only be available in the context of k8s

___

###  name

• **name**: *string*

*Defined in [interfaces/jobs.ts:64](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/interfaces/jobs.ts#L64)*

___

###  operations

• **operations**: *[OpConfig](opconfig.md)[]*

*Defined in [interfaces/jobs.ts:66](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/interfaces/jobs.ts#L66)*

___

###  probation_window

• **probation_window**: *number*

*Defined in [interfaces/jobs.ts:67](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/interfaces/jobs.ts#L67)*

___

###  slicers

• **slicers**: *number*

*Defined in [interfaces/jobs.ts:68](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/interfaces/jobs.ts#L68)*

___

### `Optional` targets

• **targets**? : *[Targets](targets.md)[]*

*Defined in [interfaces/jobs.ts:71](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/interfaces/jobs.ts#L71)*

This will only be available in the context of k8s

___

### `Optional` volumes

• **volumes**? : *[Volume](volume.md)[]*

*Defined in [interfaces/jobs.ts:77](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/interfaces/jobs.ts#L77)*

This will only be available in the context of k8s

___

###  workers

• **workers**: *number*

*Defined in [interfaces/jobs.ts:69](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/interfaces/jobs.ts#L69)*
