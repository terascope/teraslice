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

*Defined in [packages/job-components/src/test-helpers.ts:160](https://github.com/terascope/teraslice/blob/b843209f9/packages/job-components/src/test-helpers.ts#L160)*

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

*Defined in [packages/job-components/src/test-helpers.ts:155](https://github.com/terascope/teraslice/blob/b843209f9/packages/job-components/src/test-helpers.ts#L155)*

___

###  arch

• **arch**: *string* =  process.arch

*Implementation of [Context](../interfaces/context.md).[arch](../interfaces/context.md#arch)*

*Defined in [packages/job-components/src/test-helpers.ts:160](https://github.com/terascope/teraslice/blob/b843209f9/packages/job-components/src/test-helpers.ts#L160)*

___

###  assignment

• **assignment**: *i.Assignment* = "worker"

*Implementation of [Context](../interfaces/context.md).[assignment](../interfaces/context.md#assignment)*

*Defined in [packages/job-components/src/test-helpers.ts:158](https://github.com/terascope/teraslice/blob/b843209f9/packages/job-components/src/test-helpers.ts#L158)*

___

###  cluster

• **cluster**: *[ContextClusterConfig](../interfaces/contextclusterconfig.md)*

*Implementation of [Context](../interfaces/context.md).[cluster](../interfaces/context.md#cluster)*

*Defined in [packages/job-components/src/test-helpers.ts:154](https://github.com/terascope/teraslice/blob/b843209f9/packages/job-components/src/test-helpers.ts#L154)*

___

###  foundation

• **foundation**: *[LegacyFoundationApis](../interfaces/legacyfoundationapis.md)*

*Implementation of [Context](../interfaces/context.md).[foundation](../interfaces/context.md#foundation)*

*Defined in [packages/job-components/src/test-helpers.ts:156](https://github.com/terascope/teraslice/blob/b843209f9/packages/job-components/src/test-helpers.ts#L156)*

___

###  logger

• **logger**: *Logger*

*Implementation of [Context](../interfaces/context.md).[logger](../interfaces/context.md#logger)*

*Defined in [packages/job-components/src/test-helpers.ts:152](https://github.com/terascope/teraslice/blob/b843209f9/packages/job-components/src/test-helpers.ts#L152)*

___

###  name

• **name**: *string*

*Implementation of [Context](../interfaces/context.md).[name](../interfaces/context.md#name)*

*Defined in [packages/job-components/src/test-helpers.ts:157](https://github.com/terascope/teraslice/blob/b843209f9/packages/job-components/src/test-helpers.ts#L157)*

___

###  platform

• **platform**: *string* =  process.platform

*Implementation of [Context](../interfaces/context.md).[platform](../interfaces/context.md#platform)*

*Defined in [packages/job-components/src/test-helpers.ts:159](https://github.com/terascope/teraslice/blob/b843209f9/packages/job-components/src/test-helpers.ts#L159)*

___

###  sysconfig

• **sysconfig**: *[SysConfig](../interfaces/sysconfig.md)*

*Implementation of [Context](../interfaces/context.md).[sysconfig](../interfaces/context.md#sysconfig)*

*Defined in [packages/job-components/src/test-helpers.ts:153](https://github.com/terascope/teraslice/blob/b843209f9/packages/job-components/src/test-helpers.ts#L153)*
