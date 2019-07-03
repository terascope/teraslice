---
title: Job Components :: LegacyFoundationApis
sidebar_label: LegacyFoundationApis
---

# Interface: LegacyFoundationApis

## Hierarchy

* **LegacyFoundationApis**

### Index

#### Methods

* [getConnection](legacyfoundationapis.md#getconnection)
* [getEventEmitter](legacyfoundationapis.md#geteventemitter)
* [makeLogger](legacyfoundationapis.md#makelogger)

## Methods

###  getConnection

▸ **getConnection**(`config`: *[ConnectionConfig](connectionconfig.md)*): *object*

*Defined in [interfaces/context.ts:78](https://github.com/terascope/teraslice/blob/b0f73ab9/packages/job-components/src/interfaces/context.ts#L78)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | [ConnectionConfig](connectionconfig.md) |

**Returns:** *object*

___

###  getEventEmitter

▸ **getEventEmitter**(): *`EventEmitter`*

*Defined in [interfaces/context.ts:77](https://github.com/terascope/teraslice/blob/b0f73ab9/packages/job-components/src/interfaces/context.ts#L77)*

**Returns:** *`EventEmitter`*

___

###  makeLogger

▸ **makeLogger**(...`params`: *any[]*): *`Logger`*

*Defined in [interfaces/context.ts:76](https://github.com/terascope/teraslice/blob/b0f73ab9/packages/job-components/src/interfaces/context.ts#L76)*

**Parameters:**

Name | Type |
------ | ------ |
`...params` | any[] |

**Returns:** *`Logger`*

