---
title: TS Transforms: `PostProcessPhase`
sidebar_label: PostProcessPhase
---

# Class: PostProcessPhase

## Hierarchy

* [PhaseBase](phasebase.md)

  ↳ **PostProcessPhase**

## Index

### Constructors

* [constructor](postprocessphase.md#constructor)

### Properties

* [hasProcessing](postprocessphase.md#hasprocessing)
* [opConfig](postprocessphase.md#protected-opconfig)
* [phase](postprocessphase.md#phase)

### Methods

* [run](postprocessphase.md#run)

## Constructors

###  constructor

\+ **new PostProcessPhase**(`opConfig`: [WatcherConfig](../interfaces/watcherconfig.md), `configList`: [PostProcessingDict](../interfaces/postprocessingdict.md), `opsManager`: OperationsManager): *[PostProcessPhase](postprocessphase.md)*

*Overrides [PhaseBase](phasebase.md).[constructor](phasebase.md#constructor)*

*Defined in [phases/post-process-phase.ts:13](https://github.com/terascope/teraslice/blob/d8feecc03/packages/ts-transforms/src/phases/post-process-phase.ts#L13)*

**Parameters:**

Name | Type |
------ | ------ |
`opConfig` | [WatcherConfig](../interfaces/watcherconfig.md) |
`configList` | [PostProcessingDict](../interfaces/postprocessingdict.md) |
`opsManager` | OperationsManager |

**Returns:** *[PostProcessPhase](postprocessphase.md)*

## Properties

###  hasProcessing

• **hasProcessing**: *boolean*

*Inherited from [PhaseBase](phasebase.md).[hasProcessing](phasebase.md#hasprocessing)*

*Defined in [phases/base.ts:6](https://github.com/terascope/teraslice/blob/d8feecc03/packages/ts-transforms/src/phases/base.ts#L6)*

___

### `Protected` opConfig

• **opConfig**: *[WatcherConfig](../interfaces/watcherconfig.md)*

*Inherited from [PhaseBase](phasebase.md).[opConfig](phasebase.md#protected-opconfig)*

*Defined in [phases/base.ts:7](https://github.com/terascope/teraslice/blob/d8feecc03/packages/ts-transforms/src/phases/base.ts#L7)*

___

###  phase

• **phase**: *[OperationsPipline](../interfaces/operationspipline.md)*

*Inherited from [PhaseBase](phasebase.md).[phase](phasebase.md#phase)*

*Defined in [phases/base.ts:5](https://github.com/terascope/teraslice/blob/d8feecc03/packages/ts-transforms/src/phases/base.ts#L5)*

## Methods

###  run

▸ **run**(`dataArray`: DataEntity[]): *DataEntity[]*

*Overrides [PhaseBase](phasebase.md).[run](phasebase.md#abstract-run)*

*Defined in [phases/post-process-phase.ts:34](https://github.com/terascope/teraslice/blob/d8feecc03/packages/ts-transforms/src/phases/post-process-phase.ts#L34)*

**Parameters:**

Name | Type |
------ | ------ |
`dataArray` | DataEntity[] |

**Returns:** *DataEntity[]*
