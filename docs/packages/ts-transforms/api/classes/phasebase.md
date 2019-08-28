---
title: Ts Transforms: `PhaseBase`
sidebar_label: PhaseBase
---

# Class: PhaseBase

## Hierarchy

* **PhaseBase**

  * [SelectionPhase](selectionphase.md)

  * [ExtractionPhase](extractionphase.md)

  * [PostProcessPhase](postprocessphase.md)

  * [OutputPhase](outputphase.md)

## Index

### Constructors

* [constructor](phasebase.md#constructor)

### Properties

* [hasProcessing](phasebase.md#hasprocessing)
* [opConfig](phasebase.md#protected-opconfig)
* [phase](phasebase.md#phase)

### Methods

* [run](phasebase.md#abstract-run)

## Constructors

###  constructor

\+ **new PhaseBase**(`opConfig`: [WatcherConfig](../interfaces/watcherconfig.md)): *[PhaseBase](phasebase.md)*

*Defined in [phases/base.ts:7](https://github.com/terascope/teraslice/blob/d2d877b60/packages/ts-transforms/src/phases/base.ts#L7)*

**Parameters:**

Name | Type |
------ | ------ |
`opConfig` | [WatcherConfig](../interfaces/watcherconfig.md) |

**Returns:** *[PhaseBase](phasebase.md)*

## Properties

###  hasProcessing

• **hasProcessing**: *boolean*

*Defined in [phases/base.ts:6](https://github.com/terascope/teraslice/blob/d2d877b60/packages/ts-transforms/src/phases/base.ts#L6)*

___

### `Protected` opConfig

• **opConfig**: *[WatcherConfig](../interfaces/watcherconfig.md)*

*Defined in [phases/base.ts:7](https://github.com/terascope/teraslice/blob/d2d877b60/packages/ts-transforms/src/phases/base.ts#L7)*

___

###  phase

• **phase**: *[OperationsPipline](../interfaces/operationspipline.md)*

*Defined in [phases/base.ts:5](https://github.com/terascope/teraslice/blob/d2d877b60/packages/ts-transforms/src/phases/base.ts#L5)*

## Methods

### `Abstract` run

▸ **run**(`data`: DataEntity[]): *DataEntity[]*

*Defined in [phases/base.ts:15](https://github.com/terascope/teraslice/blob/d2d877b60/packages/ts-transforms/src/phases/base.ts#L15)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | DataEntity[] |

**Returns:** *DataEntity[]*
