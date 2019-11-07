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
* [cpu](jobconfiguration.md#optional-cpu)
* [env_vars](jobconfiguration.md#env_vars)
* [kubernetes_image](jobconfiguration.md#optional-kubernetes_image)
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

*Defined in [interfaces.ts:176](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-client-js/src/interfaces.ts#L176)*

___

###  _created

• **_created**: *string*

*Defined in [interfaces.ts:177](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-client-js/src/interfaces.ts#L177)*

___

###  _updated

• **_updated**: *string*

*Defined in [interfaces.ts:178](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-client-js/src/interfaces.ts#L178)*

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
