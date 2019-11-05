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

*Defined in [ex.ts:20](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-client-js/src/ex.ts#L20)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | [ClientConfig](../interfaces/clientconfig.md) |

**Returns:** *[Ex](ex.md)*

## Properties

### `Protected` _config

• **_config**: *[ClientConfig](../interfaces/clientconfig.md)*

*Inherited from [Client](client.md).[_config](client.md#protected-_config)*

*Defined in [client.ts:11](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-client-js/src/client.ts#L11)*

## Methods

###  delete

▸ **delete**(`endpoint`: string, `options?`: [SearchOptions](../overview.md#searchoptions)): *Promise‹any›*

*Inherited from [Client](client.md).[delete](client.md#delete)*

*Defined in [client.ts:44](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-client-js/src/client.ts#L44)*

**Parameters:**

Name | Type |
------ | ------ |
`endpoint` | string |
`options?` | [SearchOptions](../overview.md#searchoptions) |

**Returns:** *Promise‹any›*

___

###  errors

▸ **errors**(`exId`: string | [SearchQuery](../overview.md#searchquery), `opts?`: [SearchQuery](../overview.md#searchquery)): *Promise‹[StateErrors](../overview.md#stateerrors)›*

*Defined in [ex.ts:53](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-client-js/src/ex.ts#L53)*

**Parameters:**

Name | Type |
------ | ------ |
`exId` | string &#124; [SearchQuery](../overview.md#searchquery) |
`opts?` | [SearchQuery](../overview.md#searchquery) |

**Returns:** *Promise‹[StateErrors](../overview.md#stateerrors)›*

___

###  get

▸ **get**(`endpoint`: string, `options?`: [SearchOptions](../overview.md#searchoptions)): *Promise‹any›*

*Inherited from [Client](client.md).[get](client.md#get)*

*Defined in [client.ts:32](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-client-js/src/client.ts#L32)*

**Parameters:**

Name | Type |
------ | ------ |
`endpoint` | string |
`options?` | [SearchOptions](../overview.md#searchoptions) |

**Returns:** *Promise‹any›*

___

###  list

▸ **list**(`options?`: ListOptions): *Promise‹[ExecutionGetResponse](../overview.md#executiongetresponse)›*

*Defined in [ex.ts:48](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-client-js/src/ex.ts#L48)*

**Parameters:**

Name | Type |
------ | ------ |
`options?` | ListOptions |

**Returns:** *Promise‹[ExecutionGetResponse](../overview.md#executiongetresponse)›*

___

### `Protected` makeOptions

▸ **makeOptions**(`query`: any, `options`: [RequestOptions](../interfaces/requestoptions.md) | [SearchOptions](../overview.md#searchoptions)): *[RequestOptions](../interfaces/requestoptions.md)‹› & object | object & object*

*Inherited from [Client](client.md).[makeOptions](client.md#protected-makeoptions)*

*Defined in [client.ts:87](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-client-js/src/client.ts#L87)*

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

*Defined in [client.ts:82](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-client-js/src/client.ts#L82)*

**Parameters:**

Name | Type |
------ | ------ |
`results` | any |

**Returns:** *any*

___

###  pause

▸ **pause**(`exId`: string, `query?`: [SearchQuery](../overview.md#searchquery)): *Promise‹[PausedResponse](../interfaces/pausedresponse.md)›*

*Defined in [ex.ts:32](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-client-js/src/ex.ts#L32)*

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

*Defined in [client.ts:36](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-client-js/src/client.ts#L36)*

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

*Defined in [client.ts:40](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-client-js/src/client.ts#L40)*

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

*Defined in [ex.ts:37](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-client-js/src/ex.ts#L37)*

**Parameters:**

Name | Type |
------ | ------ |
`exId` | string |
`query?` | [SearchQuery](../overview.md#searchquery) |

**Returns:** *Promise‹[ResumeResponse](../interfaces/resumeresponse.md)›*

___

###  status

▸ **status**(`exId`: string): *Promise‹[ExecutionStatus](../enums/executionstatus.md)›*

*Defined in [ex.ts:42](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-client-js/src/ex.ts#L42)*

**Parameters:**

Name | Type |
------ | ------ |
`exId` | string |

**Returns:** *Promise‹[ExecutionStatus](../enums/executionstatus.md)›*

___

###  stop

▸ **stop**(`exId`: string, `query?`: [StopQuery](../interfaces/stopquery.md)): *Promise‹[StoppedResponse](../interfaces/stoppedresponse.md)›*

*Defined in [ex.ts:27](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-client-js/src/ex.ts#L27)*

**Parameters:**

Name | Type |
------ | ------ |
`exId` | string |
`query?` | [StopQuery](../interfaces/stopquery.md) |

**Returns:** *Promise‹[StoppedResponse](../interfaces/stoppedresponse.md)›*
