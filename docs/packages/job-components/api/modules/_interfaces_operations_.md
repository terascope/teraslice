---
title: Job Components Interfaces Operations
sidebar_label: Interfaces Operations
---

> Interfaces Operations for @terascope/job-components

[Globals](../overview.md) / ["interfaces/operations"](_interfaces_operations_.md) /

# External module: "interfaces/operations"

### Index

#### Interfaces

* [ExecutionStats](../interfaces/_interfaces_operations_.executionstats.md)
* [LegacyOperation](../interfaces/_interfaces_operations_.legacyoperation.md)
* [LegacyProcessor](../interfaces/_interfaces_operations_.legacyprocessor.md)
* [LegacyReader](../interfaces/_interfaces_operations_.legacyreader.md)
* [Slice](../interfaces/_interfaces_operations_.slice.md)
* [SliceAnalyticsData](../interfaces/_interfaces_operations_.sliceanalyticsdata.md)
* [SliceRequest](../interfaces/_interfaces_operations_.slicerequest.md)
* [SliceResult](../interfaces/_interfaces_operations_.sliceresult.md)
* [SlicerFn](../interfaces/_interfaces_operations_.slicerfn.md)

#### Type aliases

* [OpAPI](_interfaces_operations_.md#opapi)
* [OpAPIFn](_interfaces_operations_.md#opapifn)
* [OpAPIInstance](_interfaces_operations_.md#opapiinstance)
* [ProcessorFn](_interfaces_operations_.md#processorfn)
* [ReaderFn](_interfaces_operations_.md#readerfn)
* [SlicerFns](_interfaces_operations_.md#slicerfns)
* [SlicerResult](_interfaces_operations_.md#slicerresult)
* [crossValidationFn](_interfaces_operations_.md#crossvalidationfn)
* [selfValidationFn](_interfaces_operations_.md#selfvalidationfn)
* [sliceQueueLengthFn](_interfaces_operations_.md#slicequeuelengthfn)

#### Variables

* [sliceAnalyticsMetrics](_interfaces_operations_.md#const-sliceanalyticsmetrics)

## Type aliases

###  OpAPI

Ƭ **OpAPI**: *[OpAPIFn](_interfaces_operations_.md#opapifn) | [OpAPIInstance](_interfaces_operations_.md#opapiinstance)*

*Defined in [interfaces/operations.ts:71](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/operations.ts#L71)*

___

###  OpAPIFn

Ƭ **OpAPIFn**: *`Function`*

*Defined in [interfaces/operations.ts:67](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/operations.ts#L67)*

___

###  OpAPIInstance

Ƭ **OpAPIInstance**: *object*

*Defined in [interfaces/operations.ts:68](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/operations.ts#L68)*

#### Type declaration:

● \[▪ **method**: *string*\]: `Function` | any

___

###  ProcessorFn

Ƭ **ProcessorFn**: *function*

*Defined in [interfaces/operations.ts:30](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/operations.ts#L30)*

#### Type declaration:

▸ (`data`: *`T`*, `logger`: *`Logger`*, `sliceRequest`: *[SliceRequest](../interfaces/_interfaces_operations_.slicerequest.md)*): *`Promise<T>` | `T`*

**Parameters:**

Name | Type |
------ | ------ |
`data` | `T` |
`logger` | `Logger` |
`sliceRequest` | [SliceRequest](../interfaces/_interfaces_operations_.slicerequest.md) |

___

###  ReaderFn

Ƭ **ReaderFn**: *function*

*Defined in [interfaces/operations.ts:23](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/operations.ts#L23)*

#### Type declaration:

▸ (`sliceRequest`: *[SliceRequest](../interfaces/_interfaces_operations_.slicerequest.md)*, `logger`: *`Logger`*): *`Promise<T>` | `T`*

**Parameters:**

Name | Type |
------ | ------ |
`sliceRequest` | [SliceRequest](../interfaces/_interfaces_operations_.slicerequest.md) |
`logger` | `Logger` |

___

###  SlicerFns

Ƭ **SlicerFns**: *[SlicerFn](../interfaces/_interfaces_operations_.slicerfn.md)[]*

*Defined in [interfaces/operations.ts:65](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/operations.ts#L65)*

___

###  SlicerResult

Ƭ **SlicerResult**: *[Slice](../interfaces/_interfaces_operations_.slice.md) | [SliceRequest](../interfaces/_interfaces_operations_.slicerequest.md) | [SliceRequest](../interfaces/_interfaces_operations_.slicerequest.md)[] | null*

*Defined in [interfaces/operations.ts:53](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/operations.ts#L53)*

___

###  crossValidationFn

Ƭ **crossValidationFn**: *function*

*Defined in [interfaces/operations.ts:6](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/operations.ts#L6)*

#### Type declaration:

▸ (`job`: *[ValidatedJobConfig](../interfaces/_interfaces_jobs_.validatedjobconfig.md)*, `sysconfig`: *[SysConfig](../interfaces/_interfaces_context_.sysconfig.md)*): *void*

**Parameters:**

Name | Type |
------ | ------ |
`job` | [ValidatedJobConfig](../interfaces/_interfaces_jobs_.validatedjobconfig.md) |
`sysconfig` | [SysConfig](../interfaces/_interfaces_context_.sysconfig.md) |

___

###  selfValidationFn

Ƭ **selfValidationFn**: *function*

*Defined in [interfaces/operations.ts:7](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/operations.ts#L7)*

#### Type declaration:

▸ (`config`: *[OpConfig](../interfaces/_interfaces_jobs_.opconfig.md)*): *void*

**Parameters:**

Name | Type |
------ | ------ |
`config` | [OpConfig](../interfaces/_interfaces_jobs_.opconfig.md) |

___

###  sliceQueueLengthFn

Ƭ **sliceQueueLengthFn**: *function*

*Defined in [interfaces/operations.ts:8](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/operations.ts#L8)*

#### Type declaration:

▸ (`executionContext`: *[LegacyExecutionContext](../interfaces/_interfaces_jobs_.legacyexecutioncontext.md)*): *number | string*

**Parameters:**

Name | Type |
------ | ------ |
`executionContext` | [LegacyExecutionContext](../interfaces/_interfaces_jobs_.legacyexecutioncontext.md) |

## Variables

### `Const` sliceAnalyticsMetrics

• **sliceAnalyticsMetrics**: *`ReadonlyArray<keyof SliceAnalyticsData>`* =  ['memory', 'size', 'time']

*Defined in [interfaces/operations.ts:51](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/operations.ts#L51)*
