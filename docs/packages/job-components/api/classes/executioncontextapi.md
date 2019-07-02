---
title: Job Components Executioncontextapi
sidebar_label: Executioncontextapi
---

[ExecutionContextAPI](executioncontextapi.md) /

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

### Index

#### Constructors

* [constructor](executioncontextapi.md#constructor)

#### Accessors

* [apis](executioncontextapi.md#apis)
* [registry](executioncontextapi.md#registry)

#### Methods

* [addToRegistry](executioncontextapi.md#addtoregistry)
* [getAPI](executioncontextapi.md#getapi)
* [getObserver](executioncontextapi.md#getobserver)
* [initAPI](executioncontextapi.md#initapi)
* [makeLogger](executioncontextapi.md#makelogger)

## Constructors

###  constructor

\+ **new ExecutionContextAPI**(`context`: *[Context](../interfaces/context.md)*, `executionConfig`: *[ExecutionConfig](../interfaces/executionconfig.md)*): *[ExecutionContextAPI](executioncontextapi.md)*

*Defined in [src/execution-context/api.ts:22](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/execution-context/api.ts#L22)*

**Parameters:**

Name | Type |
------ | ------ |
`context` | [Context](../interfaces/context.md) |
`executionConfig` | [ExecutionConfig](../interfaces/executionconfig.md) |

**Returns:** *[ExecutionContextAPI](executioncontextapi.md)*

## Accessors

###  apis

• **get apis**(): *`Readonly<JobAPIInstances>`*

*Defined in [src/execution-context/api.ts:36](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/execution-context/api.ts#L36)*

**Returns:** *`Readonly<JobAPIInstances>`*

___

###  registry

• **get registry**(): *object*

*Defined in [src/execution-context/api.ts:32](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/execution-context/api.ts#L32)*

For backwards compatibility

**Returns:** *object*

## Methods

###  addToRegistry

▸ **addToRegistry**(`name`: *string*, `API`: *[APIConstructor](../overview.md#apiconstructor)*): *void*

*Defined in [src/execution-context/api.ts:41](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/execution-context/api.ts#L41)*

Add an API constructor to the registry

**Parameters:**

Name | Type |
------ | ------ |
`name` | string |
`API` | [APIConstructor](../overview.md#apiconstructor) |

**Returns:** *void*

___

###  getAPI

▸ **getAPI**<**T**>(`name`: *string*): *`T`*

*Defined in [src/execution-context/api.ts:89](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/execution-context/api.ts#L89)*

Get a reference to a specific operation API,
the must be initialized and created

**Type parameters:**

▪ **T**: *[OpAPI](../overview.md#opapi)*

**Parameters:**

Name | Type |
------ | ------ |
`name` | string |

**Returns:** *`T`*

___

###  getObserver

▸ **getObserver**<**T**>(`name`: *string*): *`T`*

*Defined in [src/execution-context/api.ts:74](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/execution-context/api.ts#L74)*

Get a reference to a specific operation API,
the must be initialized and created

**Type parameters:**

▪ **T**: *[Observer](observer.md)*

**Parameters:**

Name | Type |
------ | ------ |
`name` | string |

**Returns:** *`T`*

___

###  initAPI

▸ **initAPI**<**T**>(`name`: *string*, ...`params`: *any[]*): *`Promise<T>`*

*Defined in [src/execution-context/api.ts:106](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/execution-context/api.ts#L106)*

Create an instance of the API

**Type parameters:**

▪ **T**: *[OpAPI](../overview.md#opapi)*

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`name` | string | the name of API to create |
`...params` | any[] | any additional options that the API may need  |

**Returns:** *`Promise<T>`*

___

###  makeLogger

▸ **makeLogger**(`moduleName`: *string*, `extra`: *`AnyObject`*): *`Logger`*

*Defined in [src/execution-context/api.ts:134](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/execution-context/api.ts#L134)*

Make a logger with a the job_id and ex_id in the logger context

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`moduleName` | string | - |
`extra` | `AnyObject` |  {} |

**Returns:** *`Logger`*
