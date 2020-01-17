---
title: Job Components: `ExecutionContextAPI`
sidebar_label: ExecutionContextAPI
---

# Class: ExecutionContextAPI

A utility API exposed on the Terafoundation Context APIs.
The following functionality is included:
 - Registering Operation API
 - Creating an API (usually done from an Operation),
   it also includes attaching the API to the Execution LifeCycle.
   An API will only be created once.
 - Getting a reference to an API

## Hierarchy

* **ExecutionContextAPI**

## Index

### Constructors

* [constructor](executioncontextapi.md#constructor)

### Accessors

* [apis](executioncontextapi.md#apis)
* [registry](executioncontextapi.md#registry)

### Methods

* [addToRegistry](executioncontextapi.md#addtoregistry)
* [getAPI](executioncontextapi.md#getapi)
* [getMetadata](executioncontextapi.md#getmetadata)
* [getObserver](executioncontextapi.md#getobserver)
* [initAPI](executioncontextapi.md#initapi)
* [makeLogger](executioncontextapi.md#makelogger)
* [setMetadata](executioncontextapi.md#setmetadata)

## Constructors

###  constructor

\+ **new ExecutionContextAPI**(`context`: [Context](../interfaces/context.md), `executionConfig`: [ExecutionConfig](../interfaces/executionconfig.md)): *[ExecutionContextAPI](executioncontextapi.md)*

*Defined in [packages/job-components/src/execution-context/api.ts:27](https://github.com/terascope/teraslice/blob/78714a985/packages/job-components/src/execution-context/api.ts#L27)*

**Parameters:**

Name | Type |
------ | ------ |
`context` | [Context](../interfaces/context.md) |
`executionConfig` | [ExecutionConfig](../interfaces/executionconfig.md) |

**Returns:** *[ExecutionContextAPI](executioncontextapi.md)*

## Accessors

###  apis

• **get apis**(): *Readonly‹[JobAPIInstances](../interfaces/jobapiinstances.md)›*

*Defined in [packages/job-components/src/execution-context/api.ts:41](https://github.com/terascope/teraslice/blob/78714a985/packages/job-components/src/execution-context/api.ts#L41)*

**Returns:** *Readonly‹[JobAPIInstances](../interfaces/jobapiinstances.md)›*

___

###  registry

• **get registry**(): *object*

*Defined in [packages/job-components/src/execution-context/api.ts:37](https://github.com/terascope/teraslice/blob/78714a985/packages/job-components/src/execution-context/api.ts#L37)*

For backwards compatibility

**Returns:** *object*

## Methods

###  addToRegistry

▸ **addToRegistry**(`name`: string, `API`: [APIConstructor](../overview.md#apiconstructor)): *void*

*Defined in [packages/job-components/src/execution-context/api.ts:46](https://github.com/terascope/teraslice/blob/78714a985/packages/job-components/src/execution-context/api.ts#L46)*

Add an API constructor to the registry

**Parameters:**

Name | Type |
------ | ------ |
`name` | string |
`API` | [APIConstructor](../overview.md#apiconstructor) |

**Returns:** *void*

___

###  getAPI

▸ **getAPI**<**T**>(`name`: string): *T*

*Defined in [packages/job-components/src/execution-context/api.ts:94](https://github.com/terascope/teraslice/blob/78714a985/packages/job-components/src/execution-context/api.ts#L94)*

Get a reference to a specific operation API,
the must be initialized and created

**Type parameters:**

▪ **T**: *[OpAPI](../overview.md#opapi)*

**Parameters:**

Name | Type |
------ | ------ |
`name` | string |

**Returns:** *T*

___

###  getMetadata

▸ **getMetadata**(`key?`: undefined | string): *Promise‹AnyObject›*

*Defined in [packages/job-components/src/execution-context/api.ts:158](https://github.com/terascope/teraslice/blob/78714a985/packages/job-components/src/execution-context/api.ts#L158)*

**Parameters:**

Name | Type |
------ | ------ |
`key?` | undefined &#124; string |

**Returns:** *Promise‹AnyObject›*

___

###  getObserver

▸ **getObserver**<**T**>(`name`: string): *T*

*Defined in [packages/job-components/src/execution-context/api.ts:79](https://github.com/terascope/teraslice/blob/78714a985/packages/job-components/src/execution-context/api.ts#L79)*

Get a reference to a specific operation API,
the must be initialized and created

**Type parameters:**

▪ **T**: *[Observer](observer.md)*

**Parameters:**

Name | Type |
------ | ------ |
`name` | string |

**Returns:** *T*

___

###  initAPI

▸ **initAPI**<**T**>(`name`: string, ...`params`: any[]): *Promise‹T›*

*Defined in [packages/job-components/src/execution-context/api.ts:111](https://github.com/terascope/teraslice/blob/78714a985/packages/job-components/src/execution-context/api.ts#L111)*

Create an instance of the API

**Type parameters:**

▪ **T**: *[OpAPI](../overview.md#opapi)*

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`name` | string | the name of API to create |
`...params` | any[] | any additional options that the API may need  |

**Returns:** *Promise‹T›*

___

###  makeLogger

▸ **makeLogger**(`moduleName`: string, `extra`: AnyObject): *Logger‹›*

*Defined in [packages/job-components/src/execution-context/api.ts:139](https://github.com/terascope/teraslice/blob/78714a985/packages/job-components/src/execution-context/api.ts#L139)*

Make a logger with a the job_id and ex_id in the logger context

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`moduleName` | string | - |
`extra` | AnyObject |  {} |

**Returns:** *Logger‹›*

___

###  setMetadata

▸ **setMetadata**(`key`: string, `value`: any): *Promise‹void›*

*Defined in [packages/job-components/src/execution-context/api.ts:147](https://github.com/terascope/teraslice/blob/78714a985/packages/job-components/src/execution-context/api.ts#L147)*

Update metadata on the execution context
Only update the metadata after the execution has been initialized

**Parameters:**

Name | Type |
------ | ------ |
`key` | string |
`value` | any |

**Returns:** *Promise‹void›*
