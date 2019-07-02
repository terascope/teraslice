---
title: Job Components Execution Context Api Executioncontextapi
sidebar_label: Execution Context Api Executioncontextapi
---

> Execution Context Api Executioncontextapi for @terascope/job-components

[Globals](../overview.md) / ["execution-context/api"](../modules/_execution_context_api_.md) / [ExecutionContextAPI](_execution_context_api_.executioncontextapi.md) /

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

* [constructor](_execution_context_api_.executioncontextapi.md#constructor)

#### Accessors

* [apis](_execution_context_api_.executioncontextapi.md#apis)
* [registry](_execution_context_api_.executioncontextapi.md#registry)

#### Methods

* [addToRegistry](_execution_context_api_.executioncontextapi.md#addtoregistry)
* [getAPI](_execution_context_api_.executioncontextapi.md#getapi)
* [getObserver](_execution_context_api_.executioncontextapi.md#getobserver)
* [initAPI](_execution_context_api_.executioncontextapi.md#initapi)
* [makeLogger](_execution_context_api_.executioncontextapi.md#makelogger)

## Constructors

###  constructor

\+ **new ExecutionContextAPI**(`context`: *[Context](../interfaces/_interfaces_context_.context.md)*, `executionConfig`: *[ExecutionConfig](../interfaces/_interfaces_jobs_.executionconfig.md)*): *[ExecutionContextAPI](_execution_context_api_.executioncontextapi.md)*

*Defined in [execution-context/api.ts:22](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/api.ts#L22)*

**Parameters:**

Name | Type |
------ | ------ |
`context` | [Context](../interfaces/_interfaces_context_.context.md) |
`executionConfig` | [ExecutionConfig](../interfaces/_interfaces_jobs_.executionconfig.md) |

**Returns:** *[ExecutionContextAPI](_execution_context_api_.executioncontextapi.md)*

## Accessors

###  apis

• **get apis**(): *`Readonly<JobAPIInstances>`*

*Defined in [execution-context/api.ts:36](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/api.ts#L36)*

**Returns:** *`Readonly<JobAPIInstances>`*

___

###  registry

• **get registry**(): *object*

*Defined in [execution-context/api.ts:32](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/api.ts#L32)*

For backwards compatibility

**Returns:** *object*

## Methods

###  addToRegistry

▸ **addToRegistry**(`name`: *string*, `API`: *[APIConstructor](../modules/_operations_interfaces_.md#apiconstructor)*): *void*

*Defined in [execution-context/api.ts:41](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/api.ts#L41)*

Add an API constructor to the registry

**Parameters:**

Name | Type |
------ | ------ |
`name` | string |
`API` | [APIConstructor](../modules/_operations_interfaces_.md#apiconstructor) |

**Returns:** *void*

___

###  getAPI

▸ **getAPI**<**T**>(`name`: *string*): *`T`*

*Defined in [execution-context/api.ts:89](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/api.ts#L89)*

Get a reference to a specific operation API,
the must be initialized and created

**Type parameters:**

▪ **T**: *[OpAPI](../modules/_interfaces_operations_.md#opapi)*

**Parameters:**

Name | Type |
------ | ------ |
`name` | string |

**Returns:** *`T`*

___

###  getObserver

▸ **getObserver**<**T**>(`name`: *string*): *`T`*

*Defined in [execution-context/api.ts:74](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/api.ts#L74)*

Get a reference to a specific operation API,
the must be initialized and created

**Type parameters:**

▪ **T**: *[Observer](_operations_observer_.observer.md)*

**Parameters:**

Name | Type |
------ | ------ |
`name` | string |

**Returns:** *`T`*

___

###  initAPI

▸ **initAPI**<**T**>(`name`: *string*, ...`params`: *any[]*): *`Promise<T>`*

*Defined in [execution-context/api.ts:106](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/api.ts#L106)*

Create an instance of the API

**Type parameters:**

▪ **T**: *[OpAPI](../modules/_interfaces_operations_.md#opapi)*

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`name` | string | the name of API to create |
`...params` | any[] | any additional options that the API may need  |

**Returns:** *`Promise<T>`*

___

###  makeLogger

▸ **makeLogger**(`moduleName`: *string*, `extra`: *`AnyObject`*): *`Logger`*

*Defined in [execution-context/api.ts:134](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/api.ts#L134)*

Make a logger with a the job_id and ex_id in the logger context

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`moduleName` | string | - |
`extra` | `AnyObject` |  {} |

**Returns:** *`Logger`*
