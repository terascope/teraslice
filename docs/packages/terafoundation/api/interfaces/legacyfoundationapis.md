---
title: Terafoundation: `LegacyFoundationApis`
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
* [startWorkers](legacyfoundationapis.md#startworkers)

## Methods

###  getConnection

▸ **getConnection**(`config`: [ConnectionConfig](connectionconfig.md)): *object*

*Defined in [packages/terafoundation/src/interfaces.ts:56](https://github.com/terascope/teraslice/blob/b843209f9/packages/terafoundation/src/interfaces.ts#L56)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | [ConnectionConfig](connectionconfig.md) |

**Returns:** *object*

___

###  getEventEmitter

▸ **getEventEmitter**(): *EventEmitter*

*Defined in [packages/terafoundation/src/interfaces.ts:55](https://github.com/terascope/teraslice/blob/b843209f9/packages/terafoundation/src/interfaces.ts#L55)*

**Returns:** *EventEmitter*

___

###  makeLogger

▸ **makeLogger**(`metadata?`: Record‹string, string›): *Logger*

*Defined in [packages/terafoundation/src/interfaces.ts:52](https://github.com/terascope/teraslice/blob/b843209f9/packages/terafoundation/src/interfaces.ts#L52)*

Create a child logger

**Parameters:**

Name | Type |
------ | ------ |
`metadata?` | Record‹string, string› |

**Returns:** *Logger*

▸ **makeLogger**(`name`: string, `filename`: string): *Logger*

*Defined in [packages/terafoundation/src/interfaces.ts:54](https://github.com/terascope/teraslice/blob/b843209f9/packages/terafoundation/src/interfaces.ts#L54)*

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

*Defined in [packages/terafoundation/src/interfaces.ts:57](https://github.com/terascope/teraslice/blob/b843209f9/packages/terafoundation/src/interfaces.ts#L57)*

**Parameters:**

Name | Type |
------ | ------ |
`num` | number |
`envOptions` | Record‹string, string› |

**Returns:** *void*
