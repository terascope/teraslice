---
title: Ts Transforms: `OutputPhase`
sidebar_label: OutputPhase
---

# Class: OutputPhase

## Hierarchy

* [PhaseBase](phasebase.md)

  * **OutputPhase**

## Index

### Constructors

* [constructor](outputphase.md#constructor)

### Properties

* [hasProcessing](outputphase.md#hasprocessing)
* [opConfig](outputphase.md#protected-opconfig)
* [phase](outputphase.md#phase)

### Methods

* [requiredExtractions](outputphase.md#requiredextractions)
* [run](outputphase.md#run)

## Constructors

###  constructor

\+ **new OutputPhase**(`opConfig`: [WatcherConfig](../interfaces/watcherconfig.md), `outputConfig`: [OutputValidation](../interfaces/outputvalidation.md), `_opsManager`: `OperationsManager`): *[OutputPhase](outputphase.md)*

*Overrides [PhaseBase](phasebase.md).[constructor](phasebase.md#constructor)*

*Defined in [phases/output-phase.ts:13](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/ts-transforms/src/phases/output-phase.ts#L13)*

**Parameters:**

Name | Type |
------ | ------ |
`opConfig` | [WatcherConfig](../interfaces/watcherconfig.md) |
`outputConfig` | [OutputValidation](../interfaces/outputvalidation.md) |
`_opsManager` | `OperationsManager` |

**Returns:** *[OutputPhase](outputphase.md)*

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

## Methods

###  requiredExtractions

▸ **requiredExtractions**(`data`: `DataEntity`[]): *`DataEntity<object>`[]*

*Defined in [phases/output-phase.ts:23](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/ts-transforms/src/phases/output-phase.ts#L23)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | `DataEntity`[] |

**Returns:** *`DataEntity<object>`[]*

___

###  run

▸ **run**(`data`: `DataEntity`[]): *`DataEntity`[]*

*Overrides [PhaseBase](phasebase.md).[run](phasebase.md#abstract-run)*

*Defined in [phases/output-phase.ts:38](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/ts-transforms/src/phases/output-phase.ts#L38)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | `DataEntity`[] |

**Returns:** *`DataEntity`[]*
