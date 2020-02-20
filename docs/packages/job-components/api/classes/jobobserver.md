---
title: Job Components: `JobObserver`
sidebar_label: JobObserver
---

# Class: JobObserver <**T**>

An Observer for monitoring the Slice Analytics

## Type parameters

▪ **T**

## Hierarchy

  ↳ [Observer](observer.md)

  ↳ **JobObserver**

## Implements

* [OperationLifeCycle](../interfaces/operationlifecycle.md)
* [WorkerOperationLifeCycle](../interfaces/workeroperationlifecycle.md)

## Index

### Constructors

* [constructor](jobobserver.md#constructor)

### Properties

* [_currentIndex](jobobserver.md#protected-_currentindex)
* [_currentSliceId](jobobserver.md#protected-_currentsliceid)
* [analyticsData](jobobserver.md#analyticsdata)
* [apiConfig](jobobserver.md#apiconfig)
* [collectAnalytics](jobobserver.md#collectanalytics)
* [context](jobobserver.md#context)
* [events](jobobserver.md#events)
* [executionConfig](jobobserver.md#executionconfig)
* [logger](jobobserver.md#logger)

### Methods

* [defaultAnalytics](jobobserver.md#defaultanalytics)
* [getAnalytics](jobobserver.md#getanalytics)
* [initialize](jobobserver.md#initialize)
* [onOperationComplete](jobobserver.md#onoperationcomplete)
* [onOperationStart](jobobserver.md#onoperationstart)
* [onSliceInitialized](jobobserver.md#onsliceinitialized)
* [shutdown](jobobserver.md#shutdown)

## Constructors

###  constructor

\+ **new JobObserver**(`context`: [WorkerContext](../interfaces/workercontext.md), `apiConfig`: [APIConfig](../interfaces/apiconfig.md), `executionConfig`: [ExecutionConfig](../interfaces/executionconfig.md)): *[JobObserver](jobobserver.md)*

*Overrides [APICore](apicore.md).[constructor](apicore.md#constructor)*

*Defined in [packages/job-components/src/operations/job-observer.ts:23](https://github.com/terascope/teraslice/blob/653cf7530/packages/job-components/src/operations/job-observer.ts#L23)*

**Parameters:**

Name | Type |
------ | ------ |
`context` | [WorkerContext](../interfaces/workercontext.md) |
`apiConfig` | [APIConfig](../interfaces/apiconfig.md) |
`executionConfig` | [ExecutionConfig](../interfaces/executionconfig.md) |

**Returns:** *[JobObserver](jobobserver.md)*

## Properties

### `Protected` _currentIndex

• **_currentIndex**: *number*

*Defined in [packages/job-components/src/operations/job-observer.ts:17](https://github.com/terascope/teraslice/blob/653cf7530/packages/job-components/src/operations/job-observer.ts#L17)*

___

### `Protected` _currentSliceId

• **_currentSliceId**: *string*

*Defined in [packages/job-components/src/operations/job-observer.ts:15](https://github.com/terascope/teraslice/blob/653cf7530/packages/job-components/src/operations/job-observer.ts#L15)*

___

###  analyticsData

• **analyticsData**: *[SliceAnalyticsData](../interfaces/sliceanalyticsdata.md) | undefined*

*Defined in [packages/job-components/src/operations/job-observer.ts:12](https://github.com/terascope/teraslice/blob/653cf7530/packages/job-components/src/operations/job-observer.ts#L12)*

___

###  apiConfig

• **apiConfig**: *Readonly‹[APIConfig](../interfaces/apiconfig.md) & T›*

*Inherited from [APICore](apicore.md).[apiConfig](apicore.md#apiconfig)*

*Defined in [packages/job-components/src/operations/core/api-core.ts:17](https://github.com/terascope/teraslice/blob/653cf7530/packages/job-components/src/operations/core/api-core.ts#L17)*

___

###  collectAnalytics

• **collectAnalytics**: *boolean*

*Defined in [packages/job-components/src/operations/job-observer.ts:11](https://github.com/terascope/teraslice/blob/653cf7530/packages/job-components/src/operations/job-observer.ts#L11)*

___

###  context

• **context**: *Readonly‹[WorkerContext](../interfaces/workercontext.md)›*

*Inherited from [Core](core.md).[context](core.md#context)*

*Defined in [packages/job-components/src/operations/core/core.ts:10](https://github.com/terascope/teraslice/blob/653cf7530/packages/job-components/src/operations/core/core.ts#L10)*

___

###  events

• **events**: *EventEmitter*

*Inherited from [Core](core.md).[events](core.md#events)*

*Defined in [packages/job-components/src/operations/core/core.ts:13](https://github.com/terascope/teraslice/blob/653cf7530/packages/job-components/src/operations/core/core.ts#L13)*

___

###  executionConfig

• **executionConfig**: *Readonly‹[ExecutionConfig](../interfaces/executionconfig.md)›*

*Inherited from [Core](core.md).[executionConfig](core.md#executionconfig)*

*Defined in [packages/job-components/src/operations/core/core.ts:11](https://github.com/terascope/teraslice/blob/653cf7530/packages/job-components/src/operations/core/core.ts#L11)*

___

###  logger

• **logger**: *Logger*

*Inherited from [Core](core.md).[logger](core.md#logger)*

*Defined in [packages/job-components/src/operations/core/core.ts:12](https://github.com/terascope/teraslice/blob/653cf7530/packages/job-components/src/operations/core/core.ts#L12)*

## Methods

###  defaultAnalytics

▸ **defaultAnalytics**(): *[SliceAnalyticsData](../interfaces/sliceanalyticsdata.md)*

*Defined in [packages/job-components/src/operations/job-observer.ts:89](https://github.com/terascope/teraslice/blob/653cf7530/packages/job-components/src/operations/job-observer.ts#L89)*

**Returns:** *[SliceAnalyticsData](../interfaces/sliceanalyticsdata.md)*

___

###  getAnalytics

▸ **getAnalytics**(): *undefined | object*

*Defined in [packages/job-components/src/operations/job-observer.ts:78](https://github.com/terascope/teraslice/blob/653cf7530/packages/job-components/src/operations/job-observer.ts#L78)*

**Returns:** *undefined | object*

___

###  initialize

▸ **initialize**(): *Promise‹void›*

*Inherited from [APICore](apicore.md).[initialize](apicore.md#initialize)*

*Overrides [Core](core.md).[initialize](core.md#abstract-initialize)*

*Defined in [packages/job-components/src/operations/core/api-core.ts:32](https://github.com/terascope/teraslice/blob/653cf7530/packages/job-components/src/operations/core/api-core.ts#L32)*

**Returns:** *Promise‹void›*

___

###  onOperationComplete

▸ **onOperationComplete**(`sliceId`: string, `index`: number, `processed`: number): *void*

*Defined in [packages/job-components/src/operations/job-observer.ts:63](https://github.com/terascope/teraslice/blob/653cf7530/packages/job-components/src/operations/job-observer.ts#L63)*

**Parameters:**

Name | Type |
------ | ------ |
`sliceId` | string |
`index` | number |
`processed` | number |

**Returns:** *void*

___

###  onOperationStart

▸ **onOperationStart**(`sliceId`: string, `index`: number): *void*

*Implementation of [WorkerOperationLifeCycle](../interfaces/workeroperationlifecycle.md)*

*Defined in [packages/job-components/src/operations/job-observer.ts:51](https://github.com/terascope/teraslice/blob/653cf7530/packages/job-components/src/operations/job-observer.ts#L51)*

**Parameters:**

Name | Type |
------ | ------ |
`sliceId` | string |
`index` | number |

**Returns:** *void*

___

###  onSliceInitialized

▸ **onSliceInitialized**(`sliceId`: string): *Promise‹void›*

*Implementation of [WorkerOperationLifeCycle](../interfaces/workeroperationlifecycle.md)*

*Defined in [packages/job-components/src/operations/job-observer.ts:40](https://github.com/terascope/teraslice/blob/653cf7530/packages/job-components/src/operations/job-observer.ts#L40)*

**Parameters:**

Name | Type |
------ | ------ |
`sliceId` | string |

**Returns:** *Promise‹void›*

___

###  shutdown

▸ **shutdown**(): *Promise‹void›*

*Implementation of [WorkerOperationLifeCycle](../interfaces/workeroperationlifecycle.md)*

*Inherited from [APICore](apicore.md).[shutdown](apicore.md#shutdown)*

*Overrides [Core](core.md).[shutdown](core.md#abstract-shutdown)*

*Defined in [packages/job-components/src/operations/core/api-core.ts:36](https://github.com/terascope/teraslice/blob/653cf7530/packages/job-components/src/operations/core/api-core.ts#L36)*

**Returns:** *Promise‹void›*
