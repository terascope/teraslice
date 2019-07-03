---
title: Ts Transforms :: Matcher
sidebar_label: Matcher
---

# Class: Matcher

## Hierarchy

* [PhaseManager](phasemanager.md)

  * **Matcher**

### Index

#### Constructors

* [constructor](matcher.md#constructor)

#### Properties

* [isMatcher](matcher.md#ismatcher)
* [sequence](matcher.md#sequence)

#### Methods

* [init](matcher.md#init)
* [run](matcher.md#run)

## Constructors

###  constructor

\+ **new Matcher**(`opConfig`: *[WatcherConfig](../interfaces/watcherconfig.md)*, `logger`: *`Logger`*): *[Matcher](matcher.md)*

*Overrides [PhaseManager](phasemanager.md).[constructor](phasemanager.md#constructor)*

*Defined in [matcher.ts:7](https://github.com/terascope/teraslice/blob/5e4063e2/packages/ts-transforms/src/matcher.ts#L7)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`opConfig` | [WatcherConfig](../interfaces/watcherconfig.md) | - |
`logger` | `Logger` |  debugLogger('ts-transforms') |

**Returns:** *[Matcher](matcher.md)*

## Properties

###  isMatcher

• **isMatcher**: *boolean*

*Inherited from [PhaseManager](phasemanager.md).[isMatcher](phasemanager.md#ismatcher)*

*Defined in [phases/phase_manager.ts:19](https://github.com/terascope/teraslice/blob/5e4063e2/packages/ts-transforms/src/phases/phase_manager.ts#L19)*

___

###  sequence

• **sequence**: *[PhaseBase](phasebase.md)[]*

*Inherited from [PhaseManager](phasemanager.md).[sequence](phasemanager.md#sequence)*

*Defined in [phases/phase_manager.ts:18](https://github.com/terascope/teraslice/blob/5e4063e2/packages/ts-transforms/src/phases/phase_manager.ts#L18)*

## Methods

###  init

▸ **init**(`Plugins?`: *[PluginList](../overview.md#pluginlist)*): *`Promise<void>`*

*Inherited from [PhaseManager](phasemanager.md).[init](phasemanager.md#init)*

*Defined in [phases/phase_manager.ts:29](https://github.com/terascope/teraslice/blob/5e4063e2/packages/ts-transforms/src/phases/phase_manager.ts#L29)*

**Parameters:**

Name | Type |
------ | ------ |
`Plugins?` | [PluginList](../overview.md#pluginlist) |

**Returns:** *`Promise<void>`*

___

###  run

▸ **run**(`input`: *object[]*): *`DataEntity`[]*

*Inherited from [PhaseManager](phasemanager.md).[run](phasemanager.md#run)*

*Defined in [phases/phase_manager.ts:47](https://github.com/terascope/teraslice/blob/5e4063e2/packages/ts-transforms/src/phases/phase_manager.ts#L47)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | object[] |

**Returns:** *`DataEntity`[]*
