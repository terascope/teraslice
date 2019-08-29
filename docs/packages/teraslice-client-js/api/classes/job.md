---
title: Teraslice Client (JavaScript): `Job`
sidebar_label: Job
---

# Class: Job

## Hierarchy

* [Client](client.md)

  * **Job**

## Index

### Constructors

* [constructor](job.md#constructor)

### Properties

* [_config](job.md#protected-_config)

### Methods

* [changeWorkers](job.md#changeworkers)
* [config](job.md#config)
* [controller](job.md#controller)
* [delete](job.md#delete)
* [errors](job.md#errors)
* [exId](job.md#exid)
* [execution](job.md#execution)
* [get](job.md#get)
* [id](job.md#id)
* [makeOptions](job.md#protected-makeoptions)
* [parse](job.md#protected-parse)
* [pause](job.md#pause)
* [post](job.md#post)
* [put](job.md#put)
* [recover](job.md#recover)
* [resume](job.md#resume)
* [slicer](job.md#slicer)
* [start](job.md#start)
* [status](job.md#status)
* [stop](job.md#stop)
* [waitForStatus](job.md#waitforstatus)
* [workers](job.md#workers)

## Constructors

###  constructor

\+ **new Job**(`config`: [ClientConfig](../interfaces/clientconfig.md), `jobId`: string): *[Job](job.md)*

*Overrides [Client](client.md).[constructor](client.md#constructor)*

*Defined in [job.ts:49](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-client-js/src/job.ts#L49)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | [ClientConfig](../interfaces/clientconfig.md) |
`jobId` | string |

**Returns:** *[Job](job.md)*

## Properties

### `Protected` _config

• **_config**: *[ClientConfig](../interfaces/clientconfig.md)*

*Inherited from [Client](client.md).[_config](client.md#protected-_config)*

*Defined in [client.ts:12](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-client-js/src/client.ts#L12)*

## Methods

###  changeWorkers

▸ **changeWorkers**(`action`: [ChangeWorkerQueryParams](../overview.md#changeworkerqueryparams), `workerNum`: number, `requestOptions`: [RequestOptions](../interfaces/requestoptions.md)): *Promise‹[ChangeWorkerResponse](../interfaces/changeworkerresponse.md) | string›*

*Defined in [job.ts:194](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-client-js/src/job.ts#L194)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`action` | [ChangeWorkerQueryParams](../overview.md#changeworkerqueryparams) | - |
`workerNum` | number | - |
`requestOptions` | [RequestOptions](../interfaces/requestoptions.md) |  {} |

**Returns:** *Promise‹[ChangeWorkerResponse](../interfaces/changeworkerresponse.md) | string›*

___

###  config

▸ **config**(`requestOptions`: [RequestOptions](../interfaces/requestoptions.md)): *Promise‹[JobsGetResponse](../overview.md#jobsgetresponse)›*

*Defined in [job.ts:181](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-client-js/src/job.ts#L181)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`requestOptions` | [RequestOptions](../interfaces/requestoptions.md) |  {} |

**Returns:** *Promise‹[JobsGetResponse](../overview.md#jobsgetresponse)›*

___

###  controller

▸ **controller**(`requestOptions`: [RequestOptions](../interfaces/requestoptions.md)): *Promise‹[ControllerState](../overview.md#controllerstate)›*

*Defined in [job.ts:71](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-client-js/src/job.ts#L71)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`requestOptions` | [RequestOptions](../interfaces/requestoptions.md) |  {} |

**Returns:** *Promise‹[ControllerState](../overview.md#controllerstate)›*

___

###  delete

▸ **delete**(`endpoint`: string, `options?`: [SearchOptions](../overview.md#searchoptions)): *Promise‹any›*

*Inherited from [Client](client.md).[delete](client.md#delete)*

*Defined in [client.ts:45](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-client-js/src/client.ts#L45)*

**Parameters:**

Name | Type |
------ | ------ |
`endpoint` | string |
`options?` | [SearchOptions](../overview.md#searchoptions) |

**Returns:** *Promise‹any›*

___

###  errors

▸ **errors**(`query`: [SearchQuery](../overview.md#searchquery), `searchOptions`: [SearchOptions](../overview.md#searchoptions)): *Promise‹[StateErrors](../overview.md#stateerrors)›*

*Defined in [job.ts:185](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-client-js/src/job.ts#L185)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`query` | [SearchQuery](../overview.md#searchquery) |  {} |
`searchOptions` | [SearchOptions](../overview.md#searchoptions) |  {} |

**Returns:** *Promise‹[StateErrors](../overview.md#stateerrors)›*

___

###  exId

▸ **exId**(`requestOptions`: [RequestOptions](../interfaces/requestoptions.md)): *Promise‹[ExecutionIDResponse](../interfaces/executionidresponse.md)›*

*Defined in [job.ts:107](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-client-js/src/job.ts#L107)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`requestOptions` | [RequestOptions](../interfaces/requestoptions.md) |  {} |

**Returns:** *Promise‹[ExecutionIDResponse](../interfaces/executionidresponse.md)›*

___

###  execution

▸ **execution**(`requestOptions`: [RequestOptions](../interfaces/requestoptions.md)): *Promise‹[ExecutionGetResponse](../overview.md#executiongetresponse)›*

*Defined in [job.ts:103](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-client-js/src/job.ts#L103)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`requestOptions` | [RequestOptions](../interfaces/requestoptions.md) |  {} |

**Returns:** *Promise‹[ExecutionGetResponse](../overview.md#executiongetresponse)›*

___

###  get

▸ **get**(`endpoint`: string, `options?`: [SearchOptions](../overview.md#searchoptions)): *Promise‹any›*

*Inherited from [Client](client.md).[get](client.md#get)*

*Defined in [client.ts:33](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-client-js/src/client.ts#L33)*

**Parameters:**

Name | Type |
------ | ------ |
`endpoint` | string |
`options?` | [SearchOptions](../overview.md#searchoptions) |

**Returns:** *Promise‹any›*

___

###  id

▸ **id**(): *string*

*Defined in [job.ts:65](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-client-js/src/job.ts#L65)*

**Returns:** *string*

___

### `Protected` makeOptions

▸ **makeOptions**(`query`: any, `options`: [RequestOptions](../interfaces/requestoptions.md) | [SearchOptions](../overview.md#searchoptions)): *[RequestOptions](../interfaces/requestoptions.md) & object | object & object*

*Inherited from [Client](client.md).[makeOptions](client.md#protected-makeoptions)*

*Defined in [client.ts:88](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-client-js/src/client.ts#L88)*

**Parameters:**

Name | Type |
------ | ------ |
`query` | any |
`options` | [RequestOptions](../interfaces/requestoptions.md) \| [SearchOptions](../overview.md#searchoptions) |

**Returns:** *[RequestOptions](../interfaces/requestoptions.md) & object | object & object*

___

### `Protected` parse

▸ **parse**(`results`: any): *any*

*Inherited from [Client](client.md).[parse](client.md#protected-parse)*

*Defined in [client.ts:83](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-client-js/src/client.ts#L83)*

**Parameters:**

Name | Type |
------ | ------ |
`results` | any |

**Returns:** *any*

___

###  pause

▸ **pause**(`query?`: [SearchQuery](../overview.md#searchquery), `searchOptions`: [SearchOptions](../overview.md#searchoptions)): *Promise‹[PausedResponse](../interfaces/pausedresponse.md)›*

*Defined in [job.ts:85](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-client-js/src/job.ts#L85)*

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

*Defined in [client.ts:37](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-client-js/src/client.ts#L37)*

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

*Defined in [client.ts:41](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-client-js/src/client.ts#L41)*

**Parameters:**

Name | Type |
------ | ------ |
`endpoint` | string |
`data` | any |
`options?` | [RequestOptions](../interfaces/requestoptions.md) |

**Returns:** *Promise‹any›*

___

###  recover

▸ **recover**(`query`: [RecoverQuery](../interfaces/recoverquery.md), `searchOptions`: [SearchOptions](../overview.md#searchoptions)): *Promise‹[JobIDResponse](../interfaces/jobidresponse.md)›*

*Defined in [job.ts:95](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-client-js/src/job.ts#L95)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`query` | [RecoverQuery](../interfaces/recoverquery.md) |  {} |
`searchOptions` | [SearchOptions](../overview.md#searchoptions) |  {} |

**Returns:** *Promise‹[JobIDResponse](../interfaces/jobidresponse.md)›*

___

###  resume

▸ **resume**(`query?`: [SearchQuery](../overview.md#searchquery), `searchOptions`: [SearchOptions](../overview.md#searchoptions)): *Promise‹[ResumeResponse](../interfaces/resumeresponse.md)›*

*Defined in [job.ts:90](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-client-js/src/job.ts#L90)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`query?` | [SearchQuery](../overview.md#searchquery) | - |
`searchOptions` | [SearchOptions](../overview.md#searchoptions) |  {} |

**Returns:** *Promise‹[ResumeResponse](../interfaces/resumeresponse.md)›*

___

###  slicer

▸ **slicer**(`requestOptions`: [RequestOptions](../interfaces/requestoptions.md)): *Promise‹[ControllerState](../overview.md#controllerstate)›*

*Defined in [job.ts:67](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-client-js/src/job.ts#L67)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`requestOptions` | [RequestOptions](../interfaces/requestoptions.md) |  {} |

**Returns:** *Promise‹[ControllerState](../overview.md#controllerstate)›*

___

###  start

▸ **start**(`query?`: [SearchQuery](../overview.md#searchquery), `searchOptions`: [SearchOptions](../overview.md#searchoptions)): *Promise‹[JobIDResponse](../interfaces/jobidresponse.md)›*

*Defined in [job.ts:75](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-client-js/src/job.ts#L75)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`query?` | [SearchQuery](../overview.md#searchquery) | - |
`searchOptions` | [SearchOptions](../overview.md#searchoptions) |  {} |

**Returns:** *Promise‹[JobIDResponse](../interfaces/jobidresponse.md)›*

___

###  status

▸ **status**(`requestOptions`: [RequestOptions](../interfaces/requestoptions.md)): *Promise‹[ExecutionStatus](../enums/executionstatus.md)›*

*Defined in [job.ts:112](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-client-js/src/job.ts#L112)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`requestOptions` | [RequestOptions](../interfaces/requestoptions.md) |  {} |

**Returns:** *Promise‹[ExecutionStatus](../enums/executionstatus.md)›*

___

###  stop

▸ **stop**(`query?`: [StopQuery](../interfaces/stopquery.md), `searchOptions`: [SearchOptions](../overview.md#searchoptions)): *Promise‹[StoppedResponse](../interfaces/stoppedresponse.md)›*

*Defined in [job.ts:80](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-client-js/src/job.ts#L80)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`query?` | [StopQuery](../interfaces/stopquery.md) | - |
`searchOptions` | [SearchOptions](../overview.md#searchoptions) |  {} |

**Returns:** *Promise‹[StoppedResponse](../interfaces/stoppedresponse.md)›*

___

###  waitForStatus

▸ **waitForStatus**(`target`: [ExecutionStatus](../enums/executionstatus.md), `intervalMs`: number, `timeoutMs`: number, `requestOptions`: [RequestOptions](../interfaces/requestoptions.md)): *Promise‹[ExecutionStatus](../enums/executionstatus.md)›*

*Defined in [job.ts:117](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-client-js/src/job.ts#L117)*

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

*Defined in [job.ts:189](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-client-js/src/job.ts#L189)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`requestOptions` | [RequestOptions](../interfaces/requestoptions.md) |  {} |

**Returns:** *Promise‹[WorkerJobProcesses](../overview.md#workerjobprocesses)[]›*
