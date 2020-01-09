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
* [cpu](validatedjobconfig.md#optional-cpu)
* [env_vars](validatedjobconfig.md#env_vars)
* [kubernetes_image](validatedjobconfig.md#optional-kubernetes_image)
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

*Defined in [interfaces/jobs.ts:64](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/interfaces/jobs.ts#L64)*

___

###  apis

• **apis**: *[APIConfig](apiconfig.md)[]*

*Defined in [interfaces/jobs.ts:71](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/interfaces/jobs.ts#L71)*

___

### `Optional` assetIds

• **assetIds**? : *string[]*

*Defined in [interfaces/jobs.ts:67](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/interfaces/jobs.ts#L67)*

This may not exist until ran in an execution

___

###  assets

• **assets**: *string[]*

*Defined in [interfaces/jobs.ts:65](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/interfaces/jobs.ts#L65)*

___

### `Optional` cpu

• **cpu**? : *undefined | number*

*Defined in [interfaces/jobs.ts:81](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/interfaces/jobs.ts#L81)*

This will only be available in the context of k8s

___

###  env_vars

• **env_vars**: *object*

*Defined in [interfaces/jobs.ts:75](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/interfaces/jobs.ts#L75)*

#### Type declaration:

* \[ **key**: *string*\]: string

___

### `Optional` kubernetes_image

• **kubernetes_image**? : *undefined | string*

*Defined in [interfaces/jobs.ts:87](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/interfaces/jobs.ts#L87)*

This will only be available in the context of k8s

___

###  lifecycle

• **lifecycle**: *[LifeCycle](../overview.md#lifecycle)*

*Defined in [interfaces/jobs.ts:68](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/interfaces/jobs.ts#L68)*

___

###  max_retries

• **max_retries**: *number*

*Defined in [interfaces/jobs.ts:69](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/interfaces/jobs.ts#L69)*

___

### `Optional` memory

• **memory**? : *undefined | number*

*Defined in [interfaces/jobs.ts:83](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/interfaces/jobs.ts#L83)*

This will only be available in the context of k8s

___

###  name

• **name**: *string*

*Defined in [interfaces/jobs.ts:70](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/interfaces/jobs.ts#L70)*

___

###  operations

• **operations**: *[OpConfig](opconfig.md)[]*

*Defined in [interfaces/jobs.ts:72](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/interfaces/jobs.ts#L72)*

___

### `Optional` performance_metrics

• **performance_metrics**? : *undefined | false | true*

*Defined in [interfaces/jobs.ts:74](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/interfaces/jobs.ts#L74)*

___

###  probation_window

• **probation_window**: *number*

*Defined in [interfaces/jobs.ts:73](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/interfaces/jobs.ts#L73)*

___

###  slicers

• **slicers**: *number*

*Defined in [interfaces/jobs.ts:76](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/interfaces/jobs.ts#L76)*

___

### `Optional` targets

• **targets**? : *[Targets](targets.md)[]*

*Defined in [interfaces/jobs.ts:79](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/interfaces/jobs.ts#L79)*

This will only be available in the context of k8s

___

### `Optional` volumes

• **volumes**? : *[Volume](volume.md)[]*

*Defined in [interfaces/jobs.ts:85](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/interfaces/jobs.ts#L85)*

This will only be available in the context of k8s

___

###  workers

• **workers**: *number*

*Defined in [interfaces/jobs.ts:77](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/interfaces/jobs.ts#L77)*
