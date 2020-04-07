---
title: TS Transforms: `PhaseManager`
sidebar_label: PhaseManager
---

# Class: PhaseManager

## Hierarchy

* **PhaseManager**

  ↳ [Transform](transform.md)

  ↳ [Matcher](matcher.md)

## Index

### Constructors

* [constructor](phasemanager.md#constructor)

### Properties

* [isMatcher](phasemanager.md#ismatcher)
* [sequence](phasemanager.md#sequence)

### Methods

* [init](phasemanager.md#init)
* [run](phasemanager.md#run)

## Constructors

###  constructor

\+ **new PhaseManager**(`opConfig`: [PhaseConfig](../interfaces/phaseconfig.md), `logger`: Logger): *[PhaseManager](phasemanager.md)*

*Defined in [phases/phase-manager.ts:17](https://github.com/terascope/teraslice/blob/f95bb5556/packages/ts-transforms/src/phases/phase-manager.ts#L17)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`opConfig` | [PhaseConfig](../interfaces/phaseconfig.md) | - |
`logger` | Logger |  debugLogger('ts-transforms') |

**Returns:** *[PhaseManager](phasemanager.md)*

## Properties

###  isMatcher

• **isMatcher**: *boolean*

*Defined in [phases/phase-manager.ts:17](https://github.com/terascope/teraslice/blob/f95bb5556/packages/ts-transforms/src/phases/phase-manager.ts#L17)*

___

###  sequence

• **sequence**: *[PhaseBase](phasebase.md)[]*

*Defined in [phases/phase-manager.ts:16](https://github.com/terascope/teraslice/blob/f95bb5556/packages/ts-transforms/src/phases/phase-manager.ts#L16)*

## Methods

###  init

▸ **init**(`Plugins?`: [PluginList](../overview.md#pluginlist)): *Promise‹void›*

*Defined in [phases/phase-manager.ts:27](https://github.com/terascope/teraslice/blob/f95bb5556/packages/ts-transforms/src/phases/phase-manager.ts#L27)*

**Parameters:**

Name | Type |
------ | ------ |
`Plugins?` | [PluginList](../overview.md#pluginlist) |

**Returns:** *Promise‹void›*

___

###  run

▸ **run**(`input`: object[]): *DataEntity[]*

*Defined in [phases/phase-manager.ts:58](https://github.com/terascope/teraslice/blob/f95bb5556/packages/ts-transforms/src/phases/phase-manager.ts#L58)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | object[] |

**Returns:** *DataEntity[]*
