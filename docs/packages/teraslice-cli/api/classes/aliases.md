---
title: Teraslice CLI: `Aliases`
sidebar_label: Aliases
---

# Class: Aliases

## Hierarchy

* **Aliases**

## Index

### Constructors

* [constructor](aliases.md#constructor)

### Properties

* [aliasesFile](aliases.md#aliasesfile)
* [config](aliases.md#config)

### Methods

* [add](aliases.md#add)
* [list](aliases.md#list)
* [present](aliases.md#present)
* [remove](aliases.md#remove)
* [update](aliases.md#update)

## Constructors

###  constructor

\+ **new Aliases**(`aliasesFile`: string): *[Aliases](aliases.md)*

*Defined in [packages/teraslice-cli/src/helpers/aliases.ts:17](https://github.com/terascope/teraslice/blob/78714a985/packages/teraslice-cli/src/helpers/aliases.ts#L17)*

**Parameters:**

Name | Type |
------ | ------ |
`aliasesFile` | string |

**Returns:** *[Aliases](aliases.md)*

## Properties

###  aliasesFile

• **aliasesFile**: *string*

*Defined in [packages/teraslice-cli/src/helpers/aliases.ts:17](https://github.com/terascope/teraslice/blob/78714a985/packages/teraslice-cli/src/helpers/aliases.ts#L17)*

___

###  config

• **config**: *any*

*Defined in [packages/teraslice-cli/src/helpers/aliases.ts:16](https://github.com/terascope/teraslice/blob/78714a985/packages/teraslice-cli/src/helpers/aliases.ts#L16)*

## Methods

###  add

▸ **add**(`newClusterAlias`: string, `newClusterUrl`: string): *void*

*Defined in [packages/teraslice-cli/src/helpers/aliases.ts:41](https://github.com/terascope/teraslice/blob/78714a985/packages/teraslice-cli/src/helpers/aliases.ts#L41)*

**Parameters:**

Name | Type |
------ | ------ |
`newClusterAlias` | string |
`newClusterUrl` | string |

**Returns:** *void*

___

###  list

▸ **list**(`output`: string): *void*

*Defined in [packages/teraslice-cli/src/helpers/aliases.ts:52](https://github.com/terascope/teraslice/blob/78714a985/packages/teraslice-cli/src/helpers/aliases.ts#L52)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`output` | string | "txt" |

**Returns:** *void*

___

###  present

▸ **present**(`alias`: string): *boolean*

*Defined in [packages/teraslice-cli/src/helpers/aliases.ts:62](https://github.com/terascope/teraslice/blob/78714a985/packages/teraslice-cli/src/helpers/aliases.ts#L62)*

**Parameters:**

Name | Type |
------ | ------ |
`alias` | string |

**Returns:** *boolean*

___

###  remove

▸ **remove**(`clusterAlias`: string): *void*

*Defined in [packages/teraslice-cli/src/helpers/aliases.ts:66](https://github.com/terascope/teraslice/blob/78714a985/packages/teraslice-cli/src/helpers/aliases.ts#L66)*

**Parameters:**

Name | Type |
------ | ------ |
`clusterAlias` | string |

**Returns:** *void*

___

###  update

▸ **update**(`clusterAlias`: string, `newClusterUrl`: string): *void*

*Defined in [packages/teraslice-cli/src/helpers/aliases.ts:75](https://github.com/terascope/teraslice/blob/78714a985/packages/teraslice-cli/src/helpers/aliases.ts#L75)*

**Parameters:**

Name | Type |
------ | ------ |
`clusterAlias` | string |
`newClusterUrl` | string |

**Returns:** *void*
