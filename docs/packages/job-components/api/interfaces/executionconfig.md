---
title: Job Components: `ExecutionConfig`
sidebar_label: ExecutionConfig
---

# Interface: ExecutionConfig

## Hierarchy

* [ValidatedJobConfig](validatedjobconfig.md)

  ↳ **ExecutionConfig**

## Index

### Properties

* [analytics](executionconfig.md#analytics)
* [apis](executionconfig.md#apis)
* [assetIds](executionconfig.md#optional-assetids)
* [assets](executionconfig.md#assets)
* [autorecover](executionconfig.md#optional-autorecover)
* [cpu](executionconfig.md#optional-cpu)
* [env_vars](executionconfig.md#env_vars)
* [ex_id](executionconfig.md#ex_id)
* [job_id](executionconfig.md#job_id)
* [kubernetes_image](executionconfig.md#optional-kubernetes_image)
* [labels](executionconfig.md#optional-labels)
* [lifecycle](executionconfig.md#lifecycle)
* [max_retries](executionconfig.md#max_retries)
* [memory](executionconfig.md#optional-memory)
* [metadata](executionconfig.md#metadata)
* [name](executionconfig.md#name)
* [operations](executionconfig.md#operations)
* [performance_metrics](executionconfig.md#optional-performance_metrics)
* [probation_window](executionconfig.md#probation_window)
* [recovered_execution](executionconfig.md#optional-recovered_execution)
* [recovered_slice_type](executionconfig.md#optional-recovered_slice_type)
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

*Defined in [packages/job-components/src/interfaces/jobs.ts:64](https://github.com/terascope/teraslice/blob/78714a985/packages/job-components/src/interfaces/jobs.ts#L64)*

___

###  apis

• **apis**: *[APIConfig](apiconfig.md)[]*

*Inherited from [ValidatedJobConfig](validatedjobconfig.md).[apis](validatedjobconfig.md#apis)*

*Defined in [packages/job-components/src/interfaces/jobs.ts:72](https://github.com/terascope/teraslice/blob/78714a985/packages/job-components/src/interfaces/jobs.ts#L72)*

___

### `Optional` assetIds

• **assetIds**? : *string[]*

*Inherited from [ValidatedJobConfig](validatedjobconfig.md).[assetIds](validatedjobconfig.md#optional-assetids)*

*Defined in [packages/job-components/src/interfaces/jobs.ts:67](https://github.com/terascope/teraslice/blob/78714a985/packages/job-components/src/interfaces/jobs.ts#L67)*

This may not exist until ran in an execution

___

###  assets

• **assets**: *string[]*

*Inherited from [ValidatedJobConfig](validatedjobconfig.md).[assets](validatedjobconfig.md#assets)*

*Defined in [packages/job-components/src/interfaces/jobs.ts:65](https://github.com/terascope/teraslice/blob/78714a985/packages/job-components/src/interfaces/jobs.ts#L65)*

___

### `Optional` autorecover

• **autorecover**? : *undefined | false | true*

*Inherited from [ValidatedJobConfig](validatedjobconfig.md).[autorecover](validatedjobconfig.md#optional-autorecover)*

*Defined in [packages/job-components/src/interfaces/jobs.ts:68](https://github.com/terascope/teraslice/blob/78714a985/packages/job-components/src/interfaces/jobs.ts#L68)*

___

### `Optional` cpu

• **cpu**? : *undefined | number*

*Inherited from [ValidatedJobConfig](validatedjobconfig.md).[cpu](validatedjobconfig.md#optional-cpu)*

*Defined in [packages/job-components/src/interfaces/jobs.ts:84](https://github.com/terascope/teraslice/blob/78714a985/packages/job-components/src/interfaces/jobs.ts#L84)*

This will only be available in the context of k8s

___

###  env_vars

• **env_vars**: *object*

*Inherited from [ValidatedJobConfig](validatedjobconfig.md).[env_vars](validatedjobconfig.md#env_vars)*

*Defined in [packages/job-components/src/interfaces/jobs.ts:76](https://github.com/terascope/teraslice/blob/78714a985/packages/job-components/src/interfaces/jobs.ts#L76)*

#### Type declaration:

* \[ **key**: *string*\]: string

___

###  ex_id

• **ex_id**: *string*

*Defined in [packages/job-components/src/interfaces/jobs.ts:110](https://github.com/terascope/teraslice/blob/78714a985/packages/job-components/src/interfaces/jobs.ts#L110)*

___

###  job_id

• **job_id**: *string*

*Defined in [packages/job-components/src/interfaces/jobs.ts:111](https://github.com/terascope/teraslice/blob/78714a985/packages/job-components/src/interfaces/jobs.ts#L111)*

___

### `Optional` kubernetes_image

• **kubernetes_image**? : *undefined | string*

*Inherited from [ValidatedJobConfig](validatedjobconfig.md).[kubernetes_image](validatedjobconfig.md#optional-kubernetes_image)*

*Defined in [packages/job-components/src/interfaces/jobs.ts:90](https://github.com/terascope/teraslice/blob/78714a985/packages/job-components/src/interfaces/jobs.ts#L90)*

This will only be available in the context of k8s

___

### `Optional` labels

• **labels**? : *undefined | object*

*Inherited from [ValidatedJobConfig](validatedjobconfig.md).[labels](validatedjobconfig.md#optional-labels)*

*Defined in [packages/job-components/src/interfaces/jobs.ts:80](https://github.com/terascope/teraslice/blob/78714a985/packages/job-components/src/interfaces/jobs.ts#L80)*

This will only be available in the context of k8s

___

###  lifecycle

• **lifecycle**: *[LifeCycle](../overview.md#lifecycle)*

*Inherited from [ValidatedJobConfig](validatedjobconfig.md).[lifecycle](validatedjobconfig.md#lifecycle)*

*Defined in [packages/job-components/src/interfaces/jobs.ts:69](https://github.com/terascope/teraslice/blob/78714a985/packages/job-components/src/interfaces/jobs.ts#L69)*

___

###  max_retries

• **max_retries**: *number*

*Inherited from [ValidatedJobConfig](validatedjobconfig.md).[max_retries](validatedjobconfig.md#max_retries)*

*Defined in [packages/job-components/src/interfaces/jobs.ts:70](https://github.com/terascope/teraslice/blob/78714a985/packages/job-components/src/interfaces/jobs.ts#L70)*

___

### `Optional` memory

• **memory**? : *undefined | number*

*Inherited from [ValidatedJobConfig](validatedjobconfig.md).[memory](validatedjobconfig.md#optional-memory)*

*Defined in [packages/job-components/src/interfaces/jobs.ts:86](https://github.com/terascope/teraslice/blob/78714a985/packages/job-components/src/interfaces/jobs.ts#L86)*

This will only be available in the context of k8s

___

###  metadata

• **metadata**: *AnyObject*

*Defined in [packages/job-components/src/interfaces/jobs.ts:116](https://github.com/terascope/teraslice/blob/78714a985/packages/job-components/src/interfaces/jobs.ts#L116)*

___

###  name

• **name**: *string*

*Inherited from [ValidatedJobConfig](validatedjobconfig.md).[name](validatedjobconfig.md#name)*

*Defined in [packages/job-components/src/interfaces/jobs.ts:71](https://github.com/terascope/teraslice/blob/78714a985/packages/job-components/src/interfaces/jobs.ts#L71)*

___

###  operations

• **operations**: *[OpConfig](opconfig.md)[]*

*Inherited from [ValidatedJobConfig](validatedjobconfig.md).[operations](validatedjobconfig.md#operations)*

*Defined in [packages/job-components/src/interfaces/jobs.ts:73](https://github.com/terascope/teraslice/blob/78714a985/packages/job-components/src/interfaces/jobs.ts#L73)*

___

### `Optional` performance_metrics

• **performance_metrics**? : *undefined | false | true*

*Inherited from [ValidatedJobConfig](validatedjobconfig.md).[performance_metrics](validatedjobconfig.md#optional-performance_metrics)*

*Defined in [packages/job-components/src/interfaces/jobs.ts:75](https://github.com/terascope/teraslice/blob/78714a985/packages/job-components/src/interfaces/jobs.ts#L75)*

___

###  probation_window

• **probation_window**: *number*

*Inherited from [ValidatedJobConfig](validatedjobconfig.md).[probation_window](validatedjobconfig.md#probation_window)*

*Defined in [packages/job-components/src/interfaces/jobs.ts:74](https://github.com/terascope/teraslice/blob/78714a985/packages/job-components/src/interfaces/jobs.ts#L74)*

___

### `Optional` recovered_execution

• **recovered_execution**? : *undefined | string*

*Defined in [packages/job-components/src/interfaces/jobs.ts:114](https://github.com/terascope/teraslice/blob/78714a985/packages/job-components/src/interfaces/jobs.ts#L114)*

___

### `Optional` recovered_slice_type

• **recovered_slice_type**? : *[RecoveryCleanupType](../enums/recoverycleanuptype.md)*

*Defined in [packages/job-components/src/interfaces/jobs.ts:115](https://github.com/terascope/teraslice/blob/78714a985/packages/job-components/src/interfaces/jobs.ts#L115)*

___

###  slicer_hostname

• **slicer_hostname**: *string*

*Defined in [packages/job-components/src/interfaces/jobs.ts:112](https://github.com/terascope/teraslice/blob/78714a985/packages/job-components/src/interfaces/jobs.ts#L112)*

___

###  slicer_port

• **slicer_port**: *number*

*Defined in [packages/job-components/src/interfaces/jobs.ts:113](https://github.com/terascope/teraslice/blob/78714a985/packages/job-components/src/interfaces/jobs.ts#L113)*

___

###  slicers

• **slicers**: *number*

*Inherited from [ValidatedJobConfig](validatedjobconfig.md).[slicers](validatedjobconfig.md#slicers)*

*Defined in [packages/job-components/src/interfaces/jobs.ts:77](https://github.com/terascope/teraslice/blob/78714a985/packages/job-components/src/interfaces/jobs.ts#L77)*

___

### `Optional` targets

• **targets**? : *[Targets](targets.md)[]*

*Inherited from [ValidatedJobConfig](validatedjobconfig.md).[targets](validatedjobconfig.md#optional-targets)*

*Defined in [packages/job-components/src/interfaces/jobs.ts:82](https://github.com/terascope/teraslice/blob/78714a985/packages/job-components/src/interfaces/jobs.ts#L82)*

This will only be available in the context of k8s

___

### `Optional` volumes

• **volumes**? : *[Volume](volume.md)[]*

*Inherited from [ValidatedJobConfig](validatedjobconfig.md).[volumes](validatedjobconfig.md#optional-volumes)*

*Defined in [packages/job-components/src/interfaces/jobs.ts:88](https://github.com/terascope/teraslice/blob/78714a985/packages/job-components/src/interfaces/jobs.ts#L88)*

This will only be available in the context of k8s

___

###  workers

• **workers**: *number*

*Inherited from [ValidatedJobConfig](validatedjobconfig.md).[workers](validatedjobconfig.md#workers)*

*Defined in [packages/job-components/src/interfaces/jobs.ts:78](https://github.com/terascope/teraslice/blob/78714a985/packages/job-components/src/interfaces/jobs.ts#L78)*
