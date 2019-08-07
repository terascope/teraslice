---
title: Ts Transforms: `SelectionPhase`
sidebar_label: SelectionPhase
---

# Class: SelectionPhase

## Hierarchy

* [PhaseBase](phasebase.md)

  * **SelectionPhase**

## Index

### Constructors

* [constructor](selectionphase.md#constructor)

### Properties

* [hasProcessing](selectionphase.md#hasprocessing)
* [opConfig](selectionphase.md#protected-opconfig)
* [phase](selectionphase.md#phase)
* [selectionPhase](selectionphase.md#selectionphase)

### Methods

* [run](selectionphase.md#run)

## Constructors

###  constructor

\+ **new SelectionPhase**(`opConfig`: [WatcherConfig](../interfaces/watcherconfig.md), `selectorList`: [SelectorConfig](../interfaces/selectorconfig.md)[], `opsManager`: `OperationsManager`): *[SelectionPhase](selectionphase.md)*

*Overrides [PhaseBase](phasebase.md).[constructor](phasebase.md#constructor)*

*Defined in [phases/selector-phase.ts:9](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/ts-transforms/src/phases/selector-phase.ts#L9)*

**Parameters:**

Name | Type |
------ | ------ |
`opConfig` | [WatcherConfig](../interfaces/watcherconfig.md) |
`selectorList` | [SelectorConfig](../interfaces/selectorconfig.md)[] |
`opsManager` | `OperationsManager` |

**Returns:** *[SelectionPhase](selectionphase.md)*

## Properties

###  hasProcessing

• **hasProcessing**: *boolean*

*Inherited from [PhaseBase](phasebase.md).[hasProcessing](phasebase.md#hasprocessing)*

*Defined in [phases/base.ts:8](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/ts-transforms/src/phases/base.ts#L8)*

___

### `Protected` opConfig

• **opConfig**: *[WatcherConfig](../interfaces/watcherconfig.md)*

*Inherited from [PhaseBase](phasebase.md).[opConfig](phasebase.md#protected-opconfig)*

*Defined in [phases/base.ts:9](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/ts-transforms/src/phases/base.ts#L9)*

___

###  phase

• **phase**: *[OperationsPipline](../interfaces/operationspipline.md)*

*Inherited from [PhaseBase](phasebase.md).[phase](phasebase.md#phase)*

*Defined in [phases/base.ts:7](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/ts-transforms/src/phases/base.ts#L7)*

___

###  selectionPhase

• **selectionPhase**: *[Operation](../interfaces/operation.md)[]*

*Defined in [phases/selector-phase.ts:9](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/ts-transforms/src/phases/selector-phase.ts#L9)*

## Methods

###  run

▸ **run**(`data`: `DataEntity`[]): *`DataEntity`[]*

*Overrides [PhaseBase](phasebase.md).[run](phasebase.md#abstract-run)*

*Defined in [phases/selector-phase.ts:18](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/ts-transforms/src/phases/selector-phase.ts#L18)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | `DataEntity`[] |

**Returns:** *`DataEntity`[]*
