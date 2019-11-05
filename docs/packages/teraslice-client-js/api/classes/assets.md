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

*Defined in [assets.ts:25](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-client-js/src/assets.ts#L25)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | [ClientConfig](../interfaces/clientconfig.md) |

**Returns:** *[Assets](assets.md)*

## Properties

### `Protected` _config

• **_config**: *[ClientConfig](../interfaces/clientconfig.md)*

*Inherited from [Client](client.md).[_config](client.md#protected-_config)*

*Defined in [client.ts:11](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-client-js/src/client.ts#L11)*

## Methods

###  delete

▸ **delete**(`id`: string, `searchOptions`: [SearchOptions](../overview.md#searchoptions)): *Promise‹[AssetIDResponse](../interfaces/assetidresponse.md)›*

*Overrides [Client](client.md).[delete](client.md#delete)*

*Defined in [assets.ts:39](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-client-js/src/assets.ts#L39)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`id` | string | - |
`searchOptions` | [SearchOptions](../overview.md#searchoptions) |  {} |

**Returns:** *Promise‹[AssetIDResponse](../interfaces/assetidresponse.md)›*

___

###  get

▸ **get**(`name`: string): *Promise‹[AssetsGetResponse](../overview.md#assetsgetresponse)›*

*Overrides [Client](client.md).[get](client.md#get)*

*Defined in [assets.ts:53](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-client-js/src/assets.ts#L53)*

**Parameters:**

Name | Type |
------ | ------ |
`name` | string |

**Returns:** *Promise‹[AssetsGetResponse](../overview.md#assetsgetresponse)›*

___

###  getAsset

▸ **getAsset**(`name`: string, `version`: string, `searchOptions`: [SearchOptions](../overview.md#searchoptions)): *Promise‹[AssetsGetResponse](../overview.md#assetsgetresponse)›*

*Defined in [assets.ts:58](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-client-js/src/assets.ts#L58)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`name` | string | - |
`version` | string | "" |
`searchOptions` | [SearchOptions](../overview.md#searchoptions) |  {} |

**Returns:** *Promise‹[AssetsGetResponse](../overview.md#assetsgetresponse)›*

___

###  list

▸ **list**(`query`: [SearchQuery](../overview.md#searchquery), `searchOptions`: [SearchOptions](../overview.md#searchoptions)): *Promise‹[AssetsGetResponse](../overview.md#assetsgetresponse)›*

*Defined in [assets.ts:45](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-client-js/src/assets.ts#L45)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`query` | [SearchQuery](../overview.md#searchquery) |  {} |
`searchOptions` | [SearchOptions](../overview.md#searchoptions) |  {} |

**Returns:** *Promise‹[AssetsGetResponse](../overview.md#assetsgetresponse)›*

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

▸ **post**(`data`: [PostData](../overview.md#postdata), `options`: [RequestOptions](../interfaces/requestoptions.md)): *Promise‹[AssetIDResponse](../interfaces/assetidresponse.md)›*

*Overrides [Client](client.md).[post](client.md#post)*

*Defined in [assets.ts:33](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-client-js/src/assets.ts#L33)*

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

*Defined in [client.ts:40](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-client-js/src/client.ts#L40)*

**Parameters:**

Name | Type |
------ | ------ |
`endpoint` | string |
`data` | any |
`options?` | [RequestOptions](../interfaces/requestoptions.md) |

**Returns:** *Promise‹any›*

___

###  txt

▸ **txt**(`name`: string, `version`: string, `query`: [TxtSearchParams](../interfaces/txtsearchparams.md), `searchOptions`: [SearchOptions](../overview.md#searchoptions)): *Promise‹[AssetsGetResponse](../overview.md#assetsgetresponse)›*

*Defined in [assets.ts:65](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-client-js/src/assets.ts#L65)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`name` | string | "" |
`version` | string | "" |
`query` | [TxtSearchParams](../interfaces/txtsearchparams.md) |  {} |
`searchOptions` | [SearchOptions](../overview.md#searchoptions) |  {} |

**Returns:** *Promise‹[AssetsGetResponse](../overview.md#assetsgetresponse)›*
