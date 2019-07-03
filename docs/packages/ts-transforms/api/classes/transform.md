---
title: Ts Transforms :: Transform
sidebar_label: Transform
---

# Class: Transform

## Hierarchy

* [PhaseManager](phasemanager.md)

  * **Transform**

### Index

#### Constructors

* [constructor](transform.md#constructor)

#### Properties

* [isMatcher](transform.md#ismatcher)
* [sequence](transform.md#sequence)

#### Methods

* [init](transform.md#init)
* [run](transform.md#run)

## Constructors

###  constructor

\+ **new Transform**(`opConfig`: *[WatcherConfig](../interfaces/watcherconfig.md)*, `logger`: *`Logger`*): *[Transform](transform.md)*

*Overrides [PhaseManager](phasemanager.md).[constructor](phasemanager.md#constructor)*

*Defined in [transform.ts:7](https://github.com/terascope/teraslice/blob/7cdb60b1/packages/ts-transforms/src/transform.ts#L7)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`opConfig` | [WatcherConfig](../interfaces/watcherconfig.md) | - |
`logger` | `Logger` |  debugLogger('ts-transforms') |

**Returns:** *[Transform](transform.md)*

## Properties

###  isMatcher

• **isMatcher**: *boolean*

*Inherited from [PhaseManager](phasemanager.md).[isMatcher](phasemanager.md#ismatcher)*

*Defined in [phases/phase_manager.ts:19](https://github.com/terascope/teraslice/blob/7cdb60b1/packages/ts-transforms/src/phases/phase_manager.ts#L19)*

___

###  sequence

• **sequence**: *[PhaseBase](phasebase.md)[]*

*Inherited from [PhaseManager](phasemanager.md).[sequence](phasemanager.md#sequence)*

*Defined in [phases/phase_manager.ts:18](https://github.com/terascope/teraslice/blob/7cdb60b1/packages/ts-transforms/src/phases/phase_manager.ts#L18)*

## Methods

###  init

▸ **init**(`Plugins?`: *[PluginList](../overview.md#pluginlist)*): *`Promise<void>`*

*Inherited from [PhaseManager](phasemanager.md).[init](phasemanager.md#init)*

*Defined in [phases/phase_manager.ts:29](https://github.com/terascope/teraslice/blob/7cdb60b1/packages/ts-transforms/src/phases/phase_manager.ts#L29)*

**Parameters:**

Name | Type |
------ | ------ |
`Plugins?` | [PluginList](../overview.md#pluginlist) |

**Returns:** *`Promise<void>`*

___

###  run

▸ **run**(`input`: *object[]*): *`DataEntity`[]*

*Inherited from [PhaseManager](phasemanager.md).[run](phasemanager.md#run)*

*Defined in [phases/phase_manager.ts:47](https://github.com/terascope/teraslice/blob/7cdb60b1/packages/ts-transforms/src/phases/phase_manager.ts#L47)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | object[] |

**Returns:** *`DataEntity`[]*
