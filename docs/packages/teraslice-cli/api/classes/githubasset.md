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

### Methods

* [download](githubasset.md#download)
* [nodeMajorVersion](githubasset.md#nodemajorversion)
* [filterRelease](githubasset.md#static-filterrelease)
* [genFilterAsset](githubasset.md#static-genfilterasset)
* [parseAssetString](githubasset.md#static-parseassetstring)

## Constructors

###  constructor

\+ **new GithubAsset**(`config`: GithubAssetConfig): *[GithubAsset](githubasset.md)*

*Defined in [helpers/github-asset.ts:24](https://github.com/terascope/teraslice/blob/0ae31df4/packages/teraslice-cli/src/helpers/github-asset.ts#L24)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | GithubAssetConfig |

**Returns:** *[GithubAsset](githubasset.md)*

## Properties

###  arch

• **arch**: *string*

*Defined in [helpers/github-asset.ts:18](https://github.com/terascope/teraslice/blob/0ae31df4/packages/teraslice-cli/src/helpers/github-asset.ts#L18)*

___

###  assetString

• **assetString**: *string*

*Defined in [helpers/github-asset.ts:19](https://github.com/terascope/teraslice/blob/0ae31df4/packages/teraslice-cli/src/helpers/github-asset.ts#L19)*

___

###  name

• **name**: *string*

*Defined in [helpers/github-asset.ts:23](https://github.com/terascope/teraslice/blob/0ae31df4/packages/teraslice-cli/src/helpers/github-asset.ts#L23)*

___

###  nodeVersion

• **nodeVersion**: *string*

*Defined in [helpers/github-asset.ts:20](https://github.com/terascope/teraslice/blob/0ae31df4/packages/teraslice-cli/src/helpers/github-asset.ts#L20)*

___

###  platform

• **platform**: *string*

*Defined in [helpers/github-asset.ts:21](https://github.com/terascope/teraslice/blob/0ae31df4/packages/teraslice-cli/src/helpers/github-asset.ts#L21)*

___

###  user

• **user**: *string*

*Defined in [helpers/github-asset.ts:22](https://github.com/terascope/teraslice/blob/0ae31df4/packages/teraslice-cli/src/helpers/github-asset.ts#L22)*

___

### `Optional` version

• **version**? : *undefined | string*

*Defined in [helpers/github-asset.ts:24](https://github.com/terascope/teraslice/blob/0ae31df4/packages/teraslice-cli/src/helpers/github-asset.ts#L24)*

## Methods

###  download

▸ **download**(`outDir`: string, `quiet`: boolean): *Promise‹any›*

*Defined in [helpers/github-asset.ts:42](https://github.com/terascope/teraslice/blob/0ae31df4/packages/teraslice-cli/src/helpers/github-asset.ts#L42)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`outDir` | string | "/tmp" |
`quiet` | boolean | false |

**Returns:** *Promise‹any›*

___

###  nodeMajorVersion

▸ **nodeMajorVersion**(): *string*

*Defined in [helpers/github-asset.ts:38](https://github.com/terascope/teraslice/blob/0ae31df4/packages/teraslice-cli/src/helpers/github-asset.ts#L38)*

**Returns:** *string*

___

### `Static` filterRelease

▸ **filterRelease**(`release`: ReleaseConfig): *boolean*

*Defined in [helpers/github-asset.ts:70](https://github.com/terascope/teraslice/blob/0ae31df4/packages/teraslice-cli/src/helpers/github-asset.ts#L70)*

**Parameters:**

Name | Type |
------ | ------ |
`release` | ReleaseConfig |

**Returns:** *boolean*

___

### `Static` genFilterAsset

▸ **genFilterAsset**(`nodeMajorVersion`: string, `platform`: string, `arch`: string): *(Anonymous function)*

*Defined in [helpers/github-asset.ts:74](https://github.com/terascope/teraslice/blob/0ae31df4/packages/teraslice-cli/src/helpers/github-asset.ts#L74)*

**Parameters:**

Name | Type |
------ | ------ |
`nodeMajorVersion` | string |
`platform` | string |
`arch` | string |

**Returns:** *(Anonymous function)*

___

### `Static` parseAssetString

▸ **parseAssetString**(`assetString`: string): *object*

*Defined in [helpers/github-asset.ts:96](https://github.com/terascope/teraslice/blob/0ae31df4/packages/teraslice-cli/src/helpers/github-asset.ts#L96)*

**Parameters:**

Name | Type |
------ | ------ |
`assetString` | string |

**Returns:** *object*
