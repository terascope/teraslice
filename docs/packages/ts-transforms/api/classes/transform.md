---
title: TS Transforms: `Transform`
sidebar_label: Transform
---

# Class: Transform

## Hierarchy

* [PhaseManager](phasemanager.md)

  ↳ **Transform**

## Index

### Constructors

* [constructor](transform.md#constructor)

### Properties

* [isMatcher](transform.md#ismatcher)
* [sequence](transform.md#sequence)

### Methods

* [init](transform.md#init)
* [run](transform.md#run)

## Constructors

###  constructor

\+ **new Transform**(`opConfig`: [WatcherConfig](../interfaces/watcherconfig.md), `logger`: Logger): *[Transform](transform.md)*

*Overrides [PhaseManager](phasemanager.md).[constructor](phasemanager.md#constructor)*

*Defined in [transform.ts:5](https://github.com/terascope/teraslice/blob/78714a985/packages/ts-transforms/src/transform.ts#L5)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`opConfig` | [WatcherConfig](../interfaces/watcherconfig.md) | - |
`logger` | Logger |  debugLogger('ts-transforms') |

**Returns:** *[Transform](transform.md)*

## Properties

###  isMatcher

• **isMatcher**: *boolean*

*Inherited from [PhaseManager](phasemanager.md).[isMatcher](phasemanager.md#ismatcher)*

*Defined in [phases/phase-manager.ts:17](https://github.com/terascope/teraslice/blob/78714a985/packages/ts-transforms/src/phases/phase-manager.ts#L17)*

___

###  sequence

• **sequence**: *[PhaseBase](phasebase.md)[]*

*Inherited from [PhaseManager](phasemanager.md).[sequence](phasemanager.md#sequence)*

*Defined in [phases/phase-manager.ts:16](https://github.com/terascope/teraslice/blob/78714a985/packages/ts-transforms/src/phases/phase-manager.ts#L16)*

## Methods

###  init

▸ **init**(`Plugins?`: [PluginList](../overview.md#pluginlist)): *Promise‹void›*

*Inherited from [PhaseManager](phasemanager.md).[init](phasemanager.md#init)*

*Defined in [phases/phase-manager.ts:27](https://github.com/terascope/teraslice/blob/78714a985/packages/ts-transforms/src/phases/phase-manager.ts#L27)*

**Parameters:**

Name | Type |
------ | ------ |
`Plugins?` | [PluginList](../overview.md#pluginlist) |

**Returns:** *Promise‹void›*

___

###  run

▸ **run**(`input`: object[]): *DataEntity[]*

*Inherited from [PhaseManager](phasemanager.md).[run](phasemanager.md#run)*

*Defined in [phases/phase-manager.ts:45](https://github.com/terascope/teraslice/blob/78714a985/packages/ts-transforms/src/phases/phase-manager.ts#L45)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | object[] |

**Returns:** *DataEntity[]*
