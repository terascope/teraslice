---
title: Ts Transforms :: PhaseBase
sidebar_label: PhaseBase
---

# Class: PhaseBase

## Hierarchy

* **PhaseBase**

  * [SelectionPhase](selectionphase.md)

  * [ExtractionPhase](extractionphase.md)

  * [PostProcessPhase](postprocessphase.md)

  * [OutputPhase](outputphase.md)

### Index

#### Constructors

* [constructor](phasebase.md#constructor)

#### Properties

* [hasProcessing](phasebase.md#hasprocessing)
* [opConfig](phasebase.md#protected-opconfig)
* [phase](phasebase.md#phase)

#### Methods

* [run](phasebase.md#abstract-run)

## Constructors

###  constructor

\+ **new PhaseBase**(`opConfig`: *[WatcherConfig](../interfaces/watcherconfig.md)*): *[PhaseBase](phasebase.md)*

*Defined in [phases/base.ts:9](https://github.com/terascope/teraslice/blob/7cdb60b1/packages/ts-transforms/src/phases/base.ts#L9)*

**Parameters:**

Name | Type |
------ | ------ |
`opConfig` | [WatcherConfig](../interfaces/watcherconfig.md) |

**Returns:** *[PhaseBase](phasebase.md)*

## Properties

###  hasProcessing

• **hasProcessing**: *boolean*

*Defined in [phases/base.ts:8](https://github.com/terascope/teraslice/blob/7cdb60b1/packages/ts-transforms/src/phases/base.ts#L8)*

___

### `Protected` opConfig

• **opConfig**: *[WatcherConfig](../interfaces/watcherconfig.md)*

*Defined in [phases/base.ts:9](https://github.com/terascope/teraslice/blob/7cdb60b1/packages/ts-transforms/src/phases/base.ts#L9)*

___

###  phase

• **phase**: *[OperationsPipline](../interfaces/operationspipline.md)*

*Defined in [phases/base.ts:7](https://github.com/terascope/teraslice/blob/7cdb60b1/packages/ts-transforms/src/phases/base.ts#L7)*

## Methods

### `Abstract` run

▸ **run**(`data`: *`DataEntity`[]*): *`DataEntity`[]*

*Defined in [phases/base.ts:17](https://github.com/terascope/teraslice/blob/7cdb60b1/packages/ts-transforms/src/phases/base.ts#L17)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | `DataEntity`[] |

**Returns:** *`DataEntity`[]*
