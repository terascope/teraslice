---
title: Teraslice Client (JavaScript): `Client`
sidebar_label: Client
---

# Class: Client

## Hierarchy

* **Client**

  ↳ [Assets](assets.md)

  ↳ [Cluster](cluster.md)

  ↳ [Ex](ex.md)

  ↳ [Executions](executions.md)

  ↳ [Job](job.md)

  ↳ [Jobs](jobs.md)

## Index

### Constructors

* [constructor](client.md#constructor)

### Properties

* [_config](client.md#protected-_config)

### Methods

* [delete](client.md#delete)
* [get](client.md#get)
* [makeOptions](client.md#protected-makeoptions)
* [parse](client.md#protected-parse)
* [post](client.md#post)
* [put](client.md#put)

## Constructors

###  constructor

\+ **new Client**(`config`: [ClientConfig](../interfaces/clientconfig.md)): *[Client](client.md)*

*Defined in [packages/teraslice-client-js/src/client.ts:15](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-client-js/src/client.ts#L15)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`config` | [ClientConfig](../interfaces/clientconfig.md) |  {} |

**Returns:** *[Client](client.md)*

## Properties

### `Protected` _config

• **_config**: *[ClientConfig](../interfaces/clientconfig.md)*

*Defined in [packages/teraslice-client-js/src/client.ts:15](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-client-js/src/client.ts#L15)*

## Methods

###  delete

▸ **delete**(`endpoint`: string, `options?`: [SearchOptions](../overview.md#searchoptions)): *Promise‹any›*

*Defined in [packages/teraslice-client-js/src/client.ts:53](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-client-js/src/client.ts#L53)*

**Parameters:**

Name | Type |
------ | ------ |
`endpoint` | string |
`options?` | [SearchOptions](../overview.md#searchoptions) |

**Returns:** *Promise‹any›*

___

###  get

▸ **get**(`endpoint`: string, `options?`: [SearchOptions](../overview.md#searchoptions)): *Promise‹any›*

*Defined in [packages/teraslice-client-js/src/client.ts:41](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-client-js/src/client.ts#L41)*

**Parameters:**

Name | Type |
------ | ------ |
`endpoint` | string |
`options?` | [SearchOptions](../overview.md#searchoptions) |

**Returns:** *Promise‹any›*

___

### `Protected` makeOptions

▸ **makeOptions**(`query`: any, `options`: [RequestOptions](../interfaces/requestoptions.md) | [SearchOptions](../overview.md#searchoptions)): *[RequestOptions](../interfaces/requestoptions.md)‹› & object | object & object*

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

*Defined in [packages/teraslice-client-js/src/client.ts:91](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-client-js/src/client.ts#L91)*

**Parameters:**

Name | Type |
------ | ------ |
`results` | any |

**Returns:** *any*

___

###  post

▸ **post**(`endpoint`: string, `data`: any, `options?`: [RequestOptions](../interfaces/requestoptions.md)): *Promise‹any›*

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

*Defined in [packages/teraslice-client-js/src/client.ts:49](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-client-js/src/client.ts#L49)*

**Parameters:**

Name | Type |
------ | ------ |
`endpoint` | string |
`data` | any |
`options?` | [RequestOptions](../interfaces/requestoptions.md) |

**Returns:** *Promise‹any›*
