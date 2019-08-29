---
title: Job Components: `TestContext`
sidebar_label: TestContext
---

# Class: TestContext

## Hierarchy

* **TestContext**

## Implements

* [Context](../interfaces/context.md)

## Index

### Constructors

* [constructor](testcontext.md#constructor)

### Properties

* [apis](testcontext.md#apis)
* [arch](testcontext.md#arch)
* [assignment](testcontext.md#assignment)
* [cluster](testcontext.md#cluster)
* [foundation](testcontext.md#foundation)
* [logger](testcontext.md#logger)
* [name](testcontext.md#name)
* [platform](testcontext.md#platform)
* [sysconfig](testcontext.md#sysconfig)

## Constructors

###  constructor

\+ **new TestContext**(`testName`: string, `options`: [TestContextOptions](../interfaces/testcontextoptions.md)): *[TestContext](testcontext.md)*

*Defined in [test-helpers.ts:157](https://github.com/terascope/teraslice/blob/d2d877b60/packages/job-components/src/test-helpers.ts#L157)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`testName` | string | - |
`options` | [TestContextOptions](../interfaces/testcontextoptions.md) |  {} |

**Returns:** *[TestContext](testcontext.md)*

## Properties

###  apis

• **apis**: *[TestContextAPIs](../interfaces/testcontextapis.md) | [WorkerContextAPIs](../interfaces/workercontextapis.md) | [ContextAPIs](../interfaces/contextapis.md)*

*Implementation of [Context](../interfaces/context.md).[apis](../interfaces/context.md#apis)*

*Defined in [test-helpers.ts:152](https://github.com/terascope/teraslice/blob/d2d877b60/packages/job-components/src/test-helpers.ts#L152)*

___

###  arch

• **arch**: *string* =  process.arch

*Implementation of [Context](../interfaces/context.md).[arch](../interfaces/context.md#arch)*

*Defined in [test-helpers.ts:157](https://github.com/terascope/teraslice/blob/d2d877b60/packages/job-components/src/test-helpers.ts#L157)*

___

###  assignment

• **assignment**: *i.Assignment* = "worker"

*Implementation of [Context](../interfaces/context.md).[assignment](../interfaces/context.md#assignment)*

*Defined in [test-helpers.ts:155](https://github.com/terascope/teraslice/blob/d2d877b60/packages/job-components/src/test-helpers.ts#L155)*

___

###  cluster

• **cluster**: *[ContextClusterConfig](../interfaces/contextclusterconfig.md)*

*Implementation of [Context](../interfaces/context.md).[cluster](../interfaces/context.md#cluster)*

*Defined in [test-helpers.ts:151](https://github.com/terascope/teraslice/blob/d2d877b60/packages/job-components/src/test-helpers.ts#L151)*

___

###  foundation

• **foundation**: *[LegacyFoundationApis](../interfaces/legacyfoundationapis.md)*

*Implementation of [Context](../interfaces/context.md).[foundation](../interfaces/context.md#foundation)*

*Defined in [test-helpers.ts:153](https://github.com/terascope/teraslice/blob/d2d877b60/packages/job-components/src/test-helpers.ts#L153)*

___

###  logger

• **logger**: *Logger*

*Implementation of [Context](../interfaces/context.md).[logger](../interfaces/context.md#logger)*

*Defined in [test-helpers.ts:149](https://github.com/terascope/teraslice/blob/d2d877b60/packages/job-components/src/test-helpers.ts#L149)*

___

###  name

• **name**: *string*

*Implementation of [Context](../interfaces/context.md).[name](../interfaces/context.md#name)*

*Defined in [test-helpers.ts:154](https://github.com/terascope/teraslice/blob/d2d877b60/packages/job-components/src/test-helpers.ts#L154)*

___

###  platform

• **platform**: *string* =  process.platform

*Implementation of [Context](../interfaces/context.md).[platform](../interfaces/context.md#platform)*

*Defined in [test-helpers.ts:156](https://github.com/terascope/teraslice/blob/d2d877b60/packages/job-components/src/test-helpers.ts#L156)*

___

###  sysconfig

• **sysconfig**: *[SysConfig](../interfaces/sysconfig.md)*

*Implementation of [Context](../interfaces/context.md).[sysconfig](../interfaces/context.md#sysconfig)*

*Defined in [test-helpers.ts:150](https://github.com/terascope/teraslice/blob/d2d877b60/packages/job-components/src/test-helpers.ts#L150)*
