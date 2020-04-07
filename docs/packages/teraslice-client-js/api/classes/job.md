---
title: Teraslice Client (JavaScript): `Job`
sidebar_label: Job
---

# Class: Job

## Hierarchy

* [Client](client.md)

  ↳ **Job**

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
* [update](job.md#update)
* [updatePartial](job.md#updatepartial)
* [waitForStatus](job.md#waitforstatus)
* [workers](job.md#workers)

## Constructors

###  constructor

\+ **new Job**(`config`: [ClientConfig](../interfaces/clientconfig.md), `jobId`: string): *[Job](job.md)*

*Overrides [Client](client.md).[constructor](client.md#constructor)*

*Defined in [packages/teraslice-client-js/src/job.ts:50](https://github.com/terascope/teraslice/blob/f95bb5556/packages/teraslice-client-js/src/job.ts#L50)*

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

*Defined in [packages/teraslice-client-js/src/client.ts:15](https://github.com/terascope/teraslice/blob/f95bb5556/packages/teraslice-client-js/src/client.ts#L15)*

## Methods

###  changeWorkers

▸ **changeWorkers**(`action`: [ChangeWorkerQueryParams](../overview.md#changeworkerqueryparams), `workerNum`: number, `requestOptions`: [RequestOptions](../interfaces/requestoptions.md)): *Promise‹[ChangeWorkerResponse](../interfaces/changeworkerresponse.md) | string›*

*Defined in [packages/teraslice-client-js/src/job.ts:208](https://github.com/terascope/teraslice/blob/f95bb5556/packages/teraslice-client-js/src/job.ts#L208)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`action` | [ChangeWorkerQueryParams](../overview.md#changeworkerqueryparams) | - |
`workerNum` | number | - |
`requestOptions` | [RequestOptions](../interfaces/requestoptions.md) |  {} |

**Returns:** *Promise‹[ChangeWorkerResponse](../interfaces/changeworkerresponse.md) | string›*

___

###  config

▸ **config**(`requestOptions`: [RequestOptions](../interfaces/requestoptions.md)): *Promise‹[JobConfiguration](../interfaces/jobconfiguration.md)›*

*Defined in [packages/teraslice-client-js/src/job.ts:195](https://github.com/terascope/teraslice/blob/f95bb5556/packages/teraslice-client-js/src/job.ts#L195)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`requestOptions` | [RequestOptions](../interfaces/requestoptions.md) |  {} |

**Returns:** *Promise‹[JobConfiguration](../interfaces/jobconfiguration.md)›*

___

###  controller

▸ **controller**(`requestOptions`: [RequestOptions](../interfaces/requestoptions.md)): *Promise‹[ControllerState](../overview.md#controllerstate)›*

*Defined in [packages/teraslice-client-js/src/job.ts:72](https://github.com/terascope/teraslice/blob/f95bb5556/packages/teraslice-client-js/src/job.ts#L72)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`requestOptions` | [RequestOptions](../interfaces/requestoptions.md) |  {} |

**Returns:** *Promise‹[ControllerState](../overview.md#controllerstate)›*

___

###  delete

▸ **delete**(`endpoint`: string, `options?`: [SearchOptions](../overview.md#searchoptions)): *Promise‹any›*

*Inherited from [Client](client.md).[delete](client.md#delete)*

*Defined in [packages/teraslice-client-js/src/client.ts:53](https://github.com/terascope/teraslice/blob/f95bb5556/packages/teraslice-client-js/src/client.ts#L53)*

**Parameters:**

Name | Type |
------ | ------ |
`endpoint` | string |
`options?` | [SearchOptions](../overview.md#searchoptions) |

**Returns:** *Promise‹any›*

___

###  errors

▸ **errors**(`query`: [SearchQuery](../overview.md#searchquery), `searchOptions`: [SearchOptions](../overview.md#searchoptions)): *Promise‹[StateErrors](../overview.md#stateerrors)›*

*Defined in [packages/teraslice-client-js/src/job.ts:199](https://github.com/terascope/teraslice/blob/f95bb5556/packages/teraslice-client-js/src/job.ts#L199)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`query` | [SearchQuery](../overview.md#searchquery) |  {} |
`searchOptions` | [SearchOptions](../overview.md#searchoptions) |  {} |

**Returns:** *Promise‹[StateErrors](../overview.md#stateerrors)›*

___

###  exId

▸ **exId**(`requestOptions`: [RequestOptions](../interfaces/requestoptions.md)): *Promise‹[ExecutionIDResponse](../interfaces/executionidresponse.md)›*

*Defined in [packages/teraslice-client-js/src/job.ts:118](https://github.com/terascope/teraslice/blob/f95bb5556/packages/teraslice-client-js/src/job.ts#L118)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`requestOptions` | [RequestOptions](../interfaces/requestoptions.md) |  {} |

**Returns:** *Promise‹[ExecutionIDResponse](../interfaces/executionidresponse.md)›*

___

###  execution

▸ **execution**(`requestOptions`: [RequestOptions](../interfaces/requestoptions.md)): *Promise‹[Execution](../interfaces/execution.md)›*

*Defined in [packages/teraslice-client-js/src/job.ts:114](https://github.com/terascope/teraslice/blob/f95bb5556/packages/teraslice-client-js/src/job.ts#L114)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`requestOptions` | [RequestOptions](../interfaces/requestoptions.md) |  {} |

**Returns:** *Promise‹[Execution](../interfaces/execution.md)›*

___

###  get

▸ **get**(`endpoint`: string, `options?`: [SearchOptions](../overview.md#searchoptions)): *Promise‹any›*

*Inherited from [Client](client.md).[get](client.md#get)*

*Defined in [packages/teraslice-client-js/src/client.ts:41](https://github.com/terascope/teraslice/blob/f95bb5556/packages/teraslice-client-js/src/client.ts#L41)*

**Parameters:**

Name | Type |
------ | ------ |
`endpoint` | string |
`options?` | [SearchOptions](../overview.md#searchoptions) |

**Returns:** *Promise‹any›*

___

###  id

▸ **id**(): *string*

*Defined in [packages/teraslice-client-js/src/job.ts:66](https://github.com/terascope/teraslice/blob/f95bb5556/packages/teraslice-client-js/src/job.ts#L66)*

**Returns:** *string*

___

### `Protected` makeOptions

▸ **makeOptions**(`query`: any, `options`: [RequestOptions](../interfaces/requestoptions.md) | [SearchOptions](../overview.md#searchoptions)): *[RequestOptions](../interfaces/requestoptions.md)‹› & object | object & object*

*Inherited from [Client](client.md).[makeOptions](client.md#protected-makeoptions)*

*Defined in [packages/teraslice-client-js/src/client.ts:97](https://github.com/terascope/teraslice/blob/f95bb5556/packages/teraslice-client-js/src/client.ts#L97)*

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

*Defined in [packages/teraslice-client-js/src/client.ts:91](https://github.com/terascope/teraslice/blob/f95bb5556/packages/teraslice-client-js/src/client.ts#L91)*

**Parameters:**

Name | Type |
------ | ------ |
`results` | any |

**Returns:** *any*

___

###  pause

▸ **pause**(`query?`: [SearchQuery](../overview.md#searchquery), `searchOptions`: [SearchOptions](../overview.md#searchoptions)): *Promise‹[PausedResponse](../interfaces/pausedresponse.md)›*

*Defined in [packages/teraslice-client-js/src/job.ts:86](https://github.com/terascope/teraslice/blob/f95bb5556/packages/teraslice-client-js/src/job.ts#L86)*

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

*Defined in [packages/teraslice-client-js/src/client.ts:45](https://github.com/terascope/teraslice/blob/f95bb5556/packages/teraslice-client-js/src/client.ts#L45)*

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

*Defined in [packages/teraslice-client-js/src/client.ts:49](https://github.com/terascope/teraslice/blob/f95bb5556/packages/teraslice-client-js/src/client.ts#L49)*

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

*Defined in [packages/teraslice-client-js/src/job.ts:96](https://github.com/terascope/teraslice/blob/f95bb5556/packages/teraslice-client-js/src/job.ts#L96)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`query` | [RecoverQuery](../interfaces/recoverquery.md) |  {} |
`searchOptions` | [SearchOptions](../overview.md#searchoptions) |  {} |

**Returns:** *Promise‹[JobIDResponse](../interfaces/jobidresponse.md)›*

___

###  resume

▸ **resume**(`query?`: [SearchQuery](../overview.md#searchquery), `searchOptions`: [SearchOptions](../overview.md#searchoptions)): *Promise‹[ResumeResponse](../interfaces/resumeresponse.md)›*

*Defined in [packages/teraslice-client-js/src/job.ts:91](https://github.com/terascope/teraslice/blob/f95bb5556/packages/teraslice-client-js/src/job.ts#L91)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`query?` | [SearchQuery](../overview.md#searchquery) | - |
`searchOptions` | [SearchOptions](../overview.md#searchoptions) |  {} |

**Returns:** *Promise‹[ResumeResponse](../interfaces/resumeresponse.md)›*

___

###  slicer

▸ **slicer**(`requestOptions`: [RequestOptions](../interfaces/requestoptions.md)): *Promise‹[ControllerState](../overview.md#controllerstate)›*

*Defined in [packages/teraslice-client-js/src/job.ts:68](https://github.com/terascope/teraslice/blob/f95bb5556/packages/teraslice-client-js/src/job.ts#L68)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`requestOptions` | [RequestOptions](../interfaces/requestoptions.md) |  {} |

**Returns:** *Promise‹[ControllerState](../overview.md#controllerstate)›*

___

###  start

▸ **start**(`query?`: [SearchQuery](../overview.md#searchquery), `searchOptions`: [SearchOptions](../overview.md#searchoptions)): *Promise‹[JobIDResponse](../interfaces/jobidresponse.md)›*

*Defined in [packages/teraslice-client-js/src/job.ts:76](https://github.com/terascope/teraslice/blob/f95bb5556/packages/teraslice-client-js/src/job.ts#L76)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`query?` | [SearchQuery](../overview.md#searchquery) | - |
`searchOptions` | [SearchOptions](../overview.md#searchoptions) |  {} |

**Returns:** *Promise‹[JobIDResponse](../interfaces/jobidresponse.md)›*

___

###  status

▸ **status**(`requestOptions`: [RequestOptions](../interfaces/requestoptions.md)): *Promise‹[ExecutionStatus](../enums/executionstatus.md)›*

*Defined in [packages/teraslice-client-js/src/job.ts:123](https://github.com/terascope/teraslice/blob/f95bb5556/packages/teraslice-client-js/src/job.ts#L123)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`requestOptions` | [RequestOptions](../interfaces/requestoptions.md) |  {} |

**Returns:** *Promise‹[ExecutionStatus](../enums/executionstatus.md)›*

___

###  stop

▸ **stop**(`query?`: [StopQuery](../interfaces/stopquery.md), `searchOptions`: [SearchOptions](../overview.md#searchoptions)): *Promise‹[StoppedResponse](../interfaces/stoppedresponse.md)›*

*Defined in [packages/teraslice-client-js/src/job.ts:81](https://github.com/terascope/teraslice/blob/f95bb5556/packages/teraslice-client-js/src/job.ts#L81)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`query?` | [StopQuery](../interfaces/stopquery.md) | - |
`searchOptions` | [SearchOptions](../overview.md#searchoptions) |  {} |

**Returns:** *Promise‹[StoppedResponse](../interfaces/stoppedresponse.md)›*

___

###  update

▸ **update**(`jobSpec`: [JobConfiguration](../interfaces/jobconfiguration.md)): *Promise‹[JobConfiguration](../interfaces/jobconfiguration.md)›*

*Defined in [packages/teraslice-client-js/src/job.ts:104](https://github.com/terascope/teraslice/blob/f95bb5556/packages/teraslice-client-js/src/job.ts#L104)*

**Parameters:**

Name | Type |
------ | ------ |
`jobSpec` | [JobConfiguration](../interfaces/jobconfiguration.md) |

**Returns:** *Promise‹[JobConfiguration](../interfaces/jobconfiguration.md)›*

___

###  updatePartial

▸ **updatePartial**(`jobSpec`: Partial‹[JobConfiguration](../interfaces/jobconfiguration.md) | JobConfig›): *Promise‹[JobConfiguration](../interfaces/jobconfiguration.md)›*

*Defined in [packages/teraslice-client-js/src/job.ts:108](https://github.com/terascope/teraslice/blob/f95bb5556/packages/teraslice-client-js/src/job.ts#L108)*

**Parameters:**

Name | Type |
------ | ------ |
`jobSpec` | Partial‹[JobConfiguration](../interfaces/jobconfiguration.md) &#124; JobConfig› |

**Returns:** *Promise‹[JobConfiguration](../interfaces/jobconfiguration.md)›*

___

###  waitForStatus

▸ **waitForStatus**(`target`: [ExecutionStatus](../enums/executionstatus.md)[] | [ExecutionStatus](../enums/executionstatus.md), `intervalMs`: number, `timeoutMs`: number, `requestOptions`: [RequestOptions](../interfaces/requestoptions.md)): *Promise‹[ExecutionStatus](../enums/executionstatus.md)›*

*Defined in [packages/teraslice-client-js/src/job.ts:128](https://github.com/terascope/teraslice/blob/f95bb5556/packages/teraslice-client-js/src/job.ts#L128)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`target` | [ExecutionStatus](../enums/executionstatus.md)[] &#124; [ExecutionStatus](../enums/executionstatus.md) | - |
`intervalMs` | number | 1000 |
`timeoutMs` | number | 0 |
`requestOptions` | [RequestOptions](../interfaces/requestoptions.md) |  {} |

**Returns:** *Promise‹[ExecutionStatus](../enums/executionstatus.md)›*

___

###  workers

▸ **workers**(`requestOptions`: [RequestOptions](../interfaces/requestoptions.md)): *Promise‹[WorkerJobProcesses](../overview.md#workerjobprocesses)[]›*

*Defined in [packages/teraslice-client-js/src/job.ts:203](https://github.com/terascope/teraslice/blob/f95bb5556/packages/teraslice-client-js/src/job.ts#L203)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`requestOptions` | [RequestOptions](../interfaces/requestoptions.md) |  {} |

**Returns:** *Promise‹[WorkerJobProcesses](../overview.md#workerjobprocesses)[]›*
