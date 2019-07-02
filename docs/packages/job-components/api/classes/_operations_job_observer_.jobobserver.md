---
title: Job Components Operations Job Observer Jobobserver
sidebar_label: Operations Job Observer Jobobserver
---

> Operations Job Observer Jobobserver for @terascope/job-components

[Globals](../overview.md) / ["operations/job-observer"](../modules/_operations_job_observer_.md) / [JobObserver](_operations_job_observer_.jobobserver.md) /

# Class: JobObserver <**T**>

An Observer for monitoring the Slice Analyitcs

## Type parameters

▪ **T**

## Hierarchy

  * [Observer](_operations_observer_.observer.md)

  * **JobObserver**

## Implements

* [OperationLifeCycle](../interfaces/_interfaces_operation_lifecycle_.operationlifecycle.md)
* [WorkerOperationLifeCycle](../interfaces/_interfaces_operation_lifecycle_.workeroperationlifecycle.md)

### Index

#### Constructors

* [constructor](_operations_job_observer_.jobobserver.md#constructor)

#### Properties

* [_currentIndex](_operations_job_observer_.jobobserver.md#protected-_currentindex)
* [_currentSliceId](_operations_job_observer_.jobobserver.md#protected-_currentsliceid)
* [analyticsData](_operations_job_observer_.jobobserver.md#analyticsdata)
* [apiConfig](_operations_job_observer_.jobobserver.md#apiconfig)
* [collectAnalytics](_operations_job_observer_.jobobserver.md#collectanalytics)
* [context](_operations_job_observer_.jobobserver.md#context)
* [events](_operations_job_observer_.jobobserver.md#events)
* [executionConfig](_operations_job_observer_.jobobserver.md#executionconfig)
* [logger](_operations_job_observer_.jobobserver.md#logger)

#### Methods

* [defaultAnalytics](_operations_job_observer_.jobobserver.md#defaultanalytics)
* [getAnalytics](_operations_job_observer_.jobobserver.md#getanalytics)
* [initialize](_operations_job_observer_.jobobserver.md#initialize)
* [onOperationComplete](_operations_job_observer_.jobobserver.md#onoperationcomplete)
* [onOperationStart](_operations_job_observer_.jobobserver.md#onoperationstart)
* [onSliceInitialized](_operations_job_observer_.jobobserver.md#onsliceinitialized)
* [shutdown](_operations_job_observer_.jobobserver.md#shutdown)

## Constructors

###  constructor

\+ **new JobObserver**(`context`: *[WorkerContext](../interfaces/_interfaces_context_.workercontext.md)*, `apiConfig`: *[APIConfig](../interfaces/_interfaces_jobs_.apiconfig.md)*, `executionConfig`: *[ExecutionConfig](../interfaces/_interfaces_jobs_.executionconfig.md)*): *[JobObserver](_operations_job_observer_.jobobserver.md)*

*Overrides [APICore](_operations_core_api_core_.apicore.md).[constructor](_operations_core_api_core_.apicore.md#constructor)*

*Defined in [operations/job-observer.ts:21](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/job-observer.ts#L21)*

**Parameters:**

Name | Type |
------ | ------ |
`context` | [WorkerContext](../interfaces/_interfaces_context_.workercontext.md) |
`apiConfig` | [APIConfig](../interfaces/_interfaces_jobs_.apiconfig.md) |
`executionConfig` | [ExecutionConfig](../interfaces/_interfaces_jobs_.executionconfig.md) |

**Returns:** *[JobObserver](_operations_job_observer_.jobobserver.md)*

## Properties

### `Protected` _currentIndex

• **_currentIndex**: *number*

*Defined in [operations/job-observer.ts:15](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/job-observer.ts#L15)*

___

### `Protected` _currentSliceId

• **_currentSliceId**: *string*

*Defined in [operations/job-observer.ts:13](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/job-observer.ts#L13)*

___

###  analyticsData

• **analyticsData**: *[SliceAnalyticsData](../interfaces/_interfaces_operations_.sliceanalyticsdata.md) | undefined*

*Defined in [operations/job-observer.ts:10](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/job-observer.ts#L10)*

___

###  apiConfig

• **apiConfig**: *`Readonly<APIConfig & T>`*

*Inherited from [APICore](_operations_core_api_core_.apicore.md).[apiConfig](_operations_core_api_core_.apicore.md#apiconfig)*

*Defined in [operations/core/api-core.ts:13](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/api-core.ts#L13)*

___

###  collectAnalytics

• **collectAnalytics**: *boolean*

*Defined in [operations/job-observer.ts:9](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/job-observer.ts#L9)*

___

###  context

• **context**: *`Readonly<WorkerContext>`*

*Inherited from [Core](_operations_core_core_.core.md).[context](_operations_core_core_.core.md#context)*

*Defined in [operations/core/core.ts:10](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/core.ts#L10)*

___

###  events

• **events**: *`EventEmitter`*

*Inherited from [Core](_operations_core_core_.core.md).[events](_operations_core_core_.core.md#events)*

*Defined in [operations/core/core.ts:13](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/core.ts#L13)*

___

###  executionConfig

• **executionConfig**: *`Readonly<ExecutionConfig>`*

*Inherited from [Core](_operations_core_core_.core.md).[executionConfig](_operations_core_core_.core.md#executionconfig)*

*Defined in [operations/core/core.ts:11](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/core.ts#L11)*

___

###  logger

• **logger**: *`Logger`*

*Inherited from [Core](_operations_core_core_.core.md).[logger](_operations_core_core_.core.md#logger)*

*Defined in [operations/core/core.ts:12](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/core.ts#L12)*

## Methods

###  defaultAnalytics

▸ **defaultAnalytics**(): *[SliceAnalyticsData](../interfaces/_interfaces_operations_.sliceanalyticsdata.md)*

*Defined in [operations/job-observer.ts:87](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/job-observer.ts#L87)*

**Returns:** *[SliceAnalyticsData](../interfaces/_interfaces_operations_.sliceanalyticsdata.md)*

___

###  getAnalytics

▸ **getAnalytics**(): *undefined | object*

*Defined in [operations/job-observer.ts:76](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/job-observer.ts#L76)*

**Returns:** *undefined | object*

___

###  initialize

▸ **initialize**(): *`Promise<void>`*

*Inherited from [APICore](_operations_core_api_core_.apicore.md).[initialize](_operations_core_api_core_.apicore.md#initialize)*

*Overrides [Core](_operations_core_core_.core.md).[initialize](_operations_core_core_.core.md#abstract-initialize)*

*Defined in [operations/core/api-core.ts:28](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/api-core.ts#L28)*

**Returns:** *`Promise<void>`*

___

###  onOperationComplete

▸ **onOperationComplete**(`sliceId`: *string*, `index`: *number*, `processed`: *number*): *void*

*Implementation of [WorkerOperationLifeCycle](../interfaces/_interfaces_operation_lifecycle_.workeroperationlifecycle.md)*

*Defined in [operations/job-observer.ts:61](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/job-observer.ts#L61)*

**Parameters:**

Name | Type |
------ | ------ |
`sliceId` | string |
`index` | number |
`processed` | number |

**Returns:** *void*

___

###  onOperationStart

▸ **onOperationStart**(`sliceId`: *string*, `index`: *number*): *void*

*Implementation of [WorkerOperationLifeCycle](../interfaces/_interfaces_operation_lifecycle_.workeroperationlifecycle.md)*

*Defined in [operations/job-observer.ts:49](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/job-observer.ts#L49)*

**Parameters:**

Name | Type |
------ | ------ |
`sliceId` | string |
`index` | number |

**Returns:** *void*

___

###  onSliceInitialized

▸ **onSliceInitialized**(`sliceId`: *string*): *`Promise<void>`*

*Implementation of [WorkerOperationLifeCycle](../interfaces/_interfaces_operation_lifecycle_.workeroperationlifecycle.md)*

*Defined in [operations/job-observer.ts:38](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/job-observer.ts#L38)*

**Parameters:**

Name | Type |
------ | ------ |
`sliceId` | string |

**Returns:** *`Promise<void>`*

___

###  shutdown

▸ **shutdown**(): *`Promise<void>`*

*Implementation of [WorkerOperationLifeCycle](../interfaces/_interfaces_operation_lifecycle_.workeroperationlifecycle.md)*

*Inherited from [APICore](_operations_core_api_core_.apicore.md).[shutdown](_operations_core_api_core_.apicore.md#shutdown)*

*Overrides [Core](_operations_core_core_.core.md).[shutdown](_operations_core_core_.core.md#abstract-shutdown)*

*Defined in [operations/core/api-core.ts:32](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/api-core.ts#L32)*

**Returns:** *`Promise<void>`*
