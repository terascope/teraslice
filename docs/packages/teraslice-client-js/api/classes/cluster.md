---
title: Teraslice Client (JavaScript): `Cluster`
sidebar_label: Cluster
---

# Class: Cluster

## Hierarchy

* [Client](client.md)

  * **Cluster**

## Index

### Constructors

* [constructor](cluster.md#constructor)

### Properties

* [_config](cluster.md#protected-_config)

### Methods

* [controllers](cluster.md#controllers)
* [delete](cluster.md#delete)
* [get](cluster.md#get)
* [info](cluster.md#info)
* [makeOptions](cluster.md#protected-makeoptions)
* [parse](cluster.md#protected-parse)
* [post](cluster.md#post)
* [put](cluster.md#put)
* [slicers](cluster.md#slicers)
* [state](cluster.md#state)
* [stats](cluster.md#stats)
* [txt](cluster.md#txt)

## Constructors

###  constructor

\+ **new Cluster**(`config`: any): *[Cluster](cluster.md)*

*Overrides [Client](client.md).[constructor](client.md#constructor)*

*Defined in [cluster.ts:19](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-client-js/src/cluster.ts#L19)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | any |

**Returns:** *[Cluster](cluster.md)*

## Properties

### `Protected` _config

• **_config**: *[ClientConfig](../interfaces/clientconfig.md)*

*Inherited from [Client](client.md).[_config](client.md#protected-_config)*

*Defined in [client.ts:12](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-client-js/src/client.ts#L12)*

## Methods

###  controllers

▸ **controllers**(): *Promise‹[ControllerState](../overview.md#controllerstate)›*

*Defined in [cluster.ts:43](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-client-js/src/cluster.ts#L43)*

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

###  info

▸ **info**(): *Promise‹[RootResponse](../interfaces/rootresponse.md)›*

*Defined in [cluster.ts:27](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-client-js/src/cluster.ts#L27)*

**Returns:** *Promise‹[RootResponse](../interfaces/rootresponse.md)›*

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

###  slicers

▸ **slicers**(): *Promise‹[ControllerState](../overview.md#controllerstate)›*

*Defined in [cluster.ts:39](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-client-js/src/cluster.ts#L39)*

**Returns:** *Promise‹[ControllerState](../overview.md#controllerstate)›*

___

###  state

▸ **state**(): *Promise‹[ClusterState](../overview.md#clusterstate)›*

*Defined in [cluster.ts:31](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-client-js/src/cluster.ts#L31)*

**Returns:** *Promise‹[ClusterState](../overview.md#clusterstate)›*

___

###  stats

▸ **stats**(): *Promise‹[ClusterStats](../interfaces/clusterstats.md)›*

*Defined in [cluster.ts:35](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-client-js/src/cluster.ts#L35)*

**Returns:** *Promise‹[ClusterStats](../interfaces/clusterstats.md)›*

___

###  txt

▸ **txt**(`type`: [TxtType](../overview.md#txttype)): *Promise‹string›*

*Defined in [cluster.ts:47](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-client-js/src/cluster.ts#L47)*

**Parameters:**

Name | Type |
------ | ------ |
`type` | [TxtType](../overview.md#txttype) |

**Returns:** *Promise‹string›*
