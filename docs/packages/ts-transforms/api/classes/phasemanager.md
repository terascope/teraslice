---
title: Ts Transforms: `PhaseManager`
sidebar_label: PhaseManager
---

# Class: PhaseManager

## Hierarchy

* **PhaseManager**

  * [Transform](transform.md)

  * [Matcher](matcher.md)

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

\+ **new PhaseManager**(`opConfig`: [PhaseConfig](../interfaces/phaseconfig.md), `logger`: `Logger`): *[PhaseManager](phasemanager.md)*

*Defined in [phases/phase-manager.ts:18](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/ts-transforms/src/phases/phase-manager.ts#L18)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`opConfig` | [PhaseConfig](../interfaces/phaseconfig.md) | - |
`logger` | `Logger` |  debugLogger('ts-transforms') |

**Returns:** *[PhaseManager](phasemanager.md)*

## Properties

###  isMatcher

• **isMatcher**: *boolean*

*Defined in [phases/phase-manager.ts:18](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/ts-transforms/src/phases/phase-manager.ts#L18)*

___

###  sequence

• **sequence**: *[PhaseBase](phasebase.md)[]*

*Defined in [phases/phase-manager.ts:17](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/ts-transforms/src/phases/phase-manager.ts#L17)*

## Methods

###  init

▸ **init**(`Plugins?`: [PluginList](../overview.md#pluginlist)): *`Promise<void>`*

*Defined in [phases/phase-manager.ts:28](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/ts-transforms/src/phases/phase-manager.ts#L28)*

**Parameters:**

Name | Type |
------ | ------ |
`Plugins?` | [PluginList](../overview.md#pluginlist) |

**Returns:** *`Promise<void>`*

___

###  run

▸ **run**(`input`: object[]): *`DataEntity`[]*

*Defined in [phases/phase-manager.ts:44](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/ts-transforms/src/phases/phase-manager.ts#L44)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | object[] |

**Returns:** *`DataEntity`[]*
