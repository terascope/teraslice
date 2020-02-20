---
title: Teraslice CLI: `AssetSrc`
sidebar_label: AssetSrc
---

# Class: AssetSrc

## Hierarchy

* **AssetSrc**

## Index

### Constructors

* [constructor](assetsrc.md#constructor)

### Properties

* [assetFile](assetsrc.md#assetfile)
* [assetPackageJson](assetsrc.md#assetpackagejson)
* [name](assetsrc.md#name)
* [packageJson](assetsrc.md#packagejson)
* [srcDir](assetsrc.md#srcdir)
* [version](assetsrc.md#version)

### Accessors

* [buildDir](assetsrc.md#builddir)
* [zipFileName](assetsrc.md#zipfilename)

### Methods

* [build](assetsrc.md#build)
* [zip](assetsrc.md#static-zip)

## Constructors

###  constructor

\+ **new AssetSrc**(`srcDir`: string): *[AssetSrc](assetsrc.md)*

*Defined in [packages/teraslice-cli/src/helpers/asset-src.ts:25](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-cli/src/helpers/asset-src.ts#L25)*

**Parameters:**

Name | Type |
------ | ------ |
`srcDir` | string |

**Returns:** *[AssetSrc](assetsrc.md)*

## Properties

###  assetFile

• **assetFile**: *string*

*Defined in [packages/teraslice-cli/src/helpers/asset-src.ts:21](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-cli/src/helpers/asset-src.ts#L21)*

___

###  assetPackageJson

• **assetPackageJson**: *any*

*Defined in [packages/teraslice-cli/src/helpers/asset-src.ts:23](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-cli/src/helpers/asset-src.ts#L23)*

___

###  name

• **name**: *string*

*Defined in [packages/teraslice-cli/src/helpers/asset-src.ts:24](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-cli/src/helpers/asset-src.ts#L24)*

___

###  packageJson

• **packageJson**: *any*

*Defined in [packages/teraslice-cli/src/helpers/asset-src.ts:22](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-cli/src/helpers/asset-src.ts#L22)*

___

###  srcDir

• **srcDir**: *string*

*Defined in [packages/teraslice-cli/src/helpers/asset-src.ts:20](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-cli/src/helpers/asset-src.ts#L20)*

**`param`** Path to a valid asset source directory, must
must contain `asset/asset.json` and `asset/package.json` files.

___

###  version

• **version**: *string*

*Defined in [packages/teraslice-cli/src/helpers/asset-src.ts:25](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-cli/src/helpers/asset-src.ts#L25)*

## Accessors

###  buildDir

• **get buildDir**(): *string*

*Defined in [packages/teraslice-cli/src/helpers/asset-src.ts:43](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-cli/src/helpers/asset-src.ts#L43)*

**Returns:** *string*

Path to the output drectory for the finished asset zipfile

___

###  zipFileName

• **get zipFileName**(): *string*

*Defined in [packages/teraslice-cli/src/helpers/asset-src.ts:47](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-cli/src/helpers/asset-src.ts#L47)*

**Returns:** *string*

## Methods

###  build

▸ **build**(): *Promise‹string›*

*Defined in [packages/teraslice-cli/src/helpers/asset-src.ts:73](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-cli/src/helpers/asset-src.ts#L73)*

**Returns:** *Promise‹string›*

___

### `Static` zip

▸ **zip**(`tmpAssetDir`: string, `outputFileName`: string): *Promise‹ZipResults›*

*Defined in [packages/teraslice-cli/src/helpers/asset-src.ts:115](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-cli/src/helpers/asset-src.ts#L115)*

zip - Creates properly named zip archive of asset from tmpAssetDir

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`tmpAssetDir` | string | Path to the temporary asset source directory  |
`outputFileName` | string | - |

**Returns:** *Promise‹ZipResults›*
