---
title: Teraslice Client (JavaScript): `Ex`
sidebar_label: Ex
---

# Class: Ex

## Hierarchy

* [Client](client.md)

  ↳ **Ex**

## Index

### Constructors

* [constructor](ex.md#constructor)

### Properties

* [_config](ex.md#protected-_config)

### Methods

* [changeWorkers](ex.md#changeworkers)
* [config](ex.md#config)
* [controller](ex.md#controller)
* [delete](ex.md#delete)
* [errors](ex.md#errors)
* [get](ex.md#get)
* [id](ex.md#id)
* [makeOptions](ex.md#protected-makeoptions)
* [parse](ex.md#protected-parse)
* [pause](ex.md#pause)
* [post](ex.md#post)
* [put](ex.md#put)
* [recover](ex.md#recover)
* [resume](ex.md#resume)
* [slicer](ex.md#slicer)
* [status](ex.md#status)
* [stop](ex.md#stop)
* [waitForStatus](ex.md#waitforstatus)
* [workers](ex.md#workers)

## Constructors

###  constructor

\+ **new Ex**(`config`: [ClientConfig](../interfaces/clientconfig.md), `exId`: string): *[Ex](ex.md)*

*Overrides [Client](client.md).[constructor](client.md#constructor)*

*Defined in [packages/teraslice-client-js/src/ex.ts:35](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-client-js/src/ex.ts#L35)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | [ClientConfig](../interfaces/clientconfig.md) |
`exId` | string |

**Returns:** *[Ex](ex.md)*

## Properties

### `Protected` _config

• **_config**: *[ClientConfig](../interfaces/clientconfig.md)*

*Inherited from [Client](client.md).[_config](client.md#protected-_config)*

*Defined in [packages/teraslice-client-js/src/client.ts:15](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-client-js/src/client.ts#L15)*

## Methods

###  changeWorkers

▸ **changeWorkers**(`action`: [ChangeWorkerQueryParams](../overview.md#changeworkerqueryparams), `workerNum`: number, `requestOptions`: [RequestOptions](../interfaces/requestoptions.md)): *Promise‹[ChangeWorkerResponse](../interfaces/changeworkerresponse.md) | string›*

*Defined in [packages/teraslice-client-js/src/ex.ts:108](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-client-js/src/ex.ts#L108)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`action` | [ChangeWorkerQueryParams](../overview.md#changeworkerqueryparams) | - |
`workerNum` | number | - |
`requestOptions` | [RequestOptions](../interfaces/requestoptions.md) |  {} |

**Returns:** *Promise‹[ChangeWorkerResponse](../interfaces/changeworkerresponse.md) | string›*

___

###  config

▸ **config**(`requestOptions`: [RequestOptions](../interfaces/requestoptions.md)): *Promise‹[Execution](../interfaces/execution.md)›*

*Defined in [packages/teraslice-client-js/src/ex.ts:93](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-client-js/src/ex.ts#L93)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`requestOptions` | [RequestOptions](../interfaces/requestoptions.md) |  {} |

**Returns:** *Promise‹[Execution](../interfaces/execution.md)›*

___

###  controller

▸ **controller**(`requestOptions`: [RequestOptions](../interfaces/requestoptions.md)): *Promise‹[ControllerState](../overview.md#controllerstate)›*

*Defined in [packages/teraslice-client-js/src/ex.ts:89](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-client-js/src/ex.ts#L89)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`requestOptions` | [RequestOptions](../interfaces/requestoptions.md) |  {} |

**Returns:** *Promise‹[ControllerState](../overview.md#controllerstate)›*

___

###  delete

▸ **delete**(`endpoint`: string, `options?`: [SearchOptions](../overview.md#searchoptions)): *Promise‹any›*

*Inherited from [Client](client.md).[delete](client.md#delete)*

*Defined in [packages/teraslice-client-js/src/client.ts:53](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-client-js/src/client.ts#L53)*

**Parameters:**

Name | Type |
------ | ------ |
`endpoint` | string |
`options?` | [SearchOptions](../overview.md#searchoptions) |

**Returns:** *Promise‹any›*

___

###  errors

▸ **errors**(`options?`: [SearchQuery](../overview.md#searchquery)): *Promise‹[StateErrors](../overview.md#stateerrors)›*

*Defined in [packages/teraslice-client-js/src/ex.ts:102](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-client-js/src/ex.ts#L102)*

**Parameters:**

Name | Type |
------ | ------ |
`options?` | [SearchQuery](../overview.md#searchquery) |

**Returns:** *Promise‹[StateErrors](../overview.md#stateerrors)›*

___

###  get

▸ **get**(`endpoint`: string, `options?`: [SearchOptions](../overview.md#searchoptions)): *Promise‹any›*

*Inherited from [Client](client.md).[get](client.md#get)*

*Defined in [packages/teraslice-client-js/src/client.ts:41](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-client-js/src/client.ts#L41)*

**Parameters:**

Name | Type |
------ | ------ |
`endpoint` | string |
`options?` | [SearchOptions](../overview.md#searchoptions) |

**Returns:** *Promise‹any›*

___

###  id

▸ **id**(): *string*

*Defined in [packages/teraslice-client-js/src/ex.ts:47](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-client-js/src/ex.ts#L47)*

**Returns:** *string*

___

### `Protected` makeOptions

▸ **makeOptions**(`query`: any, `options`: [RequestOptions](../interfaces/requestoptions.md) | [SearchOptions](../overview.md#searchoptions)): *[RequestOptions](../interfaces/requestoptions.md)‹› & object | object & object*

*Inherited from [Client](client.md).[makeOptions](client.md#protected-makeoptions)*

*Defined in [packages/teraslice-client-js/src/client.ts:97](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-client-js/src/client.ts#L97)*

**Parameters:**

Name | Type |
------ | ------ |
`query` | any |
`options` | [RequestOptions](../interfaces/requestoptions.md) &#124; [SearchOptions](../overview.md#searchoptions) |

**Returns:** *[RequestOptions](../interfaces/requestoptions.md)‹› & object | object & object*

___

### `Protected` parse

▸ **parse**(`results`: any): *any*

*Inherited from [Client](client.md).[parse](client.md#protected-parse)*

*Defined in [packages/teraslice-client-js/src/client.ts:91](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-client-js/src/client.ts#L91)*

**Parameters:**

Name | Type |
------ | ------ |
`results` | any |

**Returns:** *any*

___

###  pause

▸ **pause**(`query?`: [SearchQuery](../overview.md#searchquery), `searchOptions`: [SearchOptions](../overview.md#searchoptions)): *Promise‹[PausedResponse](../interfaces/pausedresponse.md)›*

*Defined in [packages/teraslice-client-js/src/ex.ts:54](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-client-js/src/ex.ts#L54)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`query?` | [SearchQuery](../overview.md#searchquery) | - |
`searchOptions` | [SearchOptions](../overview.md#searchoptions) |  {} |

**Returns:** *Promise‹[PausedResponse](../interfaces/pausedresponse.md)›*

___

###  post

▸ **post**(`endpoint`: string, `data`: any, `options?`: [RequestOptions](../interfaces/requestoptions.md)): *Promise‹any›*

*Inherited from [Client](client.md).[post](client.md#post)*

*Defined in [packages/teraslice-client-js/src/client.ts:45](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-client-js/src/client.ts#L45)*

**Parameters:**

Name | Type |
------ | ------ |
`endpoint` | string |
`data` | any |
`options?` | [RequestOptions](../interfaces/requestoptions.md) |

**Returns:** *Promise‹any›*

___

###  put

▸ **put**(`endpoint`: string, `data`: any, `options?`: [RequestOptions](../interfaces/requestoptions.md)): *Promise‹any›*

*Inherited from [Client](client.md).[put](client.md#put)*

*Defined in [packages/teraslice-client-js/src/client.ts:49](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-client-js/src/client.ts#L49)*

**Parameters:**

Name | Type |
------ | ------ |
`endpoint` | string |
`data` | any |
`options?` | [RequestOptions](../interfaces/requestoptions.md) |

**Returns:** *Promise‹any›*

___

###  recover

▸ **recover**(`query`: [RecoverQuery](../interfaces/recoverquery.md), `searchOptions`: [SearchOptions](../overview.md#searchoptions)): *Promise‹[Ex](ex.md)›*

*Defined in [packages/teraslice-client-js/src/ex.ts:64](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-client-js/src/ex.ts#L64)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`query` | [RecoverQuery](../interfaces/recoverquery.md) |  {} |
`searchOptions` | [SearchOptions](../overview.md#searchoptions) |  {} |

**Returns:** *Promise‹[Ex](ex.md)›*

___

###  resume

▸ **resume**(`query?`: [SearchQuery](../overview.md#searchquery), `searchOptions`: [SearchOptions](../overview.md#searchoptions)): *Promise‹[ResumeResponse](../interfaces/resumeresponse.md)›*

*Defined in [packages/teraslice-client-js/src/ex.ts:59](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-client-js/src/ex.ts#L59)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`query?` | [SearchQuery](../overview.md#searchquery) | - |
`searchOptions` | [SearchOptions](../overview.md#searchoptions) |  {} |

**Returns:** *Promise‹[ResumeResponse](../interfaces/resumeresponse.md)›*

___

###  slicer

▸ **slicer**(`requestOptions`: [RequestOptions](../interfaces/requestoptions.md)): *Promise‹[ControllerState](../overview.md#controllerstate)›*

*Defined in [packages/teraslice-client-js/src/ex.ts:85](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-client-js/src/ex.ts#L85)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`requestOptions` | [RequestOptions](../interfaces/requestoptions.md) |  {} |

**Returns:** *Promise‹[ControllerState](../overview.md#controllerstate)›*

___

###  status

▸ **status**(`requestOptions?`: [RequestOptions](../interfaces/requestoptions.md)): *Promise‹[ExecutionStatus](../enums/executionstatus.md)›*

*Defined in [packages/teraslice-client-js/src/ex.ts:80](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-client-js/src/ex.ts#L80)*

**Parameters:**

Name | Type |
------ | ------ |
`requestOptions?` | [RequestOptions](../interfaces/requestoptions.md) |

**Returns:** *Promise‹[ExecutionStatus](../enums/executionstatus.md)›*

___

###  stop

▸ **stop**(`query?`: [StopQuery](../interfaces/stopquery.md), `searchOptions`: [SearchOptions](../overview.md#searchoptions)): *Promise‹[StoppedResponse](../interfaces/stoppedresponse.md)›*

*Defined in [packages/teraslice-client-js/src/ex.ts:49](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-client-js/src/ex.ts#L49)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`query?` | [StopQuery](../interfaces/stopquery.md) | - |
`searchOptions` | [SearchOptions](../overview.md#searchoptions) |  {} |

**Returns:** *Promise‹[StoppedResponse](../interfaces/stoppedresponse.md)›*

___

###  waitForStatus

▸ **waitForStatus**(`target`: [ExecutionStatus](../enums/executionstatus.md), `intervalMs`: number, `timeoutMs`: number, `requestOptions`: [RequestOptions](../interfaces/requestoptions.md)): *Promise‹[ExecutionStatus](../enums/executionstatus.md)›*

*Defined in [packages/teraslice-client-js/src/ex.ts:137](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-client-js/src/ex.ts#L137)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`target` | [ExecutionStatus](../enums/executionstatus.md) | - |
`intervalMs` | number | 1000 |
`timeoutMs` | number | 0 |
`requestOptions` | [RequestOptions](../interfaces/requestoptions.md) |  {} |

**Returns:** *Promise‹[ExecutionStatus](../enums/executionstatus.md)›*

___

###  workers

▸ **workers**(`requestOptions`: [RequestOptions](../interfaces/requestoptions.md)): *Promise‹[WorkerJobProcesses](../overview.md#workerjobprocesses)[]›*

*Defined in [packages/teraslice-client-js/src/ex.ts:97](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-client-js/src/ex.ts#L97)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`requestOptions` | [RequestOptions](../interfaces/requestoptions.md) |  {} |

**Returns:** *Promise‹[WorkerJobProcesses](../overview.md#workerjobprocesses)[]›*
