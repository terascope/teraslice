---
title: Job Components Test Helpers
sidebar_label: Test Helpers
---

> Test Helpers for @terascope/job-components

[Globals](../overview.md) / ["test-helpers"](_test_helpers_.md) /

# External module: "test-helpers"

### Index

#### Classes

* [TestContext](../classes/_test_helpers_.testcontext.md)

#### Interfaces

* [CachedClients](../interfaces/_test_helpers_.cachedclients.md)
* [TestClientConfig](../interfaces/_test_helpers_.testclientconfig.md)
* [TestClients](../interfaces/_test_helpers_.testclients.md)
* [TestClientsByEndpoint](../interfaces/_test_helpers_.testclientsbyendpoint.md)
* [TestContextAPIs](../interfaces/_test_helpers_.testcontextapis.md)
* [TestContextOptions](../interfaces/_test_helpers_.testcontextoptions.md)

#### Functions

* [newTestExecutionConfig](_test_helpers_.md#newtestexecutionconfig)
* [newTestExecutionContext](_test_helpers_.md#newtestexecutioncontext)
* [newTestJobConfig](_test_helpers_.md#newtestjobconfig)
* [newTestSlice](_test_helpers_.md#newtestslice)

## Functions

###  newTestExecutionConfig

▸ **newTestExecutionConfig**(`jobConfig`: *`Partial<i.JobConfig>`*): *[ExecutionConfig](../interfaces/_interfaces_jobs_.executionconfig.md)*

*Defined in [test-helpers.ts:39](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/test-helpers.ts#L39)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`jobConfig` | `Partial<i.JobConfig>` |  {} |

**Returns:** *[ExecutionConfig](../interfaces/_interfaces_jobs_.executionconfig.md)*

___

###  newTestExecutionContext

▸ **newTestExecutionContext**(`type`: *`i.Assignment`*, `config`: *[ExecutionConfig](../interfaces/_interfaces_jobs_.executionconfig.md)*): *[LegacyExecutionContext](../interfaces/_interfaces_jobs_.legacyexecutioncontext.md)*

*Defined in [test-helpers.ts:52](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/test-helpers.ts#L52)*

Create a new Execution Context

**`deprecated`** use the new WorkerExecutionContext and SlicerExecutionContext

**Parameters:**

Name | Type |
------ | ------ |
`type` | `i.Assignment` |
`config` | [ExecutionConfig](../interfaces/_interfaces_jobs_.executionconfig.md) |

**Returns:** *[LegacyExecutionContext](../interfaces/_interfaces_jobs_.legacyexecutioncontext.md)*

___

###  newTestJobConfig

▸ **newTestJobConfig**(`defaults`: *`Partial<i.JobConfig>`*): *[ValidatedJobConfig](../interfaces/_interfaces_jobs_.validatedjobconfig.md)*

*Defined in [test-helpers.ts:20](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/test-helpers.ts#L20)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`defaults` | `Partial<i.JobConfig>` |  {} |

**Returns:** *[ValidatedJobConfig](../interfaces/_interfaces_jobs_.validatedjobconfig.md)*

___

###  newTestSlice

▸ **newTestSlice**(`request`: *[SliceRequest](../interfaces/_interfaces_operations_.slicerequest.md)*): *[Slice](../interfaces/_interfaces_operations_.slice.md)*

*Defined in [test-helpers.ts:10](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/test-helpers.ts#L10)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`request` | [SliceRequest](../interfaces/_interfaces_operations_.slicerequest.md) |  {} |

**Returns:** *[Slice](../interfaces/_interfaces_operations_.slice.md)*
