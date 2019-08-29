---
title: Job Components: `OperationLoader`
sidebar_label: OperationLoader
---

# Class: OperationLoader

## Hierarchy

* **OperationLoader**

## Index

### Constructors

* [constructor](operationloader.md#constructor)

### Methods

* [find](operationloader.md#find)
* [load](operationloader.md#load)
* [loadAPI](operationloader.md#loadapi)
* [loadProcessor](operationloader.md#loadprocessor)
* [loadReader](operationloader.md#loadreader)

## Constructors

###  constructor

\+ **new OperationLoader**(`options`: [LoaderOptions](../interfaces/loaderoptions.md)): *[OperationLoader](operationloader.md)*

*Defined in [operation-loader.ts:29](https://github.com/terascope/teraslice/blob/d2d877b60/packages/job-components/src/operation-loader.ts#L29)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`options` | [LoaderOptions](../interfaces/loaderoptions.md) |  {} |

**Returns:** *[OperationLoader](operationloader.md)*

## Methods

###  find

▸ **find**(`name`: string, `assetIds?`: string[]): *string | null*

*Defined in [operation-loader.ts:36](https://github.com/terascope/teraslice/blob/d2d877b60/packages/job-components/src/operation-loader.ts#L36)*

**Parameters:**

Name | Type |
------ | ------ |
`name` | string |
`assetIds?` | string[] |

**Returns:** *string | null*

___

###  load

▸ **load**(`name`: string, `assetIds?`: string[]): *[LegacyOperation](../interfaces/legacyoperation.md)*

*Defined in [operation-loader.ts:75](https://github.com/terascope/teraslice/blob/d2d877b60/packages/job-components/src/operation-loader.ts#L75)*

Load any LegacyOperation
DEPRECATED to accommadate for new Job APIs,
use loadReader, or loadProcessor

**Parameters:**

Name | Type |
------ | ------ |
`name` | string |
`assetIds?` | string[] |

**Returns:** *[LegacyOperation](../interfaces/legacyoperation.md)*

___

###  loadAPI

▸ **loadAPI**(`name`: string, `assetIds?`: string[]): *[APIModule](../interfaces/apimodule.md)*

*Defined in [operation-loader.ts:170](https://github.com/terascope/teraslice/blob/d2d877b60/packages/job-components/src/operation-loader.ts#L170)*

**Parameters:**

Name | Type |
------ | ------ |
`name` | string |
`assetIds?` | string[] |

**Returns:** *[APIModule](../interfaces/apimodule.md)*

___

###  loadProcessor

▸ **loadProcessor**(`name`: string, `assetIds?`: string[]): *[ProcessorModule](../interfaces/processormodule.md)*

*Defined in [operation-loader.ts:85](https://github.com/terascope/teraslice/blob/d2d877b60/packages/job-components/src/operation-loader.ts#L85)*

**Parameters:**

Name | Type |
------ | ------ |
`name` | string |
`assetIds?` | string[] |

**Returns:** *[ProcessorModule](../interfaces/processormodule.md)*

___

###  loadReader

▸ **loadReader**(`name`: string, `assetIds?`: string[]): *[ReaderModule](../interfaces/readermodule.md)*

*Defined in [operation-loader.ts:123](https://github.com/terascope/teraslice/blob/d2d877b60/packages/job-components/src/operation-loader.ts#L123)*

**Parameters:**

Name | Type |
------ | ------ |
`name` | string |
`assetIds?` | string[] |

**Returns:** *[ReaderModule](../interfaces/readermodule.md)*
