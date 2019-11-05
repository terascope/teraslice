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
* [getObserver](executioncontextapi.md#getobserver)
* [initAPI](executioncontextapi.md#initapi)
* [makeLogger](executioncontextapi.md#makelogger)

## Constructors

###  constructor

\+ **new ExecutionContextAPI**(`context`: [Context](../interfaces/context.md), `executionConfig`: [ExecutionConfig](../interfaces/executionconfig.md)): *[ExecutionContextAPI](executioncontextapi.md)*

*Defined in [execution-context/api.ts:25](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/execution-context/api.ts#L25)*

**Parameters:**

Name | Type |
------ | ------ |
`context` | [Context](../interfaces/context.md) |
`executionConfig` | [ExecutionConfig](../interfaces/executionconfig.md) |

**Returns:** *[ExecutionContextAPI](executioncontextapi.md)*

## Accessors

###  apis

• **get apis**(): *Readonly‹[JobAPIInstances](../interfaces/jobapiinstances.md)›*

*Defined in [execution-context/api.ts:39](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/execution-context/api.ts#L39)*

**Returns:** *Readonly‹[JobAPIInstances](../interfaces/jobapiinstances.md)›*

___

###  registry

• **get registry**(): *object*

*Defined in [execution-context/api.ts:35](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/execution-context/api.ts#L35)*

For backwards compatibility

**Returns:** *object*

## Methods

###  addToRegistry

▸ **addToRegistry**(`name`: string, `API`: [APIConstructor](../overview.md#apiconstructor)): *void*

*Defined in [execution-context/api.ts:44](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/execution-context/api.ts#L44)*

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

*Defined in [execution-context/api.ts:92](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/execution-context/api.ts#L92)*

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

###  getObserver

▸ **getObserver**<**T**>(`name`: string): *T*

*Defined in [execution-context/api.ts:77](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/execution-context/api.ts#L77)*

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

*Defined in [execution-context/api.ts:109](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/execution-context/api.ts#L109)*

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

*Defined in [execution-context/api.ts:137](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/execution-context/api.ts#L137)*

Make a logger with a the job_id and ex_id in the logger context

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`moduleName` | string | - |
`extra` | AnyObject |  {} |

**Returns:** *Logger‹›*
