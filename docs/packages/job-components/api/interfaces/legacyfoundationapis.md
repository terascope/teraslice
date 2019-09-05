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

*Defined in [interfaces/context.ts:83](https://github.com/terascope/teraslice/blob/0ae31df4/packages/job-components/src/interfaces/context.ts#L83)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | [ConnectionConfig](connectionconfig.md) |

**Returns:** *object*

___

###  getEventEmitter

▸ **getEventEmitter**(): *EventEmitter*

*Defined in [interfaces/context.ts:82](https://github.com/terascope/teraslice/blob/0ae31df4/packages/job-components/src/interfaces/context.ts#L82)*

**Returns:** *EventEmitter*

___

###  makeLogger

▸ **makeLogger**(...`params`: any[]): *Logger*

*Defined in [interfaces/context.ts:81](https://github.com/terascope/teraslice/blob/0ae31df4/packages/job-components/src/interfaces/context.ts#L81)*

**Parameters:**

Name | Type |
------ | ------ |
`...params` | any[] |

**Returns:** *Logger*
