---
title: Terafoundation: `ProcessContext`
sidebar_label: ProcessContext
---

# Class: ProcessContext <**S, A, D**>

A Single Process Context, this should be used when running
in a single process instance/container. This context doesn't
support some of the multiple worker/assignment variations
that `ClusterContext` does, like `master` or `worker`.

**`todo`** add process event handler listeners in initialize method

**`todo`** add shutdown handler logic with shutdown method

## Type parameters

▪ **S**

▪ **A**

▪ **D**: *string*

## Hierarchy

* [CoreContext](corecontext.md)‹S, A, D›

  ↳ **ProcessContext**

## Implements

* object

## Index

### Constructors

* [constructor](processcontext.md#constructor)

### Properties

* [apis](processcontext.md#apis)
* [arch](processcontext.md#arch)
* [assignment](processcontext.md#assignment)
* [cluster](processcontext.md#cluster)
* [cluster_name](processcontext.md#optional-cluster_name)
* [foundation](processcontext.md#foundation)
* [logger](processcontext.md#logger)
* [name](processcontext.md#name)
* [platform](processcontext.md#platform)
* [sysconfig](processcontext.md#sysconfig)

## Constructors

###  constructor

\+ **new ProcessContext**(`config`: i.FoundationConfig‹S, A, D›, `overrideArgs?`: i.ParsedArgs‹S›): *[ProcessContext](processcontext.md)*

*Overrides [CoreContext](corecontext.md).[constructor](corecontext.md#constructor)*

*Defined in [packages/terafoundation/src/process-context.ts:20](https://github.com/terascope/teraslice/blob/b843209f9/packages/terafoundation/src/process-context.ts#L20)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | i.FoundationConfig‹S, A, D› |
`overrideArgs?` | i.ParsedArgs‹S› |

**Returns:** *[ProcessContext](processcontext.md)*

## Properties

###  apis

• **apis**: *i.ContextAPIs & A*

*Inherited from [CoreContext](corecontext.md).[apis](corecontext.md#apis)*

*Defined in [packages/terafoundation/src/core-context.ts:15](https://github.com/terascope/teraslice/blob/b843209f9/packages/terafoundation/src/core-context.ts#L15)*

___

###  arch

• **arch**: *string* =  process.arch

*Inherited from [CoreContext](corecontext.md).[arch](corecontext.md#arch)*

*Defined in [packages/terafoundation/src/core-context.ts:19](https://github.com/terascope/teraslice/blob/b843209f9/packages/terafoundation/src/core-context.ts#L19)*

___

###  assignment

• **assignment**: *D*

*Inherited from [CoreContext](corecontext.md).[assignment](corecontext.md#assignment)*

*Defined in [packages/terafoundation/src/core-context.ts:21](https://github.com/terascope/teraslice/blob/b843209f9/packages/terafoundation/src/core-context.ts#L21)*

___

###  cluster

• **cluster**: *i.Cluster*

*Inherited from [CoreContext](corecontext.md).[cluster](corecontext.md#cluster)*

*Defined in [packages/terafoundation/src/core-context.ts:13](https://github.com/terascope/teraslice/blob/b843209f9/packages/terafoundation/src/core-context.ts#L13)*

___

### `Optional` cluster_name

• **cluster_name**? : *undefined | string*

*Inherited from [CoreContext](corecontext.md).[cluster_name](corecontext.md#optional-cluster_name)*

*Defined in [packages/terafoundation/src/core-context.ts:22](https://github.com/terascope/teraslice/blob/b843209f9/packages/terafoundation/src/core-context.ts#L22)*

___

###  foundation

• **foundation**: *[LegacyFoundationApis](../interfaces/legacyfoundationapis.md)*

*Inherited from [CoreContext](corecontext.md).[foundation](corecontext.md#foundation)*

*Defined in [packages/terafoundation/src/core-context.ts:16](https://github.com/terascope/teraslice/blob/b843209f9/packages/terafoundation/src/core-context.ts#L16)*

___

###  logger

• **logger**: *Logger*

*Inherited from [CoreContext](corecontext.md).[logger](corecontext.md#logger)*

*Defined in [packages/terafoundation/src/core-context.ts:17](https://github.com/terascope/teraslice/blob/b843209f9/packages/terafoundation/src/core-context.ts#L17)*

___

###  name

• **name**: *string*

*Inherited from [CoreContext](corecontext.md).[name](corecontext.md#name)*

*Defined in [packages/terafoundation/src/core-context.ts:18](https://github.com/terascope/teraslice/blob/b843209f9/packages/terafoundation/src/core-context.ts#L18)*

___

###  platform

• **platform**: *"aix" | "android" | "darwin" | "freebsd" | "linux" | "openbsd" | "sunos" | "win32" | "cygwin" | "netbsd"* =  process.platform

*Inherited from [CoreContext](corecontext.md).[platform](corecontext.md#platform)*

*Defined in [packages/terafoundation/src/core-context.ts:20](https://github.com/terascope/teraslice/blob/b843209f9/packages/terafoundation/src/core-context.ts#L20)*

___

###  sysconfig

• **sysconfig**: *i.FoundationSysConfig‹S›*

*Inherited from [CoreContext](corecontext.md).[sysconfig](corecontext.md#sysconfig)*

*Defined in [packages/terafoundation/src/core-context.ts:14](https://github.com/terascope/teraslice/blob/b843209f9/packages/terafoundation/src/core-context.ts#L14)*
