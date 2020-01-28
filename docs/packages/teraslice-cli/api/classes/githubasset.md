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

*Defined in [packages/teraslice-cli/src/helpers/github-asset.ts:13](https://github.com/terascope/teraslice/blob/78714a985/packages/teraslice-cli/src/helpers/github-asset.ts#L13)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | [GithubAssetConfig](../interfaces/githubassetconfig.md) |

**Returns:** *[GithubAsset](githubasset.md)*

## Properties

###  arch

• **arch**: *string*

*Defined in [packages/teraslice-cli/src/helpers/github-asset.ts:7](https://github.com/terascope/teraslice/blob/78714a985/packages/teraslice-cli/src/helpers/github-asset.ts#L7)*

___

###  assetString

• **assetString**: *string*

*Defined in [packages/teraslice-cli/src/helpers/github-asset.ts:8](https://github.com/terascope/teraslice/blob/78714a985/packages/teraslice-cli/src/helpers/github-asset.ts#L8)*

___

###  name

• **name**: *string*

*Defined in [packages/teraslice-cli/src/helpers/github-asset.ts:12](https://github.com/terascope/teraslice/blob/78714a985/packages/teraslice-cli/src/helpers/github-asset.ts#L12)*

___

###  nodeVersion

• **nodeVersion**: *string*

*Defined in [packages/teraslice-cli/src/helpers/github-asset.ts:9](https://github.com/terascope/teraslice/blob/78714a985/packages/teraslice-cli/src/helpers/github-asset.ts#L9)*

___

###  platform

• **platform**: *string*

*Defined in [packages/teraslice-cli/src/helpers/github-asset.ts:10](https://github.com/terascope/teraslice/blob/78714a985/packages/teraslice-cli/src/helpers/github-asset.ts#L10)*

___

###  user

• **user**: *string*

*Defined in [packages/teraslice-cli/src/helpers/github-asset.ts:11](https://github.com/terascope/teraslice/blob/78714a985/packages/teraslice-cli/src/helpers/github-asset.ts#L11)*

___

### `Optional` version

• **version**? : *undefined | string*

*Defined in [packages/teraslice-cli/src/helpers/github-asset.ts:13](https://github.com/terascope/teraslice/blob/78714a985/packages/teraslice-cli/src/helpers/github-asset.ts#L13)*

## Accessors

###  nodeMajorVersion

• **get nodeMajorVersion**(): *string*

*Defined in [packages/teraslice-cli/src/helpers/github-asset.ts:27](https://github.com/terascope/teraslice/blob/78714a985/packages/teraslice-cli/src/helpers/github-asset.ts#L27)*

**Returns:** *string*

## Methods

###  download

▸ **download**(`outDir`: string, `quiet`: boolean): *Promise‹any›*

*Defined in [packages/teraslice-cli/src/helpers/github-asset.ts:31](https://github.com/terascope/teraslice/blob/78714a985/packages/teraslice-cli/src/helpers/github-asset.ts#L31)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`outDir` | string | "/tmp" |
`quiet` | boolean | false |

**Returns:** *Promise‹any›*

___

### `Static` parseAssetString

▸ **parseAssetString**(`assetString`: string): *object*

*Defined in [packages/teraslice-cli/src/helpers/github-asset.ts:85](https://github.com/terascope/teraslice/blob/78714a985/packages/teraslice-cli/src/helpers/github-asset.ts#L85)*

**Parameters:**

Name | Type |
------ | ------ |
`assetString` | string |

**Returns:** *object*
