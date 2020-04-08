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

*Defined in [packages/job-components/src/interfaces/context.ts:83](https://github.com/terascope/teraslice/blob/b843209f9/packages/job-components/src/interfaces/context.ts#L83)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | [ConnectionConfig](connectionconfig.md) |

**Returns:** *object*

___

###  getSystemEvents

▸ **getSystemEvents**(): *EventEmitter*

*Defined in [packages/job-components/src/interfaces/context.ts:82](https://github.com/terascope/teraslice/blob/b843209f9/packages/job-components/src/interfaces/context.ts#L82)*

**Returns:** *EventEmitter*

___

###  makeLogger

▸ **makeLogger**(...`params`: any[]): *Logger*

*Defined in [packages/job-components/src/interfaces/context.ts:81](https://github.com/terascope/teraslice/blob/b843209f9/packages/job-components/src/interfaces/context.ts#L81)*

**Parameters:**

Name | Type |
------ | ------ |
`...params` | any[] |

**Returns:** *Logger*
