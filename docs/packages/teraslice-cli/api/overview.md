---
title: Teraslice CLI API Overview
sidebar_label: API
---

## Index

### Classes

* [Aliases](classes/aliases.md)
* [AssetSrc](classes/assetsrc.md)
* [Config](classes/config.md)
* [GithubAsset](classes/githubasset.md)
* [JobFile](classes/jobfile.md)
* [Jobs](classes/jobs.md)
* [Options](classes/options.md)
* [Reply](classes/reply.md)
* [TerasliceUtil](classes/terasliceutil.md)
* [TjmUtil](classes/tjmutil.md)
* [Url](classes/url.md)
* [default](classes/default.md)

### Type aliases

* [CMD](overview.md#cmd)

### Functions

* [annotate](overview.md#annotate)
* [displayModule](overview.md#displaymodule)
* [getPackage](overview.md#getpackage)
* [getTemplatePath](overview.md#gettemplatepath)
* [getTerasliceClient](overview.md#getterasliceclient)
* [getTerasliceClusterType](overview.md#getterasliceclustertype)
* [handleWrapper](overview.md#handlewrapper)

## Type aliases

###  CMD

Ƭ **CMD**: *CommandModule*

*Defined in [interfaces.ts:4](https://github.com/terascope/teraslice/blob/0ae31df4/packages/teraslice-cli/src/interfaces.ts#L4)*

## Functions

###  annotate

▸ **annotate**(`cliConfig`: any): *Promise‹object›*

*Defined in [cmds/lib/annotation.ts:39](https://github.com/terascope/teraslice/blob/0ae31df4/packages/teraslice-cli/src/cmds/lib/annotation.ts#L39)*

**Parameters:**

Name | Type |
------ | ------ |
`cliConfig` | any |

**Returns:** *Promise‹object›*

___

###  displayModule

▸ **displayModule**(): *object*

*Defined in [cmds/lib/display.ts:118](https://github.com/terascope/teraslice/blob/0ae31df4/packages/teraslice-cli/src/cmds/lib/display.ts#L118)*

**Returns:** *object*

___

###  getPackage

▸ **getPackage**(`filePath?`: undefined | string): *any*

*Defined in [helpers/utils.ts:8](https://github.com/terascope/teraslice/blob/0ae31df4/packages/teraslice-cli/src/helpers/utils.ts#L8)*

**Parameters:**

Name | Type |
------ | ------ |
`filePath?` | undefined \| string |

**Returns:** *any*

___

###  getTemplatePath

▸ **getTemplatePath**(`name`: string): *string*

*Defined in [generators/utils.ts:4](https://github.com/terascope/teraslice/blob/0ae31df4/packages/teraslice-cli/src/generators/utils.ts#L4)*

**Parameters:**

Name | Type |
------ | ------ |
`name` | string |

**Returns:** *string*

___

###  getTerasliceClient

▸ **getTerasliceClient**(`cliConfig`: any): *TerasliceClient*

*Defined in [helpers/utils.ts:18](https://github.com/terascope/teraslice/blob/0ae31df4/packages/teraslice-cli/src/helpers/utils.ts#L18)*

**Parameters:**

Name | Type |
------ | ------ |
`cliConfig` | any |

**Returns:** *TerasliceClient*

___

###  getTerasliceClusterType

▸ **getTerasliceClusterType**(`terasliceClient`: any): *Promise‹string›*

*Defined in [helpers/utils.ts:23](https://github.com/terascope/teraslice/blob/0ae31df4/packages/teraslice-cli/src/helpers/utils.ts#L23)*

**Parameters:**

Name | Type |
------ | ------ |
`terasliceClient` | any |

**Returns:** *Promise‹string›*

___

###  handleWrapper

▸ **handleWrapper**(`fn`: any): *(Anonymous function)*

*Defined in [helpers/utils.ts:43](https://github.com/terascope/teraslice/blob/0ae31df4/packages/teraslice-cli/src/helpers/utils.ts#L43)*

**Parameters:**

Name | Type |
------ | ------ |
`fn` | any |

**Returns:** *(Anonymous function)*
