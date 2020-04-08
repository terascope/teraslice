---
title: Terafoundation: `CoreContext`
sidebar_label: CoreContext
---

# Class: CoreContext <**S, A, D**>

CoreContext

## Type parameters

▪ **S**

▪ **A**

▪ **D**: *string*

## Hierarchy

* **CoreContext**

  ↳ [ClusterContext](clustercontext.md)

  ↳ [ProcessContext](processcontext.md)

  ↳ [TestContext](testcontext.md)

## Implements

* object

## Index

### Constructors

* [constructor](corecontext.md#constructor)

### Properties

* [apis](corecontext.md#apis)
* [arch](corecontext.md#arch)
* [assignment](corecontext.md#assignment)
* [cluster](corecontext.md#cluster)
* [cluster_name](corecontext.md#optional-cluster_name)
* [foundation](corecontext.md#foundation)
* [logger](corecontext.md#logger)
* [name](corecontext.md#name)
* [platform](corecontext.md#platform)
* [sysconfig](corecontext.md#sysconfig)

## Constructors

###  constructor

\+ **new CoreContext**(`config`: i.FoundationConfig‹S, A, D›, `cluster`: i.Cluster, `sysconfig`: i.FoundationSysConfig‹S›, `assignment?`: D): *[CoreContext](corecontext.md)*

*Defined in [packages/terafoundation/src/core-context.ts:22](https://github.com/terascope/teraslice/blob/b843209f9/packages/terafoundation/src/core-context.ts#L22)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | i.FoundationConfig‹S, A, D› |
`cluster` | i.Cluster |
`sysconfig` | i.FoundationSysConfig‹S› |
`assignment?` | D |

**Returns:** *[CoreContext](corecontext.md)*

## Properties

###  apis

• **apis**: *i.ContextAPIs & A*

*Defined in [packages/terafoundation/src/core-context.ts:15](https://github.com/terascope/teraslice/blob/b843209f9/packages/terafoundation/src/core-context.ts#L15)*

___

###  arch

• **arch**: *string* =  process.arch

*Defined in [packages/terafoundation/src/core-context.ts:19](https://github.com/terascope/teraslice/blob/b843209f9/packages/terafoundation/src/core-context.ts#L19)*

___

###  assignment

• **assignment**: *D*

*Defined in [packages/terafoundation/src/core-context.ts:21](https://github.com/terascope/teraslice/blob/b843209f9/packages/terafoundation/src/core-context.ts#L21)*

___

###  cluster

• **cluster**: *i.Cluster*

*Defined in [packages/terafoundation/src/core-context.ts:13](https://github.com/terascope/teraslice/blob/b843209f9/packages/terafoundation/src/core-context.ts#L13)*

___

### `Optional` cluster_name

• **cluster_name**? : *undefined | string*

*Defined in [packages/terafoundation/src/core-context.ts:22](https://github.com/terascope/teraslice/blob/b843209f9/packages/terafoundation/src/core-context.ts#L22)*

___

###  foundation

• **foundation**: *[LegacyFoundationApis](../interfaces/legacyfoundationapis.md)*

*Defined in [packages/terafoundation/src/core-context.ts:16](https://github.com/terascope/teraslice/blob/b843209f9/packages/terafoundation/src/core-context.ts#L16)*

___

###  logger

• **logger**: *Logger*

*Defined in [packages/terafoundation/src/core-context.ts:17](https://github.com/terascope/teraslice/blob/b843209f9/packages/terafoundation/src/core-context.ts#L17)*

___

###  name

• **name**: *string*

*Defined in [packages/terafoundation/src/core-context.ts:18](https://github.com/terascope/teraslice/blob/b843209f9/packages/terafoundation/src/core-context.ts#L18)*

___

###  platform

• **platform**: *"aix" | "android" | "darwin" | "freebsd" | "linux" | "openbsd" | "sunos" | "win32" | "cygwin" | "netbsd"* =  process.platform

*Defined in [packages/terafoundation/src/core-context.ts:20](https://github.com/terascope/teraslice/blob/b843209f9/packages/terafoundation/src/core-context.ts#L20)*

___

###  sysconfig

• **sysconfig**: *i.FoundationSysConfig‹S›*

*Defined in [packages/terafoundation/src/core-context.ts:14](https://github.com/terascope/teraslice/blob/b843209f9/packages/terafoundation/src/core-context.ts#L14)*
