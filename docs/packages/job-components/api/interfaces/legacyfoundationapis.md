---
title: Job Components: `LegacyFoundationApis`
sidebar_label: LegacyFoundationApis
---

# Interface: LegacyFoundationApis

## Hierarchy

* **LegacyFoundationApis**

## Index

### Methods

* [getConnection](legacyfoundationapis.md#getconnection)
* [getEventEmitter](legacyfoundationapis.md#geteventemitter)
* [makeLogger](legacyfoundationapis.md#makelogger)

## Methods

###  getConnection

▸ **getConnection**(`config`: [ConnectionConfig](connectionconfig.md)): *object*

*Defined in [packages/job-components/src/interfaces/context.ts:89](https://github.com/terascope/teraslice/blob/78714a985/packages/job-components/src/interfaces/context.ts#L89)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | [ConnectionConfig](connectionconfig.md) |

**Returns:** *object*

___

###  getEventEmitter

▸ **getEventEmitter**(): *EventEmitter*

*Defined in [packages/job-components/src/interfaces/context.ts:88](https://github.com/terascope/teraslice/blob/78714a985/packages/job-components/src/interfaces/context.ts#L88)*

**Returns:** *EventEmitter*

___

###  makeLogger

▸ **makeLogger**(...`params`: any[]): *Logger*

*Defined in [packages/job-components/src/interfaces/context.ts:87](https://github.com/terascope/teraslice/blob/78714a985/packages/job-components/src/interfaces/context.ts#L87)*

**Parameters:**

Name | Type |
------ | ------ |
`...params` | any[] |

**Returns:** *Logger*
