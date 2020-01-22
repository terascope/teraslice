---
title: Teraslice Client (JavaScript): `Assets`
sidebar_label: Assets
---

# Class: Assets

## Hierarchy

* [Client](client.md)

  ↳ **Assets**

## Index

### Constructors

* [constructor](assets.md#constructor)

### Properties

* [_config](assets.md#protected-_config)

### Methods

* [delete](assets.md#delete)
* [get](assets.md#get)
* [getAsset](assets.md#getasset)
* [list](assets.md#list)
* [makeOptions](assets.md#protected-makeoptions)
* [parse](assets.md#protected-parse)
* [post](assets.md#post)
* [put](assets.md#put)
* [txt](assets.md#txt)

## Constructors

###  constructor

\+ **new Assets**(`config`: [ClientConfig](../interfaces/clientconfig.md)): *[Assets](assets.md)*

*Overrides [Client](client.md).[constructor](client.md#constructor)*

*Defined in [packages/teraslice-client-js/src/assets.ts:16](https://github.com/terascope/teraslice/blob/78714a985/packages/teraslice-client-js/src/assets.ts#L16)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | [ClientConfig](../interfaces/clientconfig.md) |

**Returns:** *[Assets](assets.md)*

## Properties

### `Protected` _config

• **_config**: *[ClientConfig](../interfaces/clientconfig.md)*

*Inherited from [Client](client.md).[_config](client.md#protected-_config)*

*Defined in [packages/teraslice-client-js/src/client.ts:15](https://github.com/terascope/teraslice/blob/78714a985/packages/teraslice-client-js/src/client.ts#L15)*

## Methods

###  delete

▸ **delete**(`id`: string, `searchOptions`: [SearchOptions](../overview.md#searchoptions)): *Promise‹[AssetIDResponse](../interfaces/assetidresponse.md)›*

*Overrides [Client](client.md).[delete](client.md#delete)*

*Defined in [packages/teraslice-client-js/src/assets.ts:29](https://github.com/terascope/teraslice/blob/78714a985/packages/teraslice-client-js/src/assets.ts#L29)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`id` | string | - |
`searchOptions` | [SearchOptions](../overview.md#searchoptions) |  {} |

**Returns:** *Promise‹[AssetIDResponse](../interfaces/assetidresponse.md)›*

___

###  get

▸ **get**(`endpoint`: string, `options?`: [SearchOptions](../overview.md#searchoptions)): *Promise‹any›*

*Inherited from [Client](client.md).[get](client.md#get)*

*Defined in [packages/teraslice-client-js/src/client.ts:41](https://github.com/terascope/teraslice/blob/78714a985/packages/teraslice-client-js/src/client.ts#L41)*

**Parameters:**

Name | Type |
------ | ------ |
`endpoint` | string |
`options?` | [SearchOptions](../overview.md#searchoptions) |

**Returns:** *Promise‹any›*

___

###  getAsset

▸ **getAsset**(`name`: string, `version`: string, `searchOptions`: [SearchOptions](../overview.md#searchoptions)): *Promise‹[Asset](../interfaces/asset.md)[]›*

*Defined in [packages/teraslice-client-js/src/assets.ts:43](https://github.com/terascope/teraslice/blob/78714a985/packages/teraslice-client-js/src/assets.ts#L43)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`name` | string | - |
`version` | string | "" |
`searchOptions` | [SearchOptions](../overview.md#searchoptions) |  {} |

**Returns:** *Promise‹[Asset](../interfaces/asset.md)[]›*

___

###  list

▸ **list**(`query`: [SearchQuery](../overview.md#searchquery), `searchOptions`: [SearchOptions](../overview.md#searchoptions)): *Promise‹[Asset](../interfaces/asset.md)[]›*

*Defined in [packages/teraslice-client-js/src/assets.ts:35](https://github.com/terascope/teraslice/blob/78714a985/packages/teraslice-client-js/src/assets.ts#L35)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`query` | [SearchQuery](../overview.md#searchquery) |  {} |
`searchOptions` | [SearchOptions](../overview.md#searchoptions) |  {} |

**Returns:** *Promise‹[Asset](../interfaces/asset.md)[]›*

___

### `Protected` makeOptions

▸ **makeOptions**(`query`: any, `options`: [RequestOptions](../interfaces/requestoptions.md) | [SearchOptions](../overview.md#searchoptions)): *[RequestOptions](../interfaces/requestoptions.md)‹› & object | object & object*

*Inherited from [Client](client.md).[makeOptions](client.md#protected-makeoptions)*

*Defined in [packages/teraslice-client-js/src/client.ts:97](https://github.com/terascope/teraslice/blob/78714a985/packages/teraslice-client-js/src/client.ts#L97)*

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

*Defined in [packages/teraslice-client-js/src/client.ts:91](https://github.com/terascope/teraslice/blob/78714a985/packages/teraslice-client-js/src/client.ts#L91)*

**Parameters:**

Name | Type |
------ | ------ |
`results` | any |

**Returns:** *any*

___

###  post

▸ **post**(`data`: [PostData](../overview.md#postdata), `options`: [RequestOptions](../interfaces/requestoptions.md)): *Promise‹[AssetIDResponse](../interfaces/assetidresponse.md)›*

*Overrides [Client](client.md).[post](client.md#post)*

*Defined in [packages/teraslice-client-js/src/assets.ts:23](https://github.com/terascope/teraslice/blob/78714a985/packages/teraslice-client-js/src/assets.ts#L23)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`data` | [PostData](../overview.md#postdata) | - |
`options` | [RequestOptions](../interfaces/requestoptions.md) |  {} |

**Returns:** *Promise‹[AssetIDResponse](../interfaces/assetidresponse.md)›*

___

###  put

▸ **put**(`endpoint`: string, `data`: any, `options?`: [RequestOptions](../interfaces/requestoptions.md)): *Promise‹any›*

*Inherited from [Client](client.md).[put](client.md#put)*

*Defined in [packages/teraslice-client-js/src/client.ts:49](https://github.com/terascope/teraslice/blob/78714a985/packages/teraslice-client-js/src/client.ts#L49)*

**Parameters:**

Name | Type |
------ | ------ |
`endpoint` | string |
`data` | any |
`options?` | [RequestOptions](../interfaces/requestoptions.md) |

**Returns:** *Promise‹any›*

___

###  txt

▸ **txt**(`name`: string, `version`: string, `query`: [TxtSearchParams](../interfaces/txtsearchparams.md), `searchOptions`: [SearchOptions](../overview.md#searchoptions)): *Promise‹string›*

*Defined in [packages/teraslice-client-js/src/assets.ts:50](https://github.com/terascope/teraslice/blob/78714a985/packages/teraslice-client-js/src/assets.ts#L50)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`name` | string | "" |
`version` | string | "" |
`query` | [TxtSearchParams](../interfaces/txtsearchparams.md) |  {} |
`searchOptions` | [SearchOptions](../overview.md#searchoptions) |  {} |

**Returns:** *Promise‹string›*
