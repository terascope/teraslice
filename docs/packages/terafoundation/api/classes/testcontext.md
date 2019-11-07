---
title: Terafoundation: `TestContext`
sidebar_label: TestContext
---

# Class: TestContext <**S, A, D**>

## Type parameters

▪ **S**

▪ **A**

▪ **D**: *string*

## Hierarchy

* [CoreContext](corecontext.md)‹S, A & [TestContextAPIs](../interfaces/testcontextapis.md), D›

  ↳ **TestContext**

## Implements

* object

## Index

### Constructors

* [constructor](testcontext.md#constructor)

### Properties

* [apis](testcontext.md#apis)
* [arch](testcontext.md#arch)
* [assignment](testcontext.md#assignment)
* [cluster](testcontext.md#cluster)
* [cluster_name](testcontext.md#optional-cluster_name)
* [foundation](testcontext.md#foundation)
* [logger](testcontext.md#logger)
* [name](testcontext.md#name)
* [platform](testcontext.md#platform)
* [sysconfig](testcontext.md#sysconfig)

## Constructors

###  constructor

\+ **new TestContext**(`options`: [TestContextOptions](../interfaces/testcontextoptions.md)‹S›): *[TestContext](testcontext.md)*

*Overrides [CoreContext](corecontext.md).[constructor](corecontext.md#constructor)*

*Defined in [test-context.ts:77](https://github.com/terascope/teraslice/blob/d8feecc03/packages/terafoundation/src/test-context.ts#L77)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`options` | [TestContextOptions](../interfaces/testcontextoptions.md)‹S› |  {} |

**Returns:** *[TestContext](testcontext.md)*

## Properties

###  apis

• **apis**: *i.ContextAPIs & A & [TestContextAPIs](../interfaces/testcontextapis.md)*

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
