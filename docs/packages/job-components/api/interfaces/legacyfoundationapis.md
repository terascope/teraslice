---
title: Job Components Legacyfoundationapis
sidebar_label: Legacyfoundationapis
---

[LegacyFoundationApis](legacyfoundationapis.md) /

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

*Defined in [src/interfaces/context.ts:78](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/interfaces/context.ts#L78)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | [ConnectionConfig](connectionconfig.md) |

**Returns:** *object*

___

###  getEventEmitter

▸ **getEventEmitter**(): *`EventEmitter`*

*Defined in [src/interfaces/context.ts:77](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/interfaces/context.ts#L77)*

**Returns:** *`EventEmitter`*

___

###  makeLogger

▸ **makeLogger**(...`params`: *any[]*): *`Logger`*

*Defined in [src/interfaces/context.ts:76](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/interfaces/context.ts#L76)*

**Parameters:**

Name | Type |
------ | ------ |
`...params` | any[] |

**Returns:** *`Logger`*
