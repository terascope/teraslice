---
title: Job Components: `ExecutionConfig`
sidebar_label: ExecutionConfig
---

# Interface: ExecutionConfig

## Hierarchy

* [ValidatedJobConfig](validatedjobconfig.md)

  * **ExecutionConfig**

### Index

#### Properties

* [analytics](executionconfig.md#analytics)
* [apis](executionconfig.md#apis)
* [assetIds](executionconfig.md#optional-assetids)
* [assets](executionconfig.md#assets)
* [cpu](executionconfig.md#optional-cpu)
* [ex_id](executionconfig.md#ex_id)
* [job_id](executionconfig.md#job_id)
* [kubernetes_image](executionconfig.md#optional-kubernetes_image)
* [lifecycle](executionconfig.md#lifecycle)
* [max_retries](executionconfig.md#max_retries)
* [memory](executionconfig.md#optional-memory)
* [name](executionconfig.md#name)
* [operations](executionconfig.md#operations)
* [probation_window](executionconfig.md#probation_window)
* [slicer_hostname](executionconfig.md#slicer_hostname)
* [slicer_port](executionconfig.md#slicer_port)
* [slicers](executionconfig.md#slicers)
* [targets](executionconfig.md#optional-targets)
* [volumes](executionconfig.md#optional-volumes)
* [workers](executionconfig.md#workers)

## Properties

###  analytics

• **analytics**: *boolean*

*Inherited from [ValidatedJobConfig](validatedjobconfig.md).[analytics](validatedjobconfig.md#analytics)*

*Defined in [interfaces/jobs.ts:59](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/job-components/src/interfaces/jobs.ts#L59)*

___

###  apis

• **apis**: *[APIConfig](apiconfig.md)[]*

*Inherited from [ValidatedJobConfig](validatedjobconfig.md).[apis](validatedjobconfig.md#apis)*

*Defined in [interfaces/jobs.ts:65](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/job-components/src/interfaces/jobs.ts#L65)*

___

### `Optional` assetIds

• **assetIds**? : *string[]*

*Inherited from [ValidatedJobConfig](validatedjobconfig.md).[assetIds](validatedjobconfig.md#optional-assetids)*

*Defined in [interfaces/jobs.ts:61](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/job-components/src/interfaces/jobs.ts#L61)*

___

###  assets

• **assets**: *string[]*

*Inherited from [ValidatedJobConfig](validatedjobconfig.md).[assets](validatedjobconfig.md#assets)*

*Defined in [interfaces/jobs.ts:60](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/job-components/src/interfaces/jobs.ts#L60)*

___

### `Optional` cpu

• **cpu**? : *undefined | number*

*Inherited from [ValidatedJobConfig](validatedjobconfig.md).[cpu](validatedjobconfig.md#optional-cpu)*

*Defined in [interfaces/jobs.ts:73](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/job-components/src/interfaces/jobs.ts#L73)*

This will only be available in the context of k8s

___

###  ex_id

• **ex_id**: *string*

*Defined in [interfaces/jobs.ts:93](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/job-components/src/interfaces/jobs.ts#L93)*

___

###  job_id

• **job_id**: *string*

*Defined in [interfaces/jobs.ts:94](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/job-components/src/interfaces/jobs.ts#L94)*

___

### `Optional` kubernetes_image

• **kubernetes_image**? : *undefined | string*

*Inherited from [ValidatedJobConfig](validatedjobconfig.md).[kubernetes_image](validatedjobconfig.md#optional-kubernetes_image)*

*Defined in [interfaces/jobs.ts:79](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/job-components/src/interfaces/jobs.ts#L79)*

This will only be available in the context of k8s

___

###  lifecycle

• **lifecycle**: *[LifeCycle](../overview.md#lifecycle)*

*Inherited from [ValidatedJobConfig](validatedjobconfig.md).[lifecycle](validatedjobconfig.md#lifecycle)*

*Defined in [interfaces/jobs.ts:62](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/job-components/src/interfaces/jobs.ts#L62)*

___

###  max_retries

• **max_retries**: *number*

*Inherited from [ValidatedJobConfig](validatedjobconfig.md).[max_retries](validatedjobconfig.md#max_retries)*

*Defined in [interfaces/jobs.ts:63](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/job-components/src/interfaces/jobs.ts#L63)*

___

### `Optional` memory

• **memory**? : *undefined | number*

*Inherited from [ValidatedJobConfig](validatedjobconfig.md).[memory](validatedjobconfig.md#optional-memory)*

*Defined in [interfaces/jobs.ts:75](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/job-components/src/interfaces/jobs.ts#L75)*

This will only be available in the context of k8s

___

###  name

• **name**: *string*

*Inherited from [ValidatedJobConfig](validatedjobconfig.md).[name](validatedjobconfig.md#name)*

*Defined in [interfaces/jobs.ts:64](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/job-components/src/interfaces/jobs.ts#L64)*

___

###  operations

• **operations**: *[OpConfig](opconfig.md)[]*

*Inherited from [ValidatedJobConfig](validatedjobconfig.md).[operations](validatedjobconfig.md#operations)*

*Defined in [interfaces/jobs.ts:66](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/job-components/src/interfaces/jobs.ts#L66)*

___

###  probation_window

• **probation_window**: *number*

*Inherited from [ValidatedJobConfig](validatedjobconfig.md).[probation_window](validatedjobconfig.md#probation_window)*

*Defined in [interfaces/jobs.ts:67](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/job-components/src/interfaces/jobs.ts#L67)*

___

###  slicer_hostname

• **slicer_hostname**: *string*

*Defined in [interfaces/jobs.ts:95](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/job-components/src/interfaces/jobs.ts#L95)*

___

###  slicer_port

• **slicer_port**: *number*

*Defined in [interfaces/jobs.ts:96](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/job-components/src/interfaces/jobs.ts#L96)*

___

###  slicers

• **slicers**: *number*

*Inherited from [ValidatedJobConfig](validatedjobconfig.md).[slicers](validatedjobconfig.md#slicers)*

*Defined in [interfaces/jobs.ts:68](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/job-components/src/interfaces/jobs.ts#L68)*

___

### `Optional` targets

• **targets**? : *[Targets](targets.md)[]*

*Inherited from [ValidatedJobConfig](validatedjobconfig.md).[targets](validatedjobconfig.md#optional-targets)*

*Defined in [interfaces/jobs.ts:71](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/job-components/src/interfaces/jobs.ts#L71)*

This will only be available in the context of k8s

___

### `Optional` volumes

• **volumes**? : *[Volume](volume.md)[]*

*Inherited from [ValidatedJobConfig](validatedjobconfig.md).[volumes](validatedjobconfig.md#optional-volumes)*

*Defined in [interfaces/jobs.ts:77](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/job-components/src/interfaces/jobs.ts#L77)*

This will only be available in the context of k8s

___

###  workers

• **workers**: *number*

*Inherited from [ValidatedJobConfig](validatedjobconfig.md).[workers](validatedjobconfig.md#workers)*

*Defined in [interfaces/jobs.ts:69](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/job-components/src/interfaces/jobs.ts#L69)*
