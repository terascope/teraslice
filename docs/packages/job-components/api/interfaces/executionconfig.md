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
* [cpu](executionconfig.md#optional-cpu)
* [env_vars](executionconfig.md#env_vars)
* [ex_id](executionconfig.md#ex_id)
* [job_id](executionconfig.md#job_id)
* [kubernetes_image](executionconfig.md#optional-kubernetes_image)
* [lifecycle](executionconfig.md#lifecycle)
* [max_retries](executionconfig.md#max_retries)
* [memory](executionconfig.md#optional-memory)
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

*Defined in [interfaces/jobs.ts:64](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/interfaces/jobs.ts#L64)*

___

###  apis

• **apis**: *[APIConfig](apiconfig.md)[]*

*Inherited from [ValidatedJobConfig](validatedjobconfig.md).[apis](validatedjobconfig.md#apis)*

*Defined in [interfaces/jobs.ts:71](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/interfaces/jobs.ts#L71)*

___

### `Optional` assetIds

• **assetIds**? : *string[]*

*Inherited from [ValidatedJobConfig](validatedjobconfig.md).[assetIds](validatedjobconfig.md#optional-assetids)*

*Defined in [interfaces/jobs.ts:67](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/interfaces/jobs.ts#L67)*

This may not exist until ran in an execution

___

###  assets

• **assets**: *string[]*

*Inherited from [ValidatedJobConfig](validatedjobconfig.md).[assets](validatedjobconfig.md#assets)*

*Defined in [interfaces/jobs.ts:65](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/interfaces/jobs.ts#L65)*

___

### `Optional` cpu

• **cpu**? : *undefined | number*

*Inherited from [ValidatedJobConfig](validatedjobconfig.md).[cpu](validatedjobconfig.md#optional-cpu)*

*Defined in [interfaces/jobs.ts:81](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/interfaces/jobs.ts#L81)*

This will only be available in the context of k8s

___

###  env_vars

• **env_vars**: *object*

*Inherited from [ValidatedJobConfig](validatedjobconfig.md).[env_vars](validatedjobconfig.md#env_vars)*

*Defined in [interfaces/jobs.ts:75](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/interfaces/jobs.ts#L75)*

#### Type declaration:

* \[ **key**: *string*\]: string

___

###  ex_id

• **ex_id**: *string*

*Defined in [interfaces/jobs.ts:101](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/interfaces/jobs.ts#L101)*

___

###  job_id

• **job_id**: *string*

*Defined in [interfaces/jobs.ts:102](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/interfaces/jobs.ts#L102)*

___

### `Optional` kubernetes_image

• **kubernetes_image**? : *undefined | string*

*Inherited from [ValidatedJobConfig](validatedjobconfig.md).[kubernetes_image](validatedjobconfig.md#optional-kubernetes_image)*

*Defined in [interfaces/jobs.ts:87](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/interfaces/jobs.ts#L87)*

This will only be available in the context of k8s

___

###  lifecycle

• **lifecycle**: *[LifeCycle](../overview.md#lifecycle)*

*Inherited from [ValidatedJobConfig](validatedjobconfig.md).[lifecycle](validatedjobconfig.md#lifecycle)*

*Defined in [interfaces/jobs.ts:68](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/interfaces/jobs.ts#L68)*

___

###  max_retries

• **max_retries**: *number*

*Inherited from [ValidatedJobConfig](validatedjobconfig.md).[max_retries](validatedjobconfig.md#max_retries)*

*Defined in [interfaces/jobs.ts:69](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/interfaces/jobs.ts#L69)*

___

### `Optional` memory

• **memory**? : *undefined | number*

*Inherited from [ValidatedJobConfig](validatedjobconfig.md).[memory](validatedjobconfig.md#optional-memory)*

*Defined in [interfaces/jobs.ts:83](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/interfaces/jobs.ts#L83)*

This will only be available in the context of k8s

___

###  name

• **name**: *string*

*Inherited from [ValidatedJobConfig](validatedjobconfig.md).[name](validatedjobconfig.md#name)*

*Defined in [interfaces/jobs.ts:70](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/interfaces/jobs.ts#L70)*

___

###  operations

• **operations**: *[OpConfig](opconfig.md)[]*

*Inherited from [ValidatedJobConfig](validatedjobconfig.md).[operations](validatedjobconfig.md#operations)*

*Defined in [interfaces/jobs.ts:72](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/interfaces/jobs.ts#L72)*

___

### `Optional` performance_metrics

• **performance_metrics**? : *undefined | false | true*

*Inherited from [ValidatedJobConfig](validatedjobconfig.md).[performance_metrics](validatedjobconfig.md#optional-performance_metrics)*

*Defined in [interfaces/jobs.ts:74](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/interfaces/jobs.ts#L74)*

___

###  probation_window

• **probation_window**: *number*

*Inherited from [ValidatedJobConfig](validatedjobconfig.md).[probation_window](validatedjobconfig.md#probation_window)*

*Defined in [interfaces/jobs.ts:73](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/interfaces/jobs.ts#L73)*

___

### `Optional` recovered_execution

• **recovered_execution**? : *undefined | string*

*Defined in [interfaces/jobs.ts:105](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/interfaces/jobs.ts#L105)*

___

### `Optional` recovered_slice_type

• **recovered_slice_type**? : *"all" | "errors"*

*Defined in [interfaces/jobs.ts:106](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/interfaces/jobs.ts#L106)*

___

###  slicer_hostname

• **slicer_hostname**: *string*

*Defined in [interfaces/jobs.ts:103](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/interfaces/jobs.ts#L103)*

___

###  slicer_port

• **slicer_port**: *number*

*Defined in [interfaces/jobs.ts:104](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/interfaces/jobs.ts#L104)*

___

###  slicers

• **slicers**: *number*

*Inherited from [ValidatedJobConfig](validatedjobconfig.md).[slicers](validatedjobconfig.md#slicers)*

*Defined in [interfaces/jobs.ts:76](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/interfaces/jobs.ts#L76)*

___

### `Optional` targets

• **targets**? : *[Targets](targets.md)[]*

*Inherited from [ValidatedJobConfig](validatedjobconfig.md).[targets](validatedjobconfig.md#optional-targets)*

*Defined in [interfaces/jobs.ts:79](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/interfaces/jobs.ts#L79)*

This will only be available in the context of k8s

___

### `Optional` volumes

• **volumes**? : *[Volume](volume.md)[]*

*Inherited from [ValidatedJobConfig](validatedjobconfig.md).[volumes](validatedjobconfig.md#optional-volumes)*

*Defined in [interfaces/jobs.ts:85](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/interfaces/jobs.ts#L85)*

This will only be available in the context of k8s

___

###  workers

• **workers**: *number*

*Inherited from [ValidatedJobConfig](validatedjobconfig.md).[workers](validatedjobconfig.md#workers)*

*Defined in [interfaces/jobs.ts:77](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/interfaces/jobs.ts#L77)*
