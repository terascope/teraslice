---
title: Ts Transforms :: PostProcessPhase
sidebar_label: PostProcessPhase
---

# Class: PostProcessPhase

## Hierarchy

* [PhaseBase](phasebase.md)

  * **PostProcessPhase**

### Index

#### Constructors

* [constructor](postprocessphase.md#constructor)

#### Properties

* [hasProcessing](postprocessphase.md#hasprocessing)
* [opConfig](postprocessphase.md#protected-opconfig)
* [phase](postprocessphase.md#phase)

#### Methods

* [run](postprocessphase.md#run)

## Constructors

###  constructor

\+ **new PostProcessPhase**(`opConfig`: *[WatcherConfig](../interfaces/watcherconfig.md)*, `configList`: *[PostProcessingDict](../interfaces/postprocessingdict.md)*, `opsManager`: *`OperationsManager`*): *[PostProcessPhase](postprocessphase.md)*

*Overrides [PhaseBase](phasebase.md).[constructor](phasebase.md#constructor)*

*Defined in [phases/post_process_phase.ts:9](https://github.com/terascope/teraslice/blob/b0f73ab9/packages/ts-transforms/src/phases/post_process_phase.ts#L9)*

**Parameters:**

Name | Type |
------ | ------ |
`opConfig` | [WatcherConfig](../interfaces/watcherconfig.md) |
`configList` | [PostProcessingDict](../interfaces/postprocessingdict.md) |
`opsManager` | `OperationsManager` |

**Returns:** *[PostProcessPhase](postprocessphase.md)*

## Properties

###  hasProcessing

• **hasProcessing**: *boolean*

*Inherited from [PhaseBase](phasebase.md).[hasProcessing](phasebase.md#hasprocessing)*

*Defined in [phases/base.ts:8](https://github.com/terascope/teraslice/blob/b0f73ab9/packages/ts-transforms/src/phases/base.ts#L8)*

___

### `Protected` opConfig

• **opConfig**: *[WatcherConfig](../interfaces/watcherconfig.md)*

*Inherited from [PhaseBase](phasebase.md).[opConfig](phasebase.md#protected-opconfig)*

*Defined in [phases/base.ts:9](https://github.com/terascope/teraslice/blob/b0f73ab9/packages/ts-transforms/src/phases/base.ts#L9)*

___

###  phase

• **phase**: *[OperationsPipline](../interfaces/operationspipline.md)*

*Inherited from [PhaseBase](phasebase.md).[phase](phasebase.md#phase)*

*Defined in [phases/base.ts:7](https://github.com/terascope/teraslice/blob/b0f73ab9/packages/ts-transforms/src/phases/base.ts#L7)*

## Methods

###  run

▸ **run**(`dataArray`: *`DataEntity`[]*): *`DataEntity`[]*

*Overrides [PhaseBase](phasebase.md).[run](phasebase.md#abstract-run)*

*Defined in [phases/post_process_phase.ts:25](https://github.com/terascope/teraslice/blob/b0f73ab9/packages/ts-transforms/src/phases/post_process_phase.ts#L25)*

**Parameters:**

Name | Type |
------ | ------ |
`dataArray` | `DataEntity`[] |

**Returns:** *`DataEntity`[]*

