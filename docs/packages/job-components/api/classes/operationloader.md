---
title: Job Components :: OperationLoader
sidebar_label: OperationLoader
---

# Class: OperationLoader

## Hierarchy

* **OperationLoader**

### Index

#### Constructors

* [constructor](operationloader.md#constructor)

#### Methods

* [find](operationloader.md#find)
* [load](operationloader.md#load)
* [loadAPI](operationloader.md#loadapi)
* [loadProcessor](operationloader.md#loadprocessor)
* [loadReader](operationloader.md#loadreader)

## Constructors

###  constructor

\+ **new OperationLoader**(`options`: *[LoaderOptions](../interfaces/loaderoptions.md)*): *[OperationLoader](operationloader.md)*

*Defined in [operation-loader.ts:28](https://github.com/terascope/teraslice/blob/7cdb60b1/packages/job-components/src/operation-loader.ts#L28)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`options` | [LoaderOptions](../interfaces/loaderoptions.md) |  {} |

**Returns:** *[OperationLoader](operationloader.md)*

## Methods

###  find

▸ **find**(`name`: *string*, `assetIds?`: *string[]*): *string | null*

*Defined in [operation-loader.ts:35](https://github.com/terascope/teraslice/blob/7cdb60b1/packages/job-components/src/operation-loader.ts#L35)*

**Parameters:**

Name | Type |
------ | ------ |
`name` | string |
`assetIds?` | string[] |

**Returns:** *string | null*

___

###  load

▸ **load**(`name`: *string*, `assetIds?`: *string[]*): *[LegacyOperation](../interfaces/legacyoperation.md)*

*Defined in [operation-loader.ts:74](https://github.com/terascope/teraslice/blob/7cdb60b1/packages/job-components/src/operation-loader.ts#L74)*

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

▸ **loadAPI**(`name`: *string*, `assetIds?`: *string[]*): *[APIModule](../interfaces/apimodule.md)*

*Defined in [operation-loader.ts:165](https://github.com/terascope/teraslice/blob/7cdb60b1/packages/job-components/src/operation-loader.ts#L165)*

**Parameters:**

Name | Type |
------ | ------ |
`name` | string |
`assetIds?` | string[] |

**Returns:** *[APIModule](../interfaces/apimodule.md)*

___

###  loadProcessor

▸ **loadProcessor**(`name`: *string*, `assetIds?`: *string[]*): *[ProcessorModule](../interfaces/processormodule.md)*

*Defined in [operation-loader.ts:84](https://github.com/terascope/teraslice/blob/7cdb60b1/packages/job-components/src/operation-loader.ts#L84)*

**Parameters:**

Name | Type |
------ | ------ |
`name` | string |
`assetIds?` | string[] |

**Returns:** *[ProcessorModule](../interfaces/processormodule.md)*

___

###  loadReader

▸ **loadReader**(`name`: *string*, `assetIds?`: *string[]*): *[ReaderModule](../interfaces/readermodule.md)*

*Defined in [operation-loader.ts:120](https://github.com/terascope/teraslice/blob/7cdb60b1/packages/job-components/src/operation-loader.ts#L120)*

**Parameters:**

Name | Type |
------ | ------ |
`name` | string |
`assetIds?` | string[] |

**Returns:** *[ReaderModule](../interfaces/readermodule.md)*
