---
title: Teraslice CLI API Overview
sidebar_label: API
---

## Index

### Classes

* [Aliases](classes/aliases.md)
* [AssetSrc](classes/assetsrc.md)
* [Config](classes/config.md)
* [Executions](classes/executions.md)
* [GithubAsset](classes/githubasset.md)
* [JobFile](classes/jobfile.md)
* [Jobs](classes/jobs.md)
* [Options](classes/options.md)
* [Reply](classes/reply.md)
* [TerasliceUtil](classes/terasliceutil.md)
* [TjmUtil](classes/tjmutil.md)
* [Url](classes/url.md)
* [default](classes/default.md)

### Interfaces

* [GithubAssetConfig](interfaces/githubassetconfig.md)

### Type aliases

* [CMD](overview.md#cmd)

### Functions

* [annotate](overview.md#annotate)
* [camelCase](overview.md#camelcase)
* [displayModule](overview.md#displaymodule)
* [getPackage](overview.md#getpackage)
* [getTemplatePath](overview.md#gettemplatepath)
* [getTerasliceClient](overview.md#getterasliceclient)
* [getTerasliceClusterType](overview.md#getterasliceclustertype)
* [handleWrapper](overview.md#handlewrapper)
* [kebabCase](overview.md#kebabcase)
* [snakeCase](overview.md#snakecase)

## Type aliases

###  CMD

Ƭ **CMD**: *CommandModule*

*Defined in [packages/teraslice-cli/src/interfaces.ts:3](https://github.com/terascope/teraslice/blob/f95bb5556/packages/teraslice-cli/src/interfaces.ts#L3)*

## Functions

###  annotate

▸ **annotate**(`cliConfig`: any): *Promise‹object›*

*Defined in [packages/teraslice-cli/src/cmds/lib/annotation.ts:38](https://github.com/terascope/teraslice/blob/f95bb5556/packages/teraslice-cli/src/cmds/lib/annotation.ts#L38)*

**Parameters:**

Name | Type |
------ | ------ |
`cliConfig` | any |

**Returns:** *Promise‹object›*

___

###  camelCase

▸ **camelCase**(`str`: string): *string*

*Defined in [packages/teraslice-cli/src/helpers/utils.ts:28](https://github.com/terascope/teraslice/blob/f95bb5556/packages/teraslice-cli/src/helpers/utils.ts#L28)*

**Parameters:**

Name | Type |
------ | ------ |
`str` | string |

**Returns:** *string*

___

###  displayModule

▸ **displayModule**(): *object*

*Defined in [packages/teraslice-cli/src/cmds/lib/display.ts:118](https://github.com/terascope/teraslice/blob/f95bb5556/packages/teraslice-cli/src/cmds/lib/display.ts#L118)*

**Returns:** *object*

___

###  getPackage

▸ **getPackage**(`filePath?`: undefined | string): *any*

*Defined in [packages/teraslice-cli/src/helpers/utils.ts:33](https://github.com/terascope/teraslice/blob/f95bb5556/packages/teraslice-cli/src/helpers/utils.ts#L33)*

**Parameters:**

Name | Type |
------ | ------ |
`filePath?` | undefined &#124; string |

**Returns:** *any*

___

###  getTemplatePath

▸ **getTemplatePath**(`name`: string): *string*

*Defined in [packages/teraslice-cli/src/generators/utils.ts:4](https://github.com/terascope/teraslice/blob/f95bb5556/packages/teraslice-cli/src/generators/utils.ts#L4)*

**Parameters:**

Name | Type |
------ | ------ |
`name` | string |

**Returns:** *string*

___

###  getTerasliceClient

▸ **getTerasliceClient**(`cliConfig`: any): *TerasliceClient*

*Defined in [packages/teraslice-cli/src/helpers/utils.ts:43](https://github.com/terascope/teraslice/blob/f95bb5556/packages/teraslice-cli/src/helpers/utils.ts#L43)*

**Parameters:**

Name | Type |
------ | ------ |
`cliConfig` | any |

**Returns:** *TerasliceClient*

___

###  getTerasliceClusterType

▸ **getTerasliceClusterType**(`terasliceClient`: any): *Promise‹string›*

*Defined in [packages/teraslice-cli/src/helpers/utils.ts:48](https://github.com/terascope/teraslice/blob/f95bb5556/packages/teraslice-cli/src/helpers/utils.ts#L48)*

**Parameters:**

Name | Type |
------ | ------ |
`terasliceClient` | any |

**Returns:** *Promise‹string›*

___

###  handleWrapper

▸ **handleWrapper**(`fn`: any): *(Anonymous function)*

*Defined in [packages/teraslice-cli/src/helpers/utils.ts:68](https://github.com/terascope/teraslice/blob/f95bb5556/packages/teraslice-cli/src/helpers/utils.ts#L68)*

**Parameters:**

Name | Type |
------ | ------ |
`fn` | any |

**Returns:** *(Anonymous function)*

___

###  kebabCase

▸ **kebabCase**(`str`: string): *string*

*Defined in [packages/teraslice-cli/src/helpers/utils.ts:11](https://github.com/terascope/teraslice/blob/f95bb5556/packages/teraslice-cli/src/helpers/utils.ts#L11)*

**Parameters:**

Name | Type |
------ | ------ |
`str` | string |

**Returns:** *string*

___

###  snakeCase

▸ **snakeCase**(`str`: string): *string*

*Defined in [packages/teraslice-cli/src/helpers/utils.ts:18](https://github.com/terascope/teraslice/blob/f95bb5556/packages/teraslice-cli/src/helpers/utils.ts#L18)*

**Parameters:**

Name | Type |
------ | ------ |
`str` | string |

**Returns:** *string*
