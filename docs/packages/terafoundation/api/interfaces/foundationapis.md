---
title: Terafoundation: `FoundationAPIs`
sidebar_label: FoundationAPIs
---

# Interface: FoundationAPIs

## Hierarchy

* **FoundationAPIs**

## Index

### Methods

* [getConnection](foundationapis.md#getconnection)
* [getSystemEvents](foundationapis.md#getsystemevents)
* [makeLogger](foundationapis.md#makelogger)
* [startWorkers](foundationapis.md#startworkers)

## Methods

###  getConnection

▸ **getConnection**(`config`: [ConnectionConfig](connectionconfig.md)): *object*

*Defined in [packages/terafoundation/src/interfaces.ts:46](https://github.com/terascope/teraslice/blob/78714a985/packages/terafoundation/src/interfaces.ts#L46)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | [ConnectionConfig](connectionconfig.md) |

**Returns:** *object*

___

###  getSystemEvents

▸ **getSystemEvents**(): *EventEmitter*

*Defined in [packages/terafoundation/src/interfaces.ts:45](https://github.com/terascope/teraslice/blob/78714a985/packages/terafoundation/src/interfaces.ts#L45)*

**Returns:** *EventEmitter*

___

###  makeLogger

▸ **makeLogger**(`metadata?`: Record‹string, string›): *Logger*

*Defined in [packages/terafoundation/src/interfaces.ts:42](https://github.com/terascope/teraslice/blob/78714a985/packages/terafoundation/src/interfaces.ts#L42)*

Create a child logger

**Parameters:**

Name | Type |
------ | ------ |
`metadata?` | Record‹string, string› |

**Returns:** *Logger*

▸ **makeLogger**(`name`: string, `filename`: string): *Logger*

*Defined in [packages/terafoundation/src/interfaces.ts:44](https://github.com/terascope/teraslice/blob/78714a985/packages/terafoundation/src/interfaces.ts#L44)*

Create the root logger (usually done automatically)

**Parameters:**

Name | Type |
------ | ------ |
`name` | string |
`filename` | string |

**Returns:** *Logger*

___

###  startWorkers

▸ **startWorkers**(`num`: number, `envOptions`: Record‹string, string›): *void*

*Defined in [packages/terafoundation/src/interfaces.ts:47](https://github.com/terascope/teraslice/blob/78714a985/packages/terafoundation/src/interfaces.ts#L47)*

**Parameters:**

Name | Type |
------ | ------ |
`num` | number |
`envOptions` | Record‹string, string› |

**Returns:** *void*
