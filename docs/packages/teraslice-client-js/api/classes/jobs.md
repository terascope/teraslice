---
title: Teraslice Client (JavaScript): `Jobs`
sidebar_label: Jobs
---

# Class: Jobs

## Hierarchy

* [Client](client.md)

  ↳ **Jobs**

## Index

### Constructors

* [constructor](jobs.md#constructor)

### Properties

* [_config](jobs.md#protected-_config)

### Methods

* [delete](jobs.md#delete)
* [get](jobs.md#get)
* [list](jobs.md#list)
* [makeOptions](jobs.md#protected-makeoptions)
* [parse](jobs.md#protected-parse)
* [post](jobs.md#post)
* [put](jobs.md#put)
* [submit](jobs.md#submit)
* [wrap](jobs.md#wrap)

## Constructors

###  constructor

\+ **new Jobs**(`config`: [ClientConfig](../interfaces/clientconfig.md)): *[Jobs](jobs.md)*

*Overrides [Client](client.md).[constructor](client.md#constructor)*

*Defined in [packages/teraslice-client-js/src/jobs.ts:14](https://github.com/terascope/teraslice/blob/f95bb5556/packages/teraslice-client-js/src/jobs.ts#L14)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | [ClientConfig](../interfaces/clientconfig.md) |

**Returns:** *[Jobs](jobs.md)*

## Properties

### `Protected` _config

• **_config**: *[ClientConfig](../interfaces/clientconfig.md)*

*Inherited from [Client](client.md).[_config](client.md#protected-_config)*

*Defined in [packages/teraslice-client-js/src/client.ts:15](https://github.com/terascope/teraslice/blob/f95bb5556/packages/teraslice-client-js/src/client.ts#L15)*

## Methods

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

###  list

▸ **list**(`status?`: [JobListStatusQuery](../overview.md#jobliststatusquery), `searchOptions`: [SearchOptions](../overview.md#searchoptions)): *Promise‹[JobConfiguration](../interfaces/jobconfiguration.md)[]›*

*Defined in [packages/teraslice-client-js/src/jobs.ts:27](https://github.com/terascope/teraslice/blob/f95bb5556/packages/teraslice-client-js/src/jobs.ts#L27)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`status?` | [JobListStatusQuery](../overview.md#jobliststatusquery) | - |
`searchOptions` | [SearchOptions](../overview.md#searchoptions) |  {} |

**Returns:** *Promise‹[JobConfiguration](../interfaces/jobconfiguration.md)[]›*

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

###  submit

▸ **submit**(`jobSpec`: JobConfig, `shouldNotStart?`: undefined | false | true): *Promise‹[Job](job.md)›*

*Defined in [packages/teraslice-client-js/src/jobs.ts:21](https://github.com/terascope/teraslice/blob/f95bb5556/packages/teraslice-client-js/src/jobs.ts#L21)*

**Parameters:**

Name | Type |
------ | ------ |
`jobSpec` | JobConfig |
`shouldNotStart?` | undefined &#124; false &#124; true |

**Returns:** *Promise‹[Job](job.md)›*

___

###  wrap

▸ **wrap**(`jobId`: string): *[Job](job.md)‹›*

*Defined in [packages/teraslice-client-js/src/jobs.ts:39](https://github.com/terascope/teraslice/blob/f95bb5556/packages/teraslice-client-js/src/jobs.ts#L39)*

Wraps the job_id with convenience functions for accessing
the state on the server.

**Parameters:**

Name | Type |
------ | ------ |
`jobId` | string |

**Returns:** *[Job](job.md)‹›*
