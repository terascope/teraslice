---
title: Job Components Operation Loader Operationloader
sidebar_label: Operation Loader Operationloader
---

> Operation Loader Operationloader for @terascope/job-components

[Globals](../overview.md) / ["operation-loader"](../modules/_operation_loader_.md) / [OperationLoader](_operation_loader_.operationloader.md) /

# Class: OperationLoader

## Hierarchy

* **OperationLoader**

### Index

#### Constructors

* [constructor](_operation_loader_.operationloader.md#constructor)

#### Methods

* [find](_operation_loader_.operationloader.md#find)
* [load](_operation_loader_.operationloader.md#load)
* [loadAPI](_operation_loader_.operationloader.md#loadapi)
* [loadProcessor](_operation_loader_.operationloader.md#loadprocessor)
* [loadReader](_operation_loader_.operationloader.md#loadreader)

## Constructors

###  constructor

\+ **new OperationLoader**(`options`: *[LoaderOptions](../interfaces/_operation_loader_.loaderoptions.md)*): *[OperationLoader](_operation_loader_.operationloader.md)*

*Defined in [operation-loader.ts:28](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operation-loader.ts#L28)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`options` | [LoaderOptions](../interfaces/_operation_loader_.loaderoptions.md) |  {} |

**Returns:** *[OperationLoader](_operation_loader_.operationloader.md)*

## Methods

###  find

▸ **find**(`name`: *string*, `assetIds?`: *string[]*): *string | null*

*Defined in [operation-loader.ts:35](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operation-loader.ts#L35)*

**Parameters:**

Name | Type |
------ | ------ |
`name` | string |
`assetIds?` | string[] |

**Returns:** *string | null*

___

###  load

▸ **load**(`name`: *string*, `assetIds?`: *string[]*): *[LegacyOperation](../interfaces/_interfaces_operations_.legacyoperation.md)*

*Defined in [operation-loader.ts:74](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operation-loader.ts#L74)*

Load any LegacyOperation
DEPRECATED to accommadate for new Job APIs,
use loadReader, or loadProcessor

**Parameters:**

Name | Type |
------ | ------ |
`name` | string |
`assetIds?` | string[] |

**Returns:** *[LegacyOperation](../interfaces/_interfaces_operations_.legacyoperation.md)*

___

###  loadAPI

▸ **loadAPI**(`name`: *string*, `assetIds?`: *string[]*): *[APIModule](../interfaces/_operations_interfaces_.apimodule.md)*

*Defined in [operation-loader.ts:165](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operation-loader.ts#L165)*

**Parameters:**

Name | Type |
------ | ------ |
`name` | string |
`assetIds?` | string[] |

**Returns:** *[APIModule](../interfaces/_operations_interfaces_.apimodule.md)*

___

###  loadProcessor

▸ **loadProcessor**(`name`: *string*, `assetIds?`: *string[]*): *[ProcessorModule](../interfaces/_operations_interfaces_.processormodule.md)*

*Defined in [operation-loader.ts:84](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operation-loader.ts#L84)*

**Parameters:**

Name | Type |
------ | ------ |
`name` | string |
`assetIds?` | string[] |

**Returns:** *[ProcessorModule](../interfaces/_operations_interfaces_.processormodule.md)*

___

###  loadReader

▸ **loadReader**(`name`: *string*, `assetIds?`: *string[]*): *[ReaderModule](../interfaces/_operations_interfaces_.readermodule.md)*

*Defined in [operation-loader.ts:120](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operation-loader.ts#L120)*

**Parameters:**

Name | Type |
------ | ------ |
`name` | string |
`assetIds?` | string[] |

**Returns:** *[ReaderModule](../interfaces/_operations_interfaces_.readermodule.md)*
