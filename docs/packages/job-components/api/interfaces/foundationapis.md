---
title: Job Components: `FoundationApis`
sidebar_label: FoundationApis
---

# Interface: FoundationApis

## Hierarchy

* **FoundationApis**

## Index

### Methods

* [getConnection](foundationapis.md#getconnection)
* [getSystemEvents](foundationapis.md#getsystemevents)
* [makeLogger](foundationapis.md#makelogger)

## Methods

###  getConnection

▸ **getConnection**(`config`: [ConnectionConfig](connectionconfig.md)): *object*

*Defined in [interfaces/context.ts:77](https://github.com/terascope/teraslice/blob/d2d877b60/packages/job-components/src/interfaces/context.ts#L77)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | [ConnectionConfig](connectionconfig.md) |

**Returns:** *object*

___

###  getSystemEvents

▸ **getSystemEvents**(): *EventEmitter*

*Defined in [interfaces/context.ts:76](https://github.com/terascope/teraslice/blob/d2d877b60/packages/job-components/src/interfaces/context.ts#L76)*

**Returns:** *EventEmitter*

___

###  makeLogger

▸ **makeLogger**(...`params`: any[]): *Logger*

*Defined in [interfaces/context.ts:75](https://github.com/terascope/teraslice/blob/d2d877b60/packages/job-components/src/interfaces/context.ts#L75)*

**Parameters:**

Name | Type |
------ | ------ |
`...params` | any[] |

**Returns:** *Logger*
