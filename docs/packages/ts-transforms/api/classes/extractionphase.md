---
title: Ts Transforms: `ExtractionPhase`
sidebar_label: ExtractionPhase
---

# Class: ExtractionPhase

## Hierarchy

* [PhaseBase](phasebase.md)

  * **ExtractionPhase**

### Index

#### Constructors

* [constructor](extractionphase.md#constructor)

#### Properties

* [hasProcessing](extractionphase.md#hasprocessing)
* [opConfig](extractionphase.md#protected-opconfig)
* [phase](extractionphase.md#phase)

#### Methods

* [run](extractionphase.md#run)

## Constructors

###  constructor

\+ **new ExtractionPhase**(`opConfig`: *[WatcherConfig](../interfaces/watcherconfig.md)*, `configList`: *[ExtractionProcessingDict](../interfaces/extractionprocessingdict.md)*, `opsManager`: *`OperationsManager`*): *[ExtractionPhase](extractionphase.md)*

*Overrides [PhaseBase](phasebase.md).[constructor](phasebase.md#constructor)*

*Defined in [phases/extraction_phase.ts:9](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/ts-transforms/src/phases/extraction_phase.ts#L9)*

**Parameters:**

Name | Type |
------ | ------ |
`opConfig` | [WatcherConfig](../interfaces/watcherconfig.md) |
`configList` | [ExtractionProcessingDict](../interfaces/extractionprocessingdict.md) |
`opsManager` | `OperationsManager` |

**Returns:** *[ExtractionPhase](extractionphase.md)*

## Properties

###  hasProcessing

• **hasProcessing**: *boolean*

*Inherited from [PhaseBase](phasebase.md).[hasProcessing](phasebase.md#hasprocessing)*

*Defined in [phases/base.ts:8](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/ts-transforms/src/phases/base.ts#L8)*

___

### `Protected` opConfig

• **opConfig**: *[WatcherConfig](../interfaces/watcherconfig.md)*

*Inherited from [PhaseBase](phasebase.md).[opConfig](phasebase.md#protected-opconfig)*

*Defined in [phases/base.ts:9](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/ts-transforms/src/phases/base.ts#L9)*

___

###  phase

• **phase**: *[OperationsPipline](../interfaces/operationspipline.md)*

*Inherited from [PhaseBase](phasebase.md).[phase](phasebase.md#phase)*

*Defined in [phases/base.ts:7](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/ts-transforms/src/phases/base.ts#L7)*

## Methods

###  run

▸ **run**(`dataArray`: *`DataEntity`[]*): *`DataEntity`[]*

*Overrides [PhaseBase](phasebase.md).[run](phasebase.md#abstract-run)*

*Defined in [phases/extraction_phase.ts:23](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/ts-transforms/src/phases/extraction_phase.ts#L23)*

**Parameters:**

Name | Type |
------ | ------ |
`dataArray` | `DataEntity`[] |

**Returns:** *`DataEntity`[]*

