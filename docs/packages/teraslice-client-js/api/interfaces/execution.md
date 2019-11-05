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
* [cpu](execution.md#optional-cpu)
* [env_vars](execution.md#env_vars)
* [ex_id](execution.md#ex_id)
* [job_id](execution.md#job_id)
* [kubernetes_image](execution.md#optional-kubernetes_image)
* [lifecycle](execution.md#lifecycle)
* [max_retries](execution.md#max_retries)
* [memory](execution.md#optional-memory)
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

*Defined in [interfaces.ts:245](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-client-js/src/interfaces.ts#L245)*

___

###  _created

• **_created**: *string*

*Defined in [interfaces.ts:246](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-client-js/src/interfaces.ts#L246)*

___

### `Optional` _failureReason

• **_failureReason**? : *undefined | string*

*Defined in [interfaces.ts:250](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-client-js/src/interfaces.ts#L250)*

___

### `Optional` _has_errors

• **_has_errors**? : *undefined | false | true*

*Defined in [interfaces.ts:249](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-client-js/src/interfaces.ts#L249)*

___

### `Optional` _slicer_stats

• **_slicer_stats**? : *[SlicerAnalytics](sliceranalytics.md)*

*Defined in [interfaces.ts:251](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-client-js/src/interfaces.ts#L251)*

___

###  _status

• **_status**: *[ExecutionStatus](../enums/executionstatus.md)*

*Defined in [interfaces.ts:248](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-client-js/src/interfaces.ts#L248)*

___

###  _updated

• **_updated**: *string*

*Defined in [interfaces.ts:247](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-client-js/src/interfaces.ts#L247)*

___

###  analytics

• **analytics**: *boolean*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/job-components/dist/src/interfaces/jobs.d.ts:56

___

###  apis

• **apis**: *APIConfig[]*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/job-components/dist/src/interfaces/jobs.d.ts:63

___

### `Optional` assetIds

• **assetIds**? : *string[]*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/job-components/dist/src/interfaces/jobs.d.ts:59

This may not exist until ran in an execution

___

###  assets

• **assets**: *string[]*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/job-components/dist/src/interfaces/jobs.d.ts:57

___

### `Optional` cpu

• **cpu**? : *undefined | number*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/job-components/dist/src/interfaces/jobs.d.ts:75

This will only be available in the context of k8s

___

###  env_vars

• **env_vars**: *object*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/job-components/dist/src/interfaces/jobs.d.ts:67

#### Type declaration:

* \[ **key**: *string*\]: string

___

###  ex_id

• **ex_id**: *string*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/job-components/dist/src/interfaces/jobs.d.ts:92

___

###  job_id

• **job_id**: *string*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/job-components/dist/src/interfaces/jobs.d.ts:93

___

### `Optional` kubernetes_image

• **kubernetes_image**? : *undefined | string*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/job-components/dist/src/interfaces/jobs.d.ts:81

This will only be available in the context of k8s

___

###  lifecycle

• **lifecycle**: *LifeCycle*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/job-components/dist/src/interfaces/jobs.d.ts:60

___

###  max_retries

• **max_retries**: *number*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/job-components/dist/src/interfaces/jobs.d.ts:61

___

### `Optional` memory

• **memory**? : *undefined | number*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/job-components/dist/src/interfaces/jobs.d.ts:77

This will only be available in the context of k8s

___

###  name

• **name**: *string*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/job-components/dist/src/interfaces/jobs.d.ts:62

___

###  operations

• **operations**: *OpConfig[]*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/job-components/dist/src/interfaces/jobs.d.ts:64

___

### `Optional` performance_metrics

• **performance_metrics**? : *undefined | false | true*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/job-components/dist/src/interfaces/jobs.d.ts:66

___

###  probation_window

• **probation_window**: *number*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/job-components/dist/src/interfaces/jobs.d.ts:65

___

### `Optional` recovered_execution

• **recovered_execution**? : *undefined | string*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/job-components/dist/src/interfaces/jobs.d.ts:96

___

### `Optional` recovered_slice_type

• **recovered_slice_type**? : *"all" | "errors"*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/job-components/dist/src/interfaces/jobs.d.ts:97

___

###  slicer_hostname

• **slicer_hostname**: *string*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/job-components/dist/src/interfaces/jobs.d.ts:94

___

###  slicer_port

• **slicer_port**: *number*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/job-components/dist/src/interfaces/jobs.d.ts:95

___

###  slicers

• **slicers**: *number*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/job-components/dist/src/interfaces/jobs.d.ts:70

___

### `Optional` targets

• **targets**? : *Targets[]*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/job-components/dist/src/interfaces/jobs.d.ts:73

This will only be available in the context of k8s

___

### `Optional` volumes

• **volumes**? : *Volume[]*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/job-components/dist/src/interfaces/jobs.d.ts:79

This will only be available in the context of k8s

___

###  workers

• **workers**: *number*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/job-components/dist/src/interfaces/jobs.d.ts:71
