---
title: Job Components Interfaces Context Foundationapis
sidebar_label: Interfaces Context Foundationapis
---

> Interfaces Context Foundationapis for @terascope/job-components

[Globals](../overview.md) / ["interfaces/context"](../modules/_interfaces_context_.md) / [FoundationApis](_interfaces_context_.foundationapis.md) /

# Interface: FoundationApis

## Hierarchy

* **FoundationApis**

### Index

#### Methods

* [getConnection](_interfaces_context_.foundationapis.md#getconnection)
* [getSystemEvents](_interfaces_context_.foundationapis.md#getsystemevents)
* [makeLogger](_interfaces_context_.foundationapis.md#makelogger)

## Methods

###  getConnection

▸ **getConnection**(`config`: *[ConnectionConfig](_interfaces_context_.connectionconfig.md)*): *object*

*Defined in [interfaces/context.ts:72](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/context.ts#L72)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | [ConnectionConfig](_interfaces_context_.connectionconfig.md) |

**Returns:** *object*

___

###  getSystemEvents

▸ **getSystemEvents**(): *`EventEmitter`*

*Defined in [interfaces/context.ts:71](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/context.ts#L71)*

**Returns:** *`EventEmitter`*

___

###  makeLogger

▸ **makeLogger**(...`params`: *any[]*): *`Logger`*

*Defined in [interfaces/context.ts:70](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/context.ts#L70)*

**Parameters:**

Name | Type |
------ | ------ |
`...params` | any[] |

**Returns:** *`Logger`*
