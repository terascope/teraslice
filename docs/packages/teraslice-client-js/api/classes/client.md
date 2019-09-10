---
title: Teraslice Client (JavaScript): `Client`
sidebar_label: Client
---

# Class: Client

## Hierarchy

* **Client**

  * [Assets](assets.md)

  * [Cluster](cluster.md)

  * [Ex](ex.md)

  * [Job](job.md)

  * [Jobs](jobs.md)

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

*Defined in [client.ts:11](https://github.com/terascope/teraslice/blob/0ae31df4/packages/teraslice-client-js/src/client.ts#L11)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`config` | [ClientConfig](../interfaces/clientconfig.md) |  {} |

**Returns:** *[Client](client.md)*

## Properties

### `Protected` _config

• **_config**: *[ClientConfig](../interfaces/clientconfig.md)*

*Defined in [client.ts:11](https://github.com/terascope/teraslice/blob/0ae31df4/packages/teraslice-client-js/src/client.ts#L11)*

## Methods

###  delete

▸ **delete**(`endpoint`: string, `options?`: [SearchOptions](../overview.md#searchoptions)): *Promise‹any›*

*Defined in [client.ts:44](https://github.com/terascope/teraslice/blob/0ae31df4/packages/teraslice-client-js/src/client.ts#L44)*

**Parameters:**

Name | Type |
------ | ------ |
`endpoint` | string |
`options?` | [SearchOptions](../overview.md#searchoptions) |

**Returns:** *Promise‹any›*

___

###  get

▸ **get**(`endpoint`: string, `options?`: [SearchOptions](../overview.md#searchoptions)): *Promise‹any›*

*Defined in [client.ts:32](https://github.com/terascope/teraslice/blob/0ae31df4/packages/teraslice-client-js/src/client.ts#L32)*

**Parameters:**

Name | Type |
------ | ------ |
`endpoint` | string |
`options?` | [SearchOptions](../overview.md#searchoptions) |

**Returns:** *Promise‹any›*

___

### `Protected` makeOptions

▸ **makeOptions**(`query`: any, `options`: [RequestOptions](../interfaces/requestoptions.md) | [SearchOptions](../overview.md#searchoptions)): *[RequestOptions](../interfaces/requestoptions.md) & object | object & object*

*Defined in [client.ts:87](https://github.com/terascope/teraslice/blob/0ae31df4/packages/teraslice-client-js/src/client.ts#L87)*

**Parameters:**

Name | Type |
------ | ------ |
`query` | any |
`options` | [RequestOptions](../interfaces/requestoptions.md) \| [SearchOptions](../overview.md#searchoptions) |

**Returns:** *[RequestOptions](../interfaces/requestoptions.md) & object | object & object*

___

### `Protected` parse

▸ **parse**(`results`: any): *any*

*Defined in [client.ts:82](https://github.com/terascope/teraslice/blob/0ae31df4/packages/teraslice-client-js/src/client.ts#L82)*

**Parameters:**

Name | Type |
------ | ------ |
`results` | any |

**Returns:** *any*

___

###  post

▸ **post**(`endpoint`: string, `data`: any, `options?`: [RequestOptions](../interfaces/requestoptions.md)): *Promise‹any›*

*Defined in [client.ts:36](https://github.com/terascope/teraslice/blob/0ae31df4/packages/teraslice-client-js/src/client.ts#L36)*

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

*Defined in [client.ts:40](https://github.com/terascope/teraslice/blob/0ae31df4/packages/teraslice-client-js/src/client.ts#L40)*

**Parameters:**

Name | Type |
------ | ------ |
`endpoint` | string |
`data` | any |
`options?` | [RequestOptions](../interfaces/requestoptions.md) |

**Returns:** *Promise‹any›*
