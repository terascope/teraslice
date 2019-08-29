---
title: Teraslice Client (JavaScript): `Assets`
sidebar_label: Assets
---

# Class: Assets

## Hierarchy

* [Client](client.md)

  * **Assets**

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

*Defined in [assets.ts:26](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-client-js/src/assets.ts#L26)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | [ClientConfig](../interfaces/clientconfig.md) |

**Returns:** *[Assets](assets.md)*

## Properties

### `Protected` _config

• **_config**: *[ClientConfig](../interfaces/clientconfig.md)*

*Inherited from [Client](client.md).[_config](client.md#protected-_config)*

*Defined in [client.ts:12](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-client-js/src/client.ts#L12)*

## Methods

###  delete

▸ **delete**(`id`: string, `searchOptions`: [SearchOptions](../overview.md#searchoptions)): *Promise‹[AssetIDResponse](../interfaces/assetidresponse.md)›*

*Overrides [Client](client.md).[delete](client.md#delete)*

*Defined in [assets.ts:40](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-client-js/src/assets.ts#L40)*

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

*Defined in [assets.ts:54](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-client-js/src/assets.ts#L54)*

**Parameters:**

Name | Type |
------ | ------ |
`name` | string |

**Returns:** *Promise‹[AssetsGetResponse](../overview.md#assetsgetresponse)›*

___

###  getAsset

▸ **getAsset**(`name`: string, `version`: string, `searchOptions`: [SearchOptions](../overview.md#searchoptions)): *Promise‹[AssetsGetResponse](../overview.md#assetsgetresponse)›*

*Defined in [assets.ts:59](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-client-js/src/assets.ts#L59)*

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

*Defined in [assets.ts:46](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-client-js/src/assets.ts#L46)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`query` | [SearchQuery](../overview.md#searchquery) |  {} |
`searchOptions` | [SearchOptions](../overview.md#searchoptions) |  {} |

**Returns:** *Promise‹[AssetsGetResponse](../overview.md#assetsgetresponse)›*

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

▸ **post**(`data`: [PostData](../overview.md#postdata), `options`: [RequestOptions](../interfaces/requestoptions.md)): *Promise‹[AssetIDResponse](../interfaces/assetidresponse.md)›*

*Overrides [Client](client.md).[post](client.md#post)*

*Defined in [assets.ts:34](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-client-js/src/assets.ts#L34)*

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

*Defined in [client.ts:41](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-client-js/src/client.ts#L41)*

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

*Defined in [assets.ts:66](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-client-js/src/assets.ts#L66)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`name` | string | "" |
`version` | string | "" |
`query` | [TxtSearchParams](../interfaces/txtsearchparams.md) |  {} |
`searchOptions` | [SearchOptions](../overview.md#searchoptions) |  {} |

**Returns:** *Promise‹[AssetsGetResponse](../overview.md#assetsgetresponse)›*
