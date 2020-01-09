---
title: Teraslice Client (JavaScript): `Cluster`
sidebar_label: Cluster
---

# Class: Cluster

## Hierarchy

* [Client](client.md)

  ↳ **Cluster**

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

*Defined in [cluster.ts:18](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-client-js/src/cluster.ts#L18)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | any |

**Returns:** *[Cluster](cluster.md)*

## Properties

### `Protected` _config

• **_config**: *[ClientConfig](../interfaces/clientconfig.md)*

*Inherited from [Client](client.md).[_config](client.md#protected-_config)*

*Defined in [client.ts:11](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-client-js/src/client.ts#L11)*

## Methods

###  controllers

▸ **controllers**(): *Promise‹[ControllerState](../overview.md#controllerstate)›*

*Defined in [cluster.ts:42](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-client-js/src/cluster.ts#L42)*

**Returns:** *Promise‹[ControllerState](../overview.md#controllerstate)›*

___

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

###  info

▸ **info**(): *Promise‹[RootResponse](../interfaces/rootresponse.md)›*

*Defined in [cluster.ts:26](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-client-js/src/cluster.ts#L26)*

**Returns:** *Promise‹[RootResponse](../interfaces/rootresponse.md)›*

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

###  slicers

▸ **slicers**(): *Promise‹[ControllerState](../overview.md#controllerstate)›*

*Defined in [cluster.ts:38](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-client-js/src/cluster.ts#L38)*

**Returns:** *Promise‹[ControllerState](../overview.md#controllerstate)›*

___

###  state

▸ **state**(): *Promise‹[ClusterState](../overview.md#clusterstate)›*

*Defined in [cluster.ts:30](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-client-js/src/cluster.ts#L30)*

**Returns:** *Promise‹[ClusterState](../overview.md#clusterstate)›*

___

###  stats

▸ **stats**(): *Promise‹[ClusterStats](../interfaces/clusterstats.md)›*

*Defined in [cluster.ts:34](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-client-js/src/cluster.ts#L34)*

**Returns:** *Promise‹[ClusterStats](../interfaces/clusterstats.md)›*

___

###  txt

▸ **txt**(`type`: [TxtType](../overview.md#txttype)): *Promise‹string›*

*Defined in [cluster.ts:46](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-client-js/src/cluster.ts#L46)*

**Parameters:**

Name | Type |
------ | ------ |
`type` | [TxtType](../overview.md#txttype) |

**Returns:** *Promise‹string›*
