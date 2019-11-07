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

*Defined in [helpers/aliases.ts:18](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-cli/src/helpers/aliases.ts#L18)*

**Parameters:**

Name | Type |
------ | ------ |
`aliasesFile` | string |

**Returns:** *[Aliases](aliases.md)*

## Properties

###  aliasesFile

• **aliasesFile**: *string*

*Defined in [helpers/aliases.ts:18](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-cli/src/helpers/aliases.ts#L18)*

___

###  config

• **config**: *any*

*Defined in [helpers/aliases.ts:17](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-cli/src/helpers/aliases.ts#L17)*

## Methods

###  add

▸ **add**(`newClusterAlias`: string, `newClusterUrl`: string): *void*

*Defined in [helpers/aliases.ts:42](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-cli/src/helpers/aliases.ts#L42)*

**Parameters:**

Name | Type |
------ | ------ |
`newClusterAlias` | string |
`newClusterUrl` | string |

**Returns:** *void*

___

###  list

▸ **list**(`output`: string): *void*

*Defined in [helpers/aliases.ts:53](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-cli/src/helpers/aliases.ts#L53)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`output` | string | "txt" |

**Returns:** *void*

___

###  present

▸ **present**(`alias`: string): *boolean*

*Defined in [helpers/aliases.ts:63](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-cli/src/helpers/aliases.ts#L63)*

**Parameters:**

Name | Type |
------ | ------ |
`alias` | string |

**Returns:** *boolean*

___

###  remove

▸ **remove**(`clusterAlias`: string): *void*

*Defined in [helpers/aliases.ts:67](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-cli/src/helpers/aliases.ts#L67)*

**Parameters:**

Name | Type |
------ | ------ |
`clusterAlias` | string |

**Returns:** *void*

___

###  update

▸ **update**(`clusterAlias`: string, `newClusterUrl`: string): *void*

*Defined in [helpers/aliases.ts:76](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-cli/src/helpers/aliases.ts#L76)*

**Parameters:**

Name | Type |
------ | ------ |
`clusterAlias` | string |
`newClusterUrl` | string |

**Returns:** *void*
