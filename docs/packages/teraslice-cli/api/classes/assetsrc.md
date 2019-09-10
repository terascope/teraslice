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

*Defined in [helpers/asset-src.ts:26](https://github.com/terascope/teraslice/blob/0ae31df4/packages/teraslice-cli/src/helpers/asset-src.ts#L26)*

**Parameters:**

Name | Type |
------ | ------ |
`srcDir` | string |

**Returns:** *[AssetSrc](assetsrc.md)*

## Properties

###  assetFile

• **assetFile**: *string*

*Defined in [helpers/asset-src.ts:22](https://github.com/terascope/teraslice/blob/0ae31df4/packages/teraslice-cli/src/helpers/asset-src.ts#L22)*

___

###  assetPackageJson

• **assetPackageJson**: *any*

*Defined in [helpers/asset-src.ts:24](https://github.com/terascope/teraslice/blob/0ae31df4/packages/teraslice-cli/src/helpers/asset-src.ts#L24)*

___

###  name

• **name**: *string*

*Defined in [helpers/asset-src.ts:25](https://github.com/terascope/teraslice/blob/0ae31df4/packages/teraslice-cli/src/helpers/asset-src.ts#L25)*

___

###  packageJson

• **packageJson**: *any*

*Defined in [helpers/asset-src.ts:23](https://github.com/terascope/teraslice/blob/0ae31df4/packages/teraslice-cli/src/helpers/asset-src.ts#L23)*

___

###  srcDir

• **srcDir**: *string*

*Defined in [helpers/asset-src.ts:21](https://github.com/terascope/teraslice/blob/0ae31df4/packages/teraslice-cli/src/helpers/asset-src.ts#L21)*

**`param`** Path to a valid asset source directory, must
must contain `asset/asset.json` and `asset/package.json` files.

___

###  version

• **version**: *string*

*Defined in [helpers/asset-src.ts:26](https://github.com/terascope/teraslice/blob/0ae31df4/packages/teraslice-cli/src/helpers/asset-src.ts#L26)*

## Accessors

###  buildDir

• **get buildDir**(): *string*

*Defined in [helpers/asset-src.ts:44](https://github.com/terascope/teraslice/blob/0ae31df4/packages/teraslice-cli/src/helpers/asset-src.ts#L44)*

**Returns:** *string*

Path to the output drectory for the finished asset zipfile

___

###  zipFileName

• **get zipFileName**(): *string*

*Defined in [helpers/asset-src.ts:48](https://github.com/terascope/teraslice/blob/0ae31df4/packages/teraslice-cli/src/helpers/asset-src.ts#L48)*

**Returns:** *string*

## Methods

###  build

▸ **build**(): *Promise‹string›*

*Defined in [helpers/asset-src.ts:74](https://github.com/terascope/teraslice/blob/0ae31df4/packages/teraslice-cli/src/helpers/asset-src.ts#L74)*

**Returns:** *Promise‹string›*

___

### `Static` zip

▸ **zip**(`tmpAssetDir`: string, `outputFileName`: string): *Promise‹ZipResults›*

*Defined in [helpers/asset-src.ts:116](https://github.com/terascope/teraslice/blob/0ae31df4/packages/teraslice-cli/src/helpers/asset-src.ts#L116)*

zip - Creates properly named zip archive of asset from tmpAssetDir

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`tmpAssetDir` | string | Path to the temporary asset source directory  |
`outputFileName` | string | - |

**Returns:** *Promise‹ZipResults›*
