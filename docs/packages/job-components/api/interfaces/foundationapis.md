---
title: Job Components Foundationapis
sidebar_label: Foundationapis
---

[FoundationApis](foundationapis.md) /

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

*Defined in [src/interfaces/context.ts:72](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/interfaces/context.ts#L72)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | [ConnectionConfig](connectionconfig.md) |

**Returns:** *object*

___

###  getSystemEvents

▸ **getSystemEvents**(): *`EventEmitter`*

*Defined in [src/interfaces/context.ts:71](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/interfaces/context.ts#L71)*

**Returns:** *`EventEmitter`*

___

###  makeLogger

▸ **makeLogger**(...`params`: *any[]*): *`Logger`*

*Defined in [src/interfaces/context.ts:70](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/interfaces/context.ts#L70)*

**Parameters:**

Name | Type |
------ | ------ |
`...params` | any[] |

**Returns:** *`Logger`*
