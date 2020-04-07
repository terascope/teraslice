---
title: Job Components: `ValidatedJobConfig`
sidebar_label: ValidatedJobConfig
---

# Interface: ValidatedJobConfig

## Hierarchy

* **ValidatedJobConfig**

  ↳ [ExecutionConfig](executionconfig.md)

## Index

### Properties

* [analytics](validatedjobconfig.md#analytics)
* [apis](validatedjobconfig.md#apis)
* [assetIds](validatedjobconfig.md#optional-assetids)
* [assets](validatedjobconfig.md#assets)
* [autorecover](validatedjobconfig.md#optional-autorecover)
* [cpu](validatedjobconfig.md#optional-cpu)
* [env_vars](validatedjobconfig.md#env_vars)
* [kubernetes_image](validatedjobconfig.md#optional-kubernetes_image)
* [labels](validatedjobconfig.md#optional-labels)
* [lifecycle](validatedjobconfig.md#lifecycle)
* [max_retries](validatedjobconfig.md#max_retries)
* [memory](validatedjobconfig.md#optional-memory)
* [name](validatedjobconfig.md#name)
* [operations](validatedjobconfig.md#operations)
* [performance_metrics](validatedjobconfig.md#optional-performance_metrics)
* [probation_window](validatedjobconfig.md#probation_window)
* [slicers](validatedjobconfig.md#slicers)
* [targets](validatedjobconfig.md#optional-targets)
* [volumes](validatedjobconfig.md#optional-volumes)
* [workers](validatedjobconfig.md#workers)

## Properties

###  analytics

• **analytics**: *boolean*

*Defined in [packages/job-components/src/interfaces/jobs.ts:64](https://github.com/terascope/teraslice/blob/f95bb5556/packages/job-components/src/interfaces/jobs.ts#L64)*

___

###  apis

• **apis**: *[APIConfig](apiconfig.md)[]*

*Defined in [packages/job-components/src/interfaces/jobs.ts:72](https://github.com/terascope/teraslice/blob/f95bb5556/packages/job-components/src/interfaces/jobs.ts#L72)*

___

### `Optional` assetIds

• **assetIds**? : *string[]*

*Defined in [packages/job-components/src/interfaces/jobs.ts:67](https://github.com/terascope/teraslice/blob/f95bb5556/packages/job-components/src/interfaces/jobs.ts#L67)*

This may not exist until ran in an execution

___

###  assets

• **assets**: *string[]*

*Defined in [packages/job-components/src/interfaces/jobs.ts:65](https://github.com/terascope/teraslice/blob/f95bb5556/packages/job-components/src/interfaces/jobs.ts#L65)*

___

### `Optional` autorecover

• **autorecover**? : *undefined | false | true*

*Defined in [packages/job-components/src/interfaces/jobs.ts:68](https://github.com/terascope/teraslice/blob/f95bb5556/packages/job-components/src/interfaces/jobs.ts#L68)*

___

### `Optional` cpu

• **cpu**? : *undefined | number*

*Defined in [packages/job-components/src/interfaces/jobs.ts:84](https://github.com/terascope/teraslice/blob/f95bb5556/packages/job-components/src/interfaces/jobs.ts#L84)*

This will only be available in the context of k8s

___

###  env_vars

• **env_vars**: *object*

*Defined in [packages/job-components/src/interfaces/jobs.ts:76](https://github.com/terascope/teraslice/blob/f95bb5556/packages/job-components/src/interfaces/jobs.ts#L76)*

#### Type declaration:

* \[ **key**: *string*\]: string

___

### `Optional` kubernetes_image

• **kubernetes_image**? : *undefined | string*

*Defined in [packages/job-components/src/interfaces/jobs.ts:90](https://github.com/terascope/teraslice/blob/f95bb5556/packages/job-components/src/interfaces/jobs.ts#L90)*

This will only be available in the context of k8s

___

### `Optional` labels

• **labels**? : *undefined | object*

*Defined in [packages/job-components/src/interfaces/jobs.ts:80](https://github.com/terascope/teraslice/blob/f95bb5556/packages/job-components/src/interfaces/jobs.ts#L80)*

This will only be available in the context of k8s

___

###  lifecycle

• **lifecycle**: *[LifeCycle](../overview.md#lifecycle)*

*Defined in [packages/job-components/src/interfaces/jobs.ts:69](https://github.com/terascope/teraslice/blob/f95bb5556/packages/job-components/src/interfaces/jobs.ts#L69)*

___

###  max_retries

• **max_retries**: *number*

*Defined in [packages/job-components/src/interfaces/jobs.ts:70](https://github.com/terascope/teraslice/blob/f95bb5556/packages/job-components/src/interfaces/jobs.ts#L70)*

___

### `Optional` memory

• **memory**? : *undefined | number*

*Defined in [packages/job-components/src/interfaces/jobs.ts:86](https://github.com/terascope/teraslice/blob/f95bb5556/packages/job-components/src/interfaces/jobs.ts#L86)*

This will only be available in the context of k8s

___

###  name

• **name**: *string*

*Defined in [packages/job-components/src/interfaces/jobs.ts:71](https://github.com/terascope/teraslice/blob/f95bb5556/packages/job-components/src/interfaces/jobs.ts#L71)*

___

###  operations

• **operations**: *[OpConfig](opconfig.md)[]*

*Defined in [packages/job-components/src/interfaces/jobs.ts:73](https://github.com/terascope/teraslice/blob/f95bb5556/packages/job-components/src/interfaces/jobs.ts#L73)*

___

### `Optional` performance_metrics

• **performance_metrics**? : *undefined | false | true*

*Defined in [packages/job-components/src/interfaces/jobs.ts:75](https://github.com/terascope/teraslice/blob/f95bb5556/packages/job-components/src/interfaces/jobs.ts#L75)*

___

###  probation_window

• **probation_window**: *number*

*Defined in [packages/job-components/src/interfaces/jobs.ts:74](https://github.com/terascope/teraslice/blob/f95bb5556/packages/job-components/src/interfaces/jobs.ts#L74)*

___

###  slicers

• **slicers**: *number*

*Defined in [packages/job-components/src/interfaces/jobs.ts:77](https://github.com/terascope/teraslice/blob/f95bb5556/packages/job-components/src/interfaces/jobs.ts#L77)*

___

### `Optional` targets

• **targets**? : *[Targets](targets.md)[]*

*Defined in [packages/job-components/src/interfaces/jobs.ts:82](https://github.com/terascope/teraslice/blob/f95bb5556/packages/job-components/src/interfaces/jobs.ts#L82)*

This will only be available in the context of k8s

___

### `Optional` volumes

• **volumes**? : *[Volume](volume.md)[]*

*Defined in [packages/job-components/src/interfaces/jobs.ts:88](https://github.com/terascope/teraslice/blob/f95bb5556/packages/job-components/src/interfaces/jobs.ts#L88)*

This will only be available in the context of k8s

___

###  workers

• **workers**: *number*

*Defined in [packages/job-components/src/interfaces/jobs.ts:78](https://github.com/terascope/teraslice/blob/f95bb5556/packages/job-components/src/interfaces/jobs.ts#L78)*
