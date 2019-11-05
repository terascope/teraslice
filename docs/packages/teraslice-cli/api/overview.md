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

*Defined in [interfaces.ts:4](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-cli/src/interfaces.ts#L4)*

## Functions

###  annotate

▸ **annotate**(`cliConfig`: any): *Promise‹object›*

*Defined in [cmds/lib/annotation.ts:39](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-cli/src/cmds/lib/annotation.ts#L39)*

**Parameters:**

Name | Type |
------ | ------ |
`cliConfig` | any |

**Returns:** *Promise‹object›*

___

###  camelCase

▸ **camelCase**(`str`: string): *string*

*Defined in [helpers/utils.ts:29](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-cli/src/helpers/utils.ts#L29)*

**Parameters:**

Name | Type |
------ | ------ |
`str` | string |

**Returns:** *string*

___

###  displayModule

▸ **displayModule**(): *object*

*Defined in [cmds/lib/display.ts:118](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-cli/src/cmds/lib/display.ts#L118)*

**Returns:** *object*

___

###  getPackage

▸ **getPackage**(`filePath?`: undefined | string): *any*

*Defined in [helpers/utils.ts:34](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-cli/src/helpers/utils.ts#L34)*

**Parameters:**

Name | Type |
------ | ------ |
`filePath?` | undefined &#124; string |

**Returns:** *any*

___

###  getTemplatePath

▸ **getTemplatePath**(`name`: string): *string*

*Defined in [generators/utils.ts:4](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-cli/src/generators/utils.ts#L4)*

**Parameters:**

Name | Type |
------ | ------ |
`name` | string |

**Returns:** *string*

___

###  getTerasliceClient

▸ **getTerasliceClient**(`cliConfig`: any): *TerasliceClient*

*Defined in [helpers/utils.ts:44](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-cli/src/helpers/utils.ts#L44)*

**Parameters:**

Name | Type |
------ | ------ |
`cliConfig` | any |

**Returns:** *TerasliceClient*

___

###  getTerasliceClusterType

▸ **getTerasliceClusterType**(`terasliceClient`: any): *Promise‹string›*

*Defined in [helpers/utils.ts:49](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-cli/src/helpers/utils.ts#L49)*

**Parameters:**

Name | Type |
------ | ------ |
`terasliceClient` | any |

**Returns:** *Promise‹string›*

___

###  handleWrapper

▸ **handleWrapper**(`fn`: any): *(Anonymous function)*

*Defined in [helpers/utils.ts:69](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-cli/src/helpers/utils.ts#L69)*

**Parameters:**

Name | Type |
------ | ------ |
`fn` | any |

**Returns:** *(Anonymous function)*

___

###  kebabCase

▸ **kebabCase**(`str`: string): *string*

*Defined in [helpers/utils.ts:12](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-cli/src/helpers/utils.ts#L12)*

**Parameters:**

Name | Type |
------ | ------ |
`str` | string |

**Returns:** *string*

___

###  snakeCase

▸ **snakeCase**(`str`: string): *string*

*Defined in [helpers/utils.ts:19](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-cli/src/helpers/utils.ts#L19)*

**Parameters:**

Name | Type |
------ | ------ |
`str` | string |

**Returns:** *string*
