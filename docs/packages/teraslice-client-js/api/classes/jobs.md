---
title: Teraslice Client (JavaScript): `Jobs`
sidebar_label: Jobs
---

# Class: Jobs

## Hierarchy

* [Client](client.md)

  * **Jobs**

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

*Defined in [jobs.ts:14](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-client-js/src/jobs.ts#L14)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | [ClientConfig](../interfaces/clientconfig.md) |

**Returns:** *[Jobs](jobs.md)*

## Properties

### `Protected` _config

• **_config**: *[ClientConfig](../interfaces/clientconfig.md)*

*Inherited from [Client](client.md).[_config](client.md#protected-_config)*

*Defined in [client.ts:12](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-client-js/src/client.ts#L12)*

## Methods

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

###  list

▸ **list**(`status?`: [JobListStatusQuery](../overview.md#jobliststatusquery), `searchOptions`: [SearchOptions](../overview.md#searchoptions)): *Promise‹[JobsGetResponse](../overview.md#jobsgetresponse)›*

*Defined in [jobs.ts:27](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-client-js/src/jobs.ts#L27)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`status?` | [JobListStatusQuery](../overview.md#jobliststatusquery) | - |
`searchOptions` | [SearchOptions](../overview.md#searchoptions) |  {} |

**Returns:** *Promise‹[JobsGetResponse](../overview.md#jobsgetresponse)›*

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

###  submit

▸ **submit**(`jobSpec`: JobConfig, `shouldNotStart?`: undefined | false | true): *Promise‹[Job](job.md)›*

*Defined in [jobs.ts:21](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-client-js/src/jobs.ts#L21)*

**Parameters:**

Name | Type |
------ | ------ |
`jobSpec` | JobConfig |
`shouldNotStart?` | undefined \| false \| true |

**Returns:** *Promise‹[Job](job.md)›*

___

###  wrap

▸ **wrap**(`jobId`: string): *[Job](job.md)*

*Defined in [jobs.ts:37](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-client-js/src/jobs.ts#L37)*

**Parameters:**

Name | Type |
------ | ------ |
`jobId` | string |

**Returns:** *[Job](job.md)*
