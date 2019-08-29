---
title: Teraslice Client (JavaScript): `Ex`
sidebar_label: Ex
---

# Class: Ex

## Hierarchy

* [Client](client.md)

  * **Ex**

## Index

### Constructors

* [constructor](ex.md#constructor)

### Properties

* [_config](ex.md#protected-_config)

### Methods

* [delete](ex.md#delete)
* [errors](ex.md#errors)
* [get](ex.md#get)
* [list](ex.md#list)
* [makeOptions](ex.md#protected-makeoptions)
* [parse](ex.md#protected-parse)
* [pause](ex.md#pause)
* [post](ex.md#post)
* [put](ex.md#put)
* [resume](ex.md#resume)
* [status](ex.md#status)
* [stop](ex.md#stop)

## Constructors

###  constructor

\+ **new Ex**(`config`: [ClientConfig](../interfaces/clientconfig.md)): *[Ex](ex.md)*

*Overrides [Client](client.md).[constructor](client.md#constructor)*

*Defined in [ex.ts:21](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-client-js/src/ex.ts#L21)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | [ClientConfig](../interfaces/clientconfig.md) |

**Returns:** *[Ex](ex.md)*

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

###  errors

▸ **errors**(`exId`: string | [SearchQuery](../overview.md#searchquery), `opts?`: [SearchQuery](../overview.md#searchquery)): *Promise‹[StateErrors](../overview.md#stateerrors)›*

*Defined in [ex.ts:54](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-client-js/src/ex.ts#L54)*

**Parameters:**

Name | Type |
------ | ------ |
`exId` | string \| [SearchQuery](../overview.md#searchquery) |
`opts?` | [SearchQuery](../overview.md#searchquery) |

**Returns:** *Promise‹[StateErrors](../overview.md#stateerrors)›*

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

▸ **list**(`options?`: ListOptions): *Promise‹[ExecutionGetResponse](../overview.md#executiongetresponse)›*

*Defined in [ex.ts:49](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-client-js/src/ex.ts#L49)*

**Parameters:**

Name | Type |
------ | ------ |
`options?` | ListOptions |

**Returns:** *Promise‹[ExecutionGetResponse](../overview.md#executiongetresponse)›*

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

▸ **pause**(`exId`: string, `query?`: [SearchQuery](../overview.md#searchquery)): *Promise‹[PausedResponse](../interfaces/pausedresponse.md)›*

*Defined in [ex.ts:33](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-client-js/src/ex.ts#L33)*

**Parameters:**

Name | Type |
------ | ------ |
`exId` | string |
`query?` | [SearchQuery](../overview.md#searchquery) |

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

###  resume

▸ **resume**(`exId`: string, `query?`: [SearchQuery](../overview.md#searchquery)): *Promise‹[ResumeResponse](../interfaces/resumeresponse.md)›*

*Defined in [ex.ts:38](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-client-js/src/ex.ts#L38)*

**Parameters:**

Name | Type |
------ | ------ |
`exId` | string |
`query?` | [SearchQuery](../overview.md#searchquery) |

**Returns:** *Promise‹[ResumeResponse](../interfaces/resumeresponse.md)›*

___

###  status

▸ **status**(`exId`: string): *Promise‹[ExecutionStatus](../enums/executionstatus.md)›*

*Defined in [ex.ts:43](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-client-js/src/ex.ts#L43)*

**Parameters:**

Name | Type |
------ | ------ |
`exId` | string |

**Returns:** *Promise‹[ExecutionStatus](../enums/executionstatus.md)›*

___

###  stop

▸ **stop**(`exId`: string, `query?`: [StopQuery](../interfaces/stopquery.md)): *Promise‹[StoppedResponse](../interfaces/stoppedresponse.md)›*

*Defined in [ex.ts:28](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-client-js/src/ex.ts#L28)*

**Parameters:**

Name | Type |
------ | ------ |
`exId` | string |
`query?` | [StopQuery](../interfaces/stopquery.md) |

**Returns:** *Promise‹[StoppedResponse](../interfaces/stoppedresponse.md)›*
