---
title: Teraslice Client (JavaScript): `Execution`
sidebar_label: Execution
---

# Interface: Execution

## Hierarchy

* ExecutionConfig

  ↳ **Execution**

## Index

### Properties

* [_context](execution.md#_context)
* [_created](execution.md#_created)
* [_failureReason](execution.md#optional-_failurereason)
* [_has_errors](execution.md#optional-_has_errors)
* [_slicer_stats](execution.md#optional-_slicer_stats)
* [_status](execution.md#_status)
* [_updated](execution.md#_updated)
* [analytics](execution.md#analytics)
* [apis](execution.md#apis)
* [assetIds](execution.md#optional-assetids)
* [assets](execution.md#assets)
* [autorecover](execution.md#optional-autorecover)
* [cpu](execution.md#optional-cpu)
* [env_vars](execution.md#env_vars)
* [ex_id](execution.md#ex_id)
* [job_id](execution.md#job_id)
* [kubernetes_image](execution.md#optional-kubernetes_image)
* [labels](execution.md#optional-labels)
* [lifecycle](execution.md#lifecycle)
* [max_retries](execution.md#max_retries)
* [memory](execution.md#optional-memory)
* [metadata](execution.md#metadata)
* [name](execution.md#name)
* [operations](execution.md#operations)
* [performance_metrics](execution.md#optional-performance_metrics)
* [probation_window](execution.md#probation_window)
* [recovered_execution](execution.md#optional-recovered_execution)
* [recovered_slice_type](execution.md#optional-recovered_slice_type)
* [slicer_hostname](execution.md#slicer_hostname)
* [slicer_port](execution.md#slicer_port)
* [slicers](execution.md#slicers)
* [targets](execution.md#optional-targets)
* [volumes](execution.md#optional-volumes)
* [workers](execution.md#workers)

## Properties

###  _context

• **_context**: *"ex"*

*Defined in [packages/teraslice-client-js/src/interfaces.ts:251](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-client-js/src/interfaces.ts#L251)*

___

###  _created

• **_created**: *string*

*Defined in [packages/teraslice-client-js/src/interfaces.ts:252](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-client-js/src/interfaces.ts#L252)*

___

### `Optional` _failureReason

• **_failureReason**? : *undefined | string*

*Defined in [packages/teraslice-client-js/src/interfaces.ts:256](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-client-js/src/interfaces.ts#L256)*

___

### `Optional` _has_errors

• **_has_errors**? : *undefined | false | true*

*Defined in [packages/teraslice-client-js/src/interfaces.ts:255](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-client-js/src/interfaces.ts#L255)*

___

### `Optional` _slicer_stats

• **_slicer_stats**? : *[SlicerAnalytics](sliceranalytics.md)*

*Defined in [packages/teraslice-client-js/src/interfaces.ts:257](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-client-js/src/interfaces.ts#L257)*

___

###  _status

• **_status**: *[ExecutionStatus](../enums/executionstatus.md)*

*Defined in [packages/teraslice-client-js/src/interfaces.ts:254](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-client-js/src/interfaces.ts#L254)*

___

###  _updated

• **_updated**: *string*

*Defined in [packages/teraslice-client-js/src/interfaces.ts:253](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-client-js/src/interfaces.ts#L253)*

___

###  analytics

• **analytics**: *boolean*

*Inherited from void*

Defined in packages/job-components/dist/src/interfaces/jobs.d.ts:56

___

###  apis

• **apis**: *APIConfig[]*

*Inherited from void*

Defined in packages/job-components/dist/src/interfaces/jobs.d.ts:64

___

### `Optional` assetIds

• **assetIds**? : *string[]*

*Inherited from void*

Defined in packages/job-components/dist/src/interfaces/jobs.d.ts:59

This may not exist until ran in an execution

___

###  assets

• **assets**: *string[]*

*Inherited from void*

Defined in packages/job-components/dist/src/interfaces/jobs.d.ts:57

___

### `Optional` autorecover

• **autorecover**? : *undefined | false | true*

*Inherited from void*

Defined in packages/job-components/dist/src/interfaces/jobs.d.ts:60

___

### `Optional` cpu

• **cpu**? : *undefined | number*

*Inherited from void*

Defined in packages/job-components/dist/src/interfaces/jobs.d.ts:80

This will only be available in the context of k8s

___

###  env_vars

• **env_vars**: *object*

*Inherited from void*

Defined in packages/job-components/dist/src/interfaces/jobs.d.ts:68

#### Type declaration:

* \[ **key**: *string*\]: string

___

###  ex_id

• **ex_id**: *string*

*Inherited from void*

Defined in packages/job-components/dist/src/interfaces/jobs.d.ts:102

___

###  job_id

• **job_id**: *string*

*Inherited from void*

Defined in packages/job-components/dist/src/interfaces/jobs.d.ts:103

___

### `Optional` kubernetes_image

• **kubernetes_image**? : *undefined | string*

*Inherited from void*

Defined in packages/job-components/dist/src/interfaces/jobs.d.ts:86

This will only be available in the context of k8s

___

### `Optional` labels

• **labels**? : *undefined | object*

*Inherited from void*

Defined in packages/job-components/dist/src/interfaces/jobs.d.ts:74

This will only be available in the context of k8s

___

###  lifecycle

• **lifecycle**: *LifeCycle*

*Inherited from void*

Defined in packages/job-components/dist/src/interfaces/jobs.d.ts:61

___

###  max_retries

• **max_retries**: *number*

*Inherited from void*

Defined in packages/job-components/dist/src/interfaces/jobs.d.ts:62

___

### `Optional` memory

• **memory**? : *undefined | number*

*Inherited from void*

Defined in packages/job-components/dist/src/interfaces/jobs.d.ts:82

This will only be available in the context of k8s

___

###  metadata

• **metadata**: *AnyObject*

*Inherited from void*

Defined in packages/job-components/dist/src/interfaces/jobs.d.ts:108

___

###  name

• **name**: *string*

*Inherited from void*

Defined in packages/job-components/dist/src/interfaces/jobs.d.ts:63

___

###  operations

• **operations**: *OpConfig[]*

*Inherited from void*

Defined in packages/job-components/dist/src/interfaces/jobs.d.ts:65

___

### `Optional` performance_metrics

• **performance_metrics**? : *undefined | false | true*

*Inherited from void*

Defined in packages/job-components/dist/src/interfaces/jobs.d.ts:67

___

###  probation_window

• **probation_window**: *number*

*Inherited from void*

Defined in packages/job-components/dist/src/interfaces/jobs.d.ts:66

___

### `Optional` recovered_execution

• **recovered_execution**? : *undefined | string*

*Inherited from void*

Defined in packages/job-components/dist/src/interfaces/jobs.d.ts:106

___

### `Optional` recovered_slice_type

• **recovered_slice_type**? : *RecoveryCleanupType*

*Inherited from void*

Defined in packages/job-components/dist/src/interfaces/jobs.d.ts:107

___

###  slicer_hostname

• **slicer_hostname**: *string*

*Inherited from void*

Defined in packages/job-components/dist/src/interfaces/jobs.d.ts:104

___

###  slicer_port

• **slicer_port**: *number*

*Inherited from void*

Defined in packages/job-components/dist/src/interfaces/jobs.d.ts:105

___

###  slicers

• **slicers**: *number*

*Inherited from void*

Defined in packages/job-components/dist/src/interfaces/jobs.d.ts:71

___

### `Optional` targets

• **targets**? : *Targets[]*

*Inherited from void*

Defined in packages/job-components/dist/src/interfaces/jobs.d.ts:78

This will only be available in the context of k8s

___

### `Optional` volumes

• **volumes**? : *Volume[]*

*Inherited from void*

Defined in packages/job-components/dist/src/interfaces/jobs.d.ts:84

This will only be available in the context of k8s

___

###  workers

• **workers**: *number*

*Inherited from void*

Defined in packages/job-components/dist/src/interfaces/jobs.d.ts:72
