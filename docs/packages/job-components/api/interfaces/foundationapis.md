---
title: Job Components :: FoundationApis
sidebar_label: FoundationApis
---

# Interface: FoundationApis

## Hierarchy

* **FoundationApis**

### Index

#### Methods

* [getConnection](foundationapis.md#getconnection)
* [getSystemEvents](foundationapis.md#getsystemevents)
* [makeLogger](foundationapis.md#makelogger)

## Methods

###  getConnection

▸ **getConnection**(`config`: *[ConnectionConfig](connectionconfig.md)*): *object*

*Defined in [interfaces/context.ts:72](https://github.com/terascope/teraslice/blob/5e4063e2/packages/job-components/src/interfaces/context.ts#L72)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | [ConnectionConfig](connectionconfig.md) |

**Returns:** *object*

___

###  getSystemEvents

▸ **getSystemEvents**(): *`EventEmitter`*

*Defined in [interfaces/context.ts:71](https://github.com/terascope/teraslice/blob/5e4063e2/packages/job-components/src/interfaces/context.ts#L71)*

**Returns:** *`EventEmitter`*

___

###  makeLogger

▸ **makeLogger**(...`params`: *any[]*): *`Logger`*

*Defined in [interfaces/context.ts:70](https://github.com/terascope/teraslice/blob/5e4063e2/packages/job-components/src/interfaces/context.ts#L70)*

**Parameters:**

Name | Type |
------ | ------ |
`...params` | any[] |

**Returns:** *`Logger`*
