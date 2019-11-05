---
title: Terafoundation: `ClusterContext`
sidebar_label: ClusterContext
---

# Class: ClusterContext <**S, A, D**>

A Cluster Context (with worker processes), useful for scaling

## Type parameters

▪ **S**

▪ **A**

▪ **D**: *string*

## Hierarchy

* [CoreContext](corecontext.md)‹S, A, D›

  ↳ **ClusterContext**

## Implements

* object

## Index

### Constructors

* [constructor](clustercontext.md#constructor)

### Properties

* [apis](clustercontext.md#apis)
* [arch](clustercontext.md#arch)
* [assignment](clustercontext.md#assignment)
* [cluster](clustercontext.md#cluster)
* [cluster_name](clustercontext.md#optional-cluster_name)
* [foundation](clustercontext.md#foundation)
* [logger](clustercontext.md#logger)
* [name](clustercontext.md#name)
* [platform](clustercontext.md#platform)
* [sysconfig](clustercontext.md#sysconfig)

## Constructors

###  constructor

\+ **new ClusterContext**(`config`: i.FoundationConfig‹S, A, D›): *[ClusterContext](clustercontext.md)*

*Overrides [CoreContext](corecontext.md).[constructor](corecontext.md#constructor)*

*Defined in [cluster-context.ts:20](https://github.com/terascope/teraslice/blob/d8feecc03/packages/terafoundation/src/cluster-context.ts#L20)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | i.FoundationConfig‹S, A, D› |

**Returns:** *[ClusterContext](clustercontext.md)*

## Properties

###  apis

• **apis**: *i.ContextAPIs & A*

*Inherited from [CoreContext](corecontext.md).[apis](corecontext.md#apis)*

*Defined in [core-context.ts:16](https://github.com/terascope/teraslice/blob/d8feecc03/packages/terafoundation/src/core-context.ts#L16)*

___

###  arch

• **arch**: *string* =  process.arch

*Inherited from [CoreContext](corecontext.md).[arch](corecontext.md#arch)*

*Defined in [core-context.ts:20](https://github.com/terascope/teraslice/blob/d8feecc03/packages/terafoundation/src/core-context.ts#L20)*

___

###  assignment

• **assignment**: *D*

*Inherited from [CoreContext](corecontext.md).[assignment](corecontext.md#assignment)*

*Defined in [core-context.ts:22](https://github.com/terascope/teraslice/blob/d8feecc03/packages/terafoundation/src/core-context.ts#L22)*

___

###  cluster

• **cluster**: *i.Cluster*

*Inherited from [CoreContext](corecontext.md).[cluster](corecontext.md#cluster)*

*Defined in [core-context.ts:14](https://github.com/terascope/teraslice/blob/d8feecc03/packages/terafoundation/src/core-context.ts#L14)*

___

### `Optional` cluster_name

• **cluster_name**? : *undefined | string*

*Inherited from [CoreContext](corecontext.md).[cluster_name](corecontext.md#optional-cluster_name)*

*Defined in [core-context.ts:23](https://github.com/terascope/teraslice/blob/d8feecc03/packages/terafoundation/src/core-context.ts#L23)*

___

###  foundation

• **foundation**: *[LegacyFoundationApis](../interfaces/legacyfoundationapis.md)*

*Inherited from [CoreContext](corecontext.md).[foundation](corecontext.md#foundation)*

*Defined in [core-context.ts:17](https://github.com/terascope/teraslice/blob/d8feecc03/packages/terafoundation/src/core-context.ts#L17)*

___

###  logger

• **logger**: *Logger*

*Inherited from [CoreContext](corecontext.md).[logger](corecontext.md#logger)*

*Defined in [core-context.ts:18](https://github.com/terascope/teraslice/blob/d8feecc03/packages/terafoundation/src/core-context.ts#L18)*

___

###  name

• **name**: *string*

*Inherited from [CoreContext](corecontext.md).[name](corecontext.md#name)*

*Defined in [core-context.ts:19](https://github.com/terascope/teraslice/blob/d8feecc03/packages/terafoundation/src/core-context.ts#L19)*

___

###  platform

• **platform**: *"aix" | "android" | "darwin" | "freebsd" | "linux" | "openbsd" | "sunos" | "win32" | "cygwin" | "netbsd"* =  process.platform

*Inherited from [CoreContext](corecontext.md).[platform](corecontext.md#platform)*

*Defined in [core-context.ts:21](https://github.com/terascope/teraslice/blob/d8feecc03/packages/terafoundation/src/core-context.ts#L21)*

___

###  sysconfig

• **sysconfig**: *i.FoundationSysConfig‹S›*

*Inherited from [CoreContext](corecontext.md).[sysconfig](corecontext.md#sysconfig)*

*Defined in [core-context.ts:15](https://github.com/terascope/teraslice/blob/d8feecc03/packages/terafoundation/src/core-context.ts#L15)*
