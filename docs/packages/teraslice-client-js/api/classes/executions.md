---
title: Teraslice Client (JavaScript): `Executions`
sidebar_label: Executions
---

# Class: Executions

## Hierarchy

* [Client](client.md)

  ↳ **Executions**

## Index

### Constructors

* [constructor](executions.md#constructor)

### Properties

* [_config](executions.md#protected-_config)

### Methods

* [delete](executions.md#delete)
* [errors](executions.md#errors)
* [get](executions.md#get)
* [list](executions.md#list)
* [makeOptions](executions.md#protected-makeoptions)
* [parse](executions.md#protected-parse)
* [post](executions.md#post)
* [put](executions.md#put)
* [submit](executions.md#submit)
* [wrap](executions.md#wrap)

## Constructors

###  constructor

\+ **new Executions**(`config`: [ClientConfig](../interfaces/clientconfig.md)): *[Executions](executions.md)*

*Overrides [Client](client.md).[constructor](client.md#constructor)*

*Defined in [packages/teraslice-client-js/src/executions.ts:23](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-client-js/src/executions.ts#L23)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | [ClientConfig](../interfaces/clientconfig.md) |

**Returns:** *[Executions](executions.md)*

## Properties

### `Protected` _config

• **_config**: *[ClientConfig](../interfaces/clientconfig.md)*

*Inherited from [Client](client.md).[_config](client.md#protected-_config)*

*Defined in [packages/teraslice-client-js/src/client.ts:15](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-client-js/src/client.ts#L15)*

## Methods

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

▸ **errors**(`exId?`: string | [SearchQuery](../overview.md#searchquery), `opts?`: [SearchQuery](../overview.md#searchquery)): *Promise‹[StateErrors](../overview.md#stateerrors)›*

*Defined in [packages/teraslice-client-js/src/executions.ts:49](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-client-js/src/executions.ts#L49)*

**Parameters:**

Name | Type |
------ | ------ |
`exId?` | string &#124; [SearchQuery](../overview.md#searchquery) |
`opts?` | [SearchQuery](../overview.md#searchquery) |

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

###  list

▸ **list**(`options?`: ListOptions): *Promise‹[Execution](../interfaces/execution.md)[]›*

*Defined in [packages/teraslice-client-js/src/executions.ts:44](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-client-js/src/executions.ts#L44)*

**Parameters:**

Name | Type |
------ | ------ |
`options?` | ListOptions |

**Returns:** *Promise‹[Execution](../interfaces/execution.md)[]›*

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

###  submit

▸ **submit**(`jobSpec`: JobConfig, `shouldNotStart?`: undefined | false | true): *Promise‹[Ex](ex.md)›*

*Defined in [packages/teraslice-client-js/src/executions.ts:33](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-client-js/src/executions.ts#L33)*

Similar to jobs.submit but returns an instance of Ex not a Job

**Parameters:**

Name | Type |
------ | ------ |
`jobSpec` | JobConfig |
`shouldNotStart?` | undefined &#124; false &#124; true |

**Returns:** *Promise‹[Ex](ex.md)›*

___

###  wrap

▸ **wrap**(`exId`: string): *[Ex](ex.md)*

*Defined in [packages/teraslice-client-js/src/executions.ts:70](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-client-js/src/executions.ts#L70)*

Wraps the execution id with convenience functions for accessing
the state on the server.

**Parameters:**

Name | Type |
------ | ------ |
`exId` | string |

**Returns:** *[Ex](ex.md)*
