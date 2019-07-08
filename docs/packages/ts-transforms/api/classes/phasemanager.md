---
title: Ts Transforms: `PhaseManager`
sidebar_label: PhaseManager
---

# Class: PhaseManager

## Hierarchy

* **PhaseManager**

  * [Transform](transform.md)

  * [Matcher](matcher.md)

### Index

#### Constructors

* [constructor](phasemanager.md#constructor)

#### Properties

* [isMatcher](phasemanager.md#ismatcher)
* [sequence](phasemanager.md#sequence)

#### Methods

* [init](phasemanager.md#init)
* [run](phasemanager.md#run)

## Constructors

###  constructor

\+ **new PhaseManager**(`opConfig`: *[PhaseConfig](../interfaces/phaseconfig.md)*, `logger`: *`Logger`*): *[PhaseManager](phasemanager.md)*

*Defined in [phases/phase_manager.ts:19](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/ts-transforms/src/phases/phase_manager.ts#L19)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`opConfig` | [PhaseConfig](../interfaces/phaseconfig.md) | - |
`logger` | `Logger` |  debugLogger('ts-transforms') |

**Returns:** *[PhaseManager](phasemanager.md)*

## Properties

###  isMatcher

• **isMatcher**: *boolean*

*Defined in [phases/phase_manager.ts:19](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/ts-transforms/src/phases/phase_manager.ts#L19)*

___

###  sequence

• **sequence**: *[PhaseBase](phasebase.md)[]*

*Defined in [phases/phase_manager.ts:18](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/ts-transforms/src/phases/phase_manager.ts#L18)*

## Methods

###  init

▸ **init**(`Plugins?`: *[PluginList](../overview.md#pluginlist)*): *`Promise<void>`*

*Defined in [phases/phase_manager.ts:29](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/ts-transforms/src/phases/phase_manager.ts#L29)*

**Parameters:**

Name | Type |
------ | ------ |
`Plugins?` | [PluginList](../overview.md#pluginlist) |

**Returns:** *`Promise<void>`*

___

###  run

▸ **run**(`input`: *object[]*): *`DataEntity`[]*

*Defined in [phases/phase_manager.ts:47](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/ts-transforms/src/phases/phase_manager.ts#L47)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | object[] |

**Returns:** *`DataEntity`[]*

