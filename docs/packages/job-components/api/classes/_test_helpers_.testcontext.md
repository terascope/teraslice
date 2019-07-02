---
title: Job Components Test Helpers Testcontext
sidebar_label: Test Helpers Testcontext
---

> Test Helpers Testcontext for @terascope/job-components

[Globals](../overview.md) / ["test-helpers"](../modules/_test_helpers_.md) / [TestContext](_test_helpers_.testcontext.md) /

# Class: TestContext

## Hierarchy

* **TestContext**

## Implements

* [Context](../interfaces/_interfaces_context_.context.md)

### Index

#### Constructors

* [constructor](_test_helpers_.testcontext.md#constructor)

#### Properties

* [apis](_test_helpers_.testcontext.md#apis)
* [arch](_test_helpers_.testcontext.md#arch)
* [assignment](_test_helpers_.testcontext.md#assignment)
* [cluster](_test_helpers_.testcontext.md#cluster)
* [foundation](_test_helpers_.testcontext.md#foundation)
* [logger](_test_helpers_.testcontext.md#logger)
* [name](_test_helpers_.testcontext.md#name)
* [platform](_test_helpers_.testcontext.md#platform)
* [sysconfig](_test_helpers_.testcontext.md#sysconfig)

## Constructors

###  constructor

\+ **new TestContext**(`testName`: *string*, `options`: *[TestContextOptions](../interfaces/_test_helpers_.testcontextoptions.md)*): *[TestContext](_test_helpers_.testcontext.md)*

*Defined in [test-helpers.ts:144](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/test-helpers.ts#L144)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`testName` | string | - |
`options` | [TestContextOptions](../interfaces/_test_helpers_.testcontextoptions.md) |  {} |

**Returns:** *[TestContext](_test_helpers_.testcontext.md)*

## Properties

###  apis

• **apis**: *[TestContextAPIs](../interfaces/_test_helpers_.testcontextapis.md) | [WorkerContextAPIs](../interfaces/_interfaces_context_.workercontextapis.md) | [ContextAPIs](../interfaces/_interfaces_context_.contextapis.md)*

*Implementation of [Context](../interfaces/_interfaces_context_.context.md).[apis](../interfaces/_interfaces_context_.context.md#apis)*

*Defined in [test-helpers.ts:139](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/test-helpers.ts#L139)*

___

###  arch

• **arch**: *string* =  process.arch

*Implementation of [Context](../interfaces/_interfaces_context_.context.md).[arch](../interfaces/_interfaces_context_.context.md#arch)*

*Defined in [test-helpers.ts:144](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/test-helpers.ts#L144)*

___

###  assignment

• **assignment**: *`i.Assignment`* = "worker"

*Implementation of [Context](../interfaces/_interfaces_context_.context.md).[assignment](../interfaces/_interfaces_context_.context.md#assignment)*

*Defined in [test-helpers.ts:142](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/test-helpers.ts#L142)*

___

###  cluster

• **cluster**: *[ContextClusterConfig](../interfaces/_interfaces_context_.contextclusterconfig.md)*

*Implementation of [Context](../interfaces/_interfaces_context_.context.md).[cluster](../interfaces/_interfaces_context_.context.md#cluster)*

*Defined in [test-helpers.ts:138](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/test-helpers.ts#L138)*

___

###  foundation

• **foundation**: *[LegacyFoundationApis](../interfaces/_interfaces_context_.legacyfoundationapis.md)*

*Implementation of [Context](../interfaces/_interfaces_context_.context.md).[foundation](../interfaces/_interfaces_context_.context.md#foundation)*

*Defined in [test-helpers.ts:140](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/test-helpers.ts#L140)*

___

###  logger

• **logger**: *`Logger`*

*Implementation of [Context](../interfaces/_interfaces_context_.context.md).[logger](../interfaces/_interfaces_context_.context.md#logger)*

*Defined in [test-helpers.ts:136](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/test-helpers.ts#L136)*

___

###  name

• **name**: *string*

*Implementation of [Context](../interfaces/_interfaces_context_.context.md).[name](../interfaces/_interfaces_context_.context.md#name)*

*Defined in [test-helpers.ts:141](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/test-helpers.ts#L141)*

___

###  platform

• **platform**: *string* =  process.platform

*Implementation of [Context](../interfaces/_interfaces_context_.context.md).[platform](../interfaces/_interfaces_context_.context.md#platform)*

*Defined in [test-helpers.ts:143](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/test-helpers.ts#L143)*

___

###  sysconfig

• **sysconfig**: *[SysConfig](../interfaces/_interfaces_context_.sysconfig.md)*

*Implementation of [Context](../interfaces/_interfaces_context_.context.md).[sysconfig](../interfaces/_interfaces_context_.context.md#sysconfig)*

*Defined in [test-helpers.ts:137](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/test-helpers.ts#L137)*
