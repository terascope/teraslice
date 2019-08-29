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

*Defined in [client.ts:12](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-client-js/src/client.ts#L12)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`config` | [ClientConfig](../interfaces/clientconfig.md) |  {} |

**Returns:** *[Client](client.md)*

## Properties

### `Protected` _config

• **_config**: *[ClientConfig](../interfaces/clientconfig.md)*

*Defined in [client.ts:12](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-client-js/src/client.ts#L12)*

## Methods

###  delete

▸ **delete**(`endpoint`: string, `options?`: [SearchOptions](../overview.md#searchoptions)): *Promise‹any›*

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

*Defined in [client.ts:33](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-client-js/src/client.ts#L33)*

**Parameters:**

Name | Type |
------ | ------ |
`endpoint` | string |
`options?` | [SearchOptions](../overview.md#searchoptions) |

**Returns:** *Promise‹any›*

___

### `Protected` makeOptions

▸ **makeOptions**(`query`: any, `options`: [RequestOptions](../interfaces/requestoptions.md) | [SearchOptions](../overview.md#searchoptions)): *[RequestOptions](../interfaces/requestoptions.md) & object | object & object*

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

*Defined in [client.ts:83](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-client-js/src/client.ts#L83)*

**Parameters:**

Name | Type |
------ | ------ |
`results` | any |

**Returns:** *any*

___

###  post

▸ **post**(`endpoint`: string, `data`: any, `options?`: [RequestOptions](../interfaces/requestoptions.md)): *Promise‹any›*

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

*Defined in [client.ts:41](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-client-js/src/client.ts#L41)*

**Parameters:**

Name | Type |
------ | ------ |
`endpoint` | string |
`data` | any |
`options?` | [RequestOptions](../interfaces/requestoptions.md) |

**Returns:** *Promise‹any›*
