---
title: Docker Compose Js: `Compose`
sidebar_label: Compose
---

# Class: Compose

## Hierarchy

* **Compose**

## Index

### Constructors

* [constructor](compose.md#constructor)

### Properties

* [composeFile](compose.md#composefile)

### Methods

* [build](compose.md#build)
* [create](compose.md#create)
* [down](compose.md#down)
* [kill](compose.md#kill)
* [pause](compose.md#pause)
* [port](compose.md#port)
* [ps](compose.md#ps)
* [pull](compose.md#pull)
* [restart](compose.md#restart)
* [rm](compose.md#rm)
* [runCmd](compose.md#runcmd)
* [scale](compose.md#scale)
* [start](compose.md#start)
* [stop](compose.md#stop)
* [unpause](compose.md#unpause)
* [up](compose.md#up)
* [version](compose.md#version)

## Constructors

###  constructor

\+ **new Compose**(`composeFile`: string): *[Compose](compose.md)*

*Defined in [index.ts:13](https://github.com/terascope/teraslice/blob/b843209f9/packages/docker-compose-js/src/index.ts#L13)*

**Parameters:**

Name | Type |
------ | ------ |
`composeFile` | string |

**Returns:** *[Compose](compose.md)*

## Properties

###  composeFile

• **composeFile**: *string*

*Defined in [index.ts:13](https://github.com/terascope/teraslice/blob/b843209f9/packages/docker-compose-js/src/index.ts#L13)*

## Methods

###  build

▸ **build**(`options?`: [RunOptions](../overview.md#runoptions)): *Promise‹unknown›*

*Defined in [index.ts:97](https://github.com/terascope/teraslice/blob/b843209f9/packages/docker-compose-js/src/index.ts#L97)*

**Parameters:**

Name | Type |
------ | ------ |
`options?` | [RunOptions](../overview.md#runoptions) |

**Returns:** *Promise‹unknown›*

___

###  create

▸ **create**(`services?`: Services, `options?`: [RunOptions](../overview.md#runoptions)): *Promise‹unknown›*

*Defined in [index.ts:121](https://github.com/terascope/teraslice/blob/b843209f9/packages/docker-compose-js/src/index.ts#L121)*

**Parameters:**

Name | Type |
------ | ------ |
`services?` | Services |
`options?` | [RunOptions](../overview.md#runoptions) |

**Returns:** *Promise‹unknown›*

___

###  down

▸ **down**(`options?`: [RunOptions](../overview.md#runoptions)): *Promise‹unknown›*

*Defined in [index.ts:100](https://github.com/terascope/teraslice/blob/b843209f9/packages/docker-compose-js/src/index.ts#L100)*

**Parameters:**

Name | Type |
------ | ------ |
`options?` | [RunOptions](../overview.md#runoptions) |

**Returns:** *Promise‹unknown›*

___

###  kill

▸ **kill**(`services?`: Services, `options?`: [RunOptions](../overview.md#runoptions)): *Promise‹unknown›*

*Defined in [index.ts:115](https://github.com/terascope/teraslice/blob/b843209f9/packages/docker-compose-js/src/index.ts#L115)*

**Parameters:**

Name | Type |
------ | ------ |
`services?` | Services |
`options?` | [RunOptions](../overview.md#runoptions) |

**Returns:** *Promise‹unknown›*

___

###  pause

▸ **pause**(`services?`: Services, `options?`: [RunOptions](../overview.md#runoptions)): *Promise‹unknown›*

*Defined in [index.ts:127](https://github.com/terascope/teraslice/blob/b843209f9/packages/docker-compose-js/src/index.ts#L127)*

**Parameters:**

Name | Type |
------ | ------ |
`services?` | Services |
`options?` | [RunOptions](../overview.md#runoptions) |

**Returns:** *Promise‹unknown›*

___

###  port

▸ **port**(`service`: string, `privatePort`: number | string, `options?`: [RunOptions](../overview.md#runoptions)): *Promise‹unknown›*

*Defined in [index.ts:139](https://github.com/terascope/teraslice/blob/b843209f9/packages/docker-compose-js/src/index.ts#L139)*

**Parameters:**

Name | Type |
------ | ------ |
`service` | string |
`privatePort` | number &#124; string |
`options?` | [RunOptions](../overview.md#runoptions) |

**Returns:** *Promise‹unknown›*

___

###  ps

▸ **ps**(`options?`: [RunOptions](../overview.md#runoptions)): *Promise‹unknown›*

*Defined in [index.ts:103](https://github.com/terascope/teraslice/blob/b843209f9/packages/docker-compose-js/src/index.ts#L103)*

**Parameters:**

Name | Type |
------ | ------ |
`options?` | [RunOptions](../overview.md#runoptions) |

**Returns:** *Promise‹unknown›*

___

###  pull

▸ **pull**(`services?`: Services, `options?`: [RunOptions](../overview.md#runoptions)): *Promise‹unknown›*

*Defined in [index.ts:118](https://github.com/terascope/teraslice/blob/b843209f9/packages/docker-compose-js/src/index.ts#L118)*

**Parameters:**

Name | Type |
------ | ------ |
`services?` | Services |
`options?` | [RunOptions](../overview.md#runoptions) |

**Returns:** *Promise‹unknown›*

___

###  restart

▸ **restart**(`services?`: Services, `options?`: [RunOptions](../overview.md#runoptions)): *Promise‹unknown›*

*Defined in [index.ts:112](https://github.com/terascope/teraslice/blob/b843209f9/packages/docker-compose-js/src/index.ts#L112)*

**Parameters:**

Name | Type |
------ | ------ |
`services?` | Services |
`options?` | [RunOptions](../overview.md#runoptions) |

**Returns:** *Promise‹unknown›*

___

###  rm

▸ **rm**(`services?`: Services, `options?`: [RunOptions](../overview.md#runoptions)): *Promise‹unknown›*

*Defined in [index.ts:136](https://github.com/terascope/teraslice/blob/b843209f9/packages/docker-compose-js/src/index.ts#L136)*

**Parameters:**

Name | Type |
------ | ------ |
`services?` | Services |
`options?` | [RunOptions](../overview.md#runoptions) |

**Returns:** *Promise‹unknown›*

___

###  runCmd

▸ **runCmd**(`command`: string, `options`: [RunOptions](../overview.md#runoptions), `services?`: Services, ...`extraParams`: Arg[]): *Promise‹unknown›*

*Defined in [index.ts:18](https://github.com/terascope/teraslice/blob/b843209f9/packages/docker-compose-js/src/index.ts#L18)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`command` | string | - |
`options` | [RunOptions](../overview.md#runoptions) |  {} |
`services?` | Services | - |
`...extraParams` | Arg[] | - |

**Returns:** *Promise‹unknown›*

___

###  scale

▸ **scale**(`services?`: Services, `options?`: [RunOptions](../overview.md#runoptions)): *Promise‹unknown›*

*Defined in [index.ts:133](https://github.com/terascope/teraslice/blob/b843209f9/packages/docker-compose-js/src/index.ts#L133)*

**Parameters:**

Name | Type |
------ | ------ |
`services?` | Services |
`options?` | [RunOptions](../overview.md#runoptions) |

**Returns:** *Promise‹unknown›*

___

###  start

▸ **start**(`services?`: Services, `options?`: [RunOptions](../overview.md#runoptions)): *Promise‹unknown›*

*Defined in [index.ts:106](https://github.com/terascope/teraslice/blob/b843209f9/packages/docker-compose-js/src/index.ts#L106)*

**Parameters:**

Name | Type |
------ | ------ |
`services?` | Services |
`options?` | [RunOptions](../overview.md#runoptions) |

**Returns:** *Promise‹unknown›*

___

###  stop

▸ **stop**(`services?`: Services, `options?`: [RunOptions](../overview.md#runoptions)): *Promise‹unknown›*

*Defined in [index.ts:109](https://github.com/terascope/teraslice/blob/b843209f9/packages/docker-compose-js/src/index.ts#L109)*

**Parameters:**

Name | Type |
------ | ------ |
`services?` | Services |
`options?` | [RunOptions](../overview.md#runoptions) |

**Returns:** *Promise‹unknown›*

___

###  unpause

▸ **unpause**(`services?`: Services, `options?`: [RunOptions](../overview.md#runoptions)): *Promise‹unknown›*

*Defined in [index.ts:130](https://github.com/terascope/teraslice/blob/b843209f9/packages/docker-compose-js/src/index.ts#L130)*

**Parameters:**

Name | Type |
------ | ------ |
`services?` | Services |
`options?` | [RunOptions](../overview.md#runoptions) |

**Returns:** *Promise‹unknown›*

___

###  up

▸ **up**(`options`: [RunOptions](../overview.md#runoptions), `services?`: string[] | string): *Promise‹unknown›*

*Defined in [index.ts:93](https://github.com/terascope/teraslice/blob/b843209f9/packages/docker-compose-js/src/index.ts#L93)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`options` | [RunOptions](../overview.md#runoptions) |  {} |
`services?` | string[] &#124; string | - |

**Returns:** *Promise‹unknown›*

___

###  version

▸ **version**(`options?`: [RunOptions](../overview.md#runoptions)): *Promise‹unknown›*

*Defined in [index.ts:124](https://github.com/terascope/teraslice/blob/b843209f9/packages/docker-compose-js/src/index.ts#L124)*

**Parameters:**

Name | Type |
------ | ------ |
`options?` | [RunOptions](../overview.md#runoptions) |

**Returns:** *Promise‹unknown›*
