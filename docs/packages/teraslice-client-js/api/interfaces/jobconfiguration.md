---
title: Teraslice Client (JavaScript): `JobConfiguration`
sidebar_label: JobConfiguration
---

# Interface: JobConfiguration

## Hierarchy

* ValidatedJobConfig

  ↳ **JobConfiguration**

## Index

### Properties

* [_context](jobconfiguration.md#_context)
* [_created](jobconfiguration.md#_created)
* [_updated](jobconfiguration.md#_updated)
* [analytics](jobconfiguration.md#analytics)
* [apis](jobconfiguration.md#apis)
* [assetIds](jobconfiguration.md#optional-assetids)
* [assets](jobconfiguration.md#assets)
* [autorecover](jobconfiguration.md#optional-autorecover)
* [cpu](jobconfiguration.md#optional-cpu)
* [env_vars](jobconfiguration.md#env_vars)
* [job_id](jobconfiguration.md#job_id)
* [kubernetes_image](jobconfiguration.md#optional-kubernetes_image)
* [labels](jobconfiguration.md#optional-labels)
* [lifecycle](jobconfiguration.md#lifecycle)
* [max_retries](jobconfiguration.md#max_retries)
* [memory](jobconfiguration.md#optional-memory)
* [name](jobconfiguration.md#name)
* [operations](jobconfiguration.md#operations)
* [performance_metrics](jobconfiguration.md#optional-performance_metrics)
* [probation_window](jobconfiguration.md#probation_window)
* [slicers](jobconfiguration.md#slicers)
* [targets](jobconfiguration.md#optional-targets)
* [volumes](jobconfiguration.md#optional-volumes)
* [workers](jobconfiguration.md#workers)

## Properties

###  _context

• **_context**: *"job"*

*Defined in [packages/teraslice-client-js/src/interfaces.ts:169](https://github.com/terascope/teraslice/blob/f95bb5556/packages/teraslice-client-js/src/interfaces.ts#L169)*

___

###  _created

• **_created**: *string*

*Defined in [packages/teraslice-client-js/src/interfaces.ts:170](https://github.com/terascope/teraslice/blob/f95bb5556/packages/teraslice-client-js/src/interfaces.ts#L170)*

___

###  _updated

• **_updated**: *string*

*Defined in [packages/teraslice-client-js/src/interfaces.ts:171](https://github.com/terascope/teraslice/blob/f95bb5556/packages/teraslice-client-js/src/interfaces.ts#L171)*

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

###  job_id

• **job_id**: *string*

*Defined in [packages/teraslice-client-js/src/interfaces.ts:168](https://github.com/terascope/teraslice/blob/f95bb5556/packages/teraslice-client-js/src/interfaces.ts#L168)*

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
