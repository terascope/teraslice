---
title: Teraslice CLI: `Config`
sidebar_label: Config
---

# Class: Config

This is the top level config object, it manages the config directory and
sub command configurations can be added on to this as properties.  Config
objects should only be used to make derived properties but should avoid
copying command line arguments or options, those should be accessed via the
.args object (which should not be modified)

NOTE: All properties on this.args are mapped to camelCase

## Hierarchy

* **Config**

## Index

### Constructors

* [constructor](config.md#constructor)

### Properties

* [aliases](config.md#aliases)
* [args](config.md#args)

### Accessors

* [aliasesFile](config.md#aliasesfile)
* [allSubDirs](config.md#allsubdirs)
* [assetDir](config.md#assetdir)
* [clusterUrl](config.md#clusterurl)
* [jobStateDir](config.md#jobstatedir)
* [jobStateFile](config.md#jobstatefile)

## Constructors

###  constructor

\+ **new Config**(`cliArgs`: any): *[Config](config.md)*

*Defined in [packages/teraslice-cli/src/helpers/config.ts:19](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-cli/src/helpers/config.ts#L19)*

**Parameters:**

Name | Type |
------ | ------ |
`cliArgs` | any |

**Returns:** *[Config](config.md)*

## Properties

###  aliases

• **aliases**: *[Aliases](aliases.md)*

*Defined in [packages/teraslice-cli/src/helpers/config.ts:19](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-cli/src/helpers/config.ts#L19)*

___

###  args

• **args**: *any*

*Defined in [packages/teraslice-cli/src/helpers/config.ts:18](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-cli/src/helpers/config.ts#L18)*

## Accessors

###  aliasesFile

• **get aliasesFile**(): *string*

*Defined in [packages/teraslice-cli/src/helpers/config.ts:64](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-cli/src/helpers/config.ts#L64)*

**Returns:** *string*

___

###  allSubDirs

• **get allSubDirs**(): *string[]*

*Defined in [packages/teraslice-cli/src/helpers/config.ts:80](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-cli/src/helpers/config.ts#L80)*

**Returns:** *string[]*

___

###  assetDir

• **get assetDir**(): *string*

*Defined in [packages/teraslice-cli/src/helpers/config.ts:76](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-cli/src/helpers/config.ts#L76)*

**Returns:** *string*

___

###  clusterUrl

• **get clusterUrl**(): *any*

*Defined in [packages/teraslice-cli/src/helpers/config.ts:53](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-cli/src/helpers/config.ts#L53)*

Returns the URL of the appropriate cluster with the following order of
precedence:

  * this.args.clusterUrl
  * URL found in config file using clusterAlias

This implies that any command requiring clusterUrl or terasliceClient
should provide both the cluster-alias argument and the cluster-url option
Also, any command needing clusterUrl should use this instead of the cli
equivalents.

**Returns:** *any*

___

###  jobStateDir

• **get jobStateDir**(): *string*

*Defined in [packages/teraslice-cli/src/helpers/config.ts:68](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-cli/src/helpers/config.ts#L68)*

**Returns:** *string*

___

###  jobStateFile

• **get jobStateFile**(): *string*

*Defined in [packages/teraslice-cli/src/helpers/config.ts:72](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-cli/src/helpers/config.ts#L72)*

**Returns:** *string*
