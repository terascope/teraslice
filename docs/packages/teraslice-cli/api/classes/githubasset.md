---
title: Teraslice CLI: `GithubAsset`
sidebar_label: GithubAsset
---

# Class: GithubAsset

## Hierarchy

* **GithubAsset**

## Index

### Constructors

* [constructor](githubasset.md#constructor)

### Properties

* [arch](githubasset.md#arch)
* [assetString](githubasset.md#assetstring)
* [name](githubasset.md#name)
* [nodeVersion](githubasset.md#nodeversion)
* [platform](githubasset.md#platform)
* [user](githubasset.md#user)
* [version](githubasset.md#optional-version)

### Accessors

* [nodeMajorVersion](githubasset.md#nodemajorversion)

### Methods

* [download](githubasset.md#download)
* [parseAssetString](githubasset.md#static-parseassetstring)

## Constructors

###  constructor

\+ **new GithubAsset**(`config`: [GithubAssetConfig](../interfaces/githubassetconfig.md)): *[GithubAsset](githubasset.md)*

*Defined in [helpers/github-asset.ts:14](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-cli/src/helpers/github-asset.ts#L14)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | [GithubAssetConfig](../interfaces/githubassetconfig.md) |

**Returns:** *[GithubAsset](githubasset.md)*

## Properties

###  arch

• **arch**: *string*

*Defined in [helpers/github-asset.ts:8](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-cli/src/helpers/github-asset.ts#L8)*

___

###  assetString

• **assetString**: *string*

*Defined in [helpers/github-asset.ts:9](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-cli/src/helpers/github-asset.ts#L9)*

___

###  name

• **name**: *string*

*Defined in [helpers/github-asset.ts:13](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-cli/src/helpers/github-asset.ts#L13)*

___

###  nodeVersion

• **nodeVersion**: *string*

*Defined in [helpers/github-asset.ts:10](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-cli/src/helpers/github-asset.ts#L10)*

___

###  platform

• **platform**: *string*

*Defined in [helpers/github-asset.ts:11](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-cli/src/helpers/github-asset.ts#L11)*

___

###  user

• **user**: *string*

*Defined in [helpers/github-asset.ts:12](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-cli/src/helpers/github-asset.ts#L12)*

___

### `Optional` version

• **version**? : *undefined | string*

*Defined in [helpers/github-asset.ts:14](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-cli/src/helpers/github-asset.ts#L14)*

## Accessors

###  nodeMajorVersion

• **get nodeMajorVersion**(): *string*

*Defined in [helpers/github-asset.ts:28](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-cli/src/helpers/github-asset.ts#L28)*

**Returns:** *string*

## Methods

###  download

▸ **download**(`outDir`: string, `quiet`: boolean): *Promise‹any›*

*Defined in [helpers/github-asset.ts:32](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-cli/src/helpers/github-asset.ts#L32)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`outDir` | string | "/tmp" |
`quiet` | boolean | false |

**Returns:** *Promise‹any›*

___

### `Static` parseAssetString

▸ **parseAssetString**(`assetString`: string): *object*

*Defined in [helpers/github-asset.ts:86](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-cli/src/helpers/github-asset.ts#L86)*

**Parameters:**

Name | Type |
------ | ------ |
`assetString` | string |

**Returns:** *object*
