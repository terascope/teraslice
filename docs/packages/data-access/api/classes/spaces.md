---
title: Data Access: `Spaces`
sidebar_label: Spaces
---

# Class: Spaces

Manager for Spaces

## Hierarchy

* IndexModel‹[Space](../interfaces/space.md)›

  * **Spaces**

## Index

### Constructors

* [constructor](spaces.md#constructor)

### Properties

* [logger](spaces.md#logger)
* [name](spaces.md#name)
* [store](spaces.md#store)
* [xluceneTypeConfig](spaces.md#xlucenetypeconfig)
* [IndexModelConfig](spaces.md#static-indexmodelconfig)
* [ReservedEndpoints](spaces.md#static-reservedendpoints)

### Methods

* [_appendToArray](spaces.md#protected-_appendtoarray)
* [_createJoinQuery](spaces.md#protected-_createjoinquery)
* [_ensureUnique](spaces.md#protected-_ensureunique)
* [_find](spaces.md#protected-_find)
* [_postProcess](spaces.md#protected-_postprocess)
* [_preProcess](spaces.md#protected-_preprocess)
* [_removeFromArray](spaces.md#protected-_removefromarray)
* [_sanitizeRecord](spaces.md#protected-_sanitizerecord)
* [_updateWith](spaces.md#protected-_updatewith)
* [addViewsToSpace](spaces.md#addviewstospace)
* [count](spaces.md#count)
* [countBy](spaces.md#countby)
* [create](spaces.md#create)
* [deleteAll](spaces.md#deleteall)
* [deleteById](spaces.md#deletebyid)
* [exists](spaces.md#exists)
* [find](spaces.md#find)
* [findAll](spaces.md#findall)
* [findAndApply](spaces.md#findandapply)
* [findBy](spaces.md#findby)
* [findByAnyId](spaces.md#findbyanyid)
* [findById](spaces.md#findbyid)
* [initialize](spaces.md#initialize)
* [removeViewFromSpaces](spaces.md#removeviewfromspaces)
* [removeViewsFromSpace](spaces.md#removeviewsfromspace)
* [shutdown](spaces.md#shutdown)
* [update](spaces.md#update)

## Constructors

###  constructor

\+ **new Spaces**(`client`: Client, `options`: IndexModelOptions): *[Spaces](spaces.md)*

*Overrides void*

*Defined in [models/spaces.ts:13](https://github.com/terascope/teraslice/blob/d2d877b60/packages/data-access/src/models/spaces.ts#L13)*

**Parameters:**

Name | Type |
------ | ------ |
`client` | Client |
`options` | IndexModelOptions |

**Returns:** *[Spaces](spaces.md)*

## Properties

###  logger

• **logger**: *Logger*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:13

___

###  name

• **name**: *string*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:12

___

###  store

• **store**: *IndexStore‹[Space](../interfaces/space.md)›*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:11

___

###  xluceneTypeConfig

• **xluceneTypeConfig**: *TypeConfig | undefined*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:17

___

### `Static` IndexModelConfig

▪ **IndexModelConfig**: *IndexModelConfig‹[Space](../interfaces/space.md)›* =  spacesConfig

*Defined in [models/spaces.ts:12](https://github.com/terascope/teraslice/blob/d2d877b60/packages/data-access/src/models/spaces.ts#L12)*

___

### `Static` ReservedEndpoints

▪ **ReservedEndpoints**: *string[]* =  ['data-access', 'qp']

*Defined in [models/spaces.ts:13](https://github.com/terascope/teraslice/blob/d2d877b60/packages/data-access/src/models/spaces.ts#L13)*

## Methods

### `Protected` _appendToArray

▸ **_appendToArray**(`id`: string, `field`: keyof Space, `values`: string[] | string): *Promise‹void›*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:34

**Parameters:**

Name | Type |
------ | ------ |
`id` | string |
`field` | keyof Space |
`values` | string[] \| string |

**Returns:** *Promise‹void›*

___

### `Protected` _createJoinQuery

▸ **_createJoinQuery**(`fields`: AnyInput‹[Space](../interfaces/space.md)›, `joinBy?`: JoinBy, `arrayJoinBy?`: JoinBy): *string*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:41

**Parameters:**

Name | Type |
------ | ------ |
`fields` | AnyInput‹[Space](../interfaces/space.md)› |
`joinBy?` | JoinBy |
`arrayJoinBy?` | JoinBy |

**Returns:** *string*

___

### `Protected` _ensureUnique

▸ **_ensureUnique**(`record`: [Space](../interfaces/space.md), `existing?`: [T]()): *Promise‹void›*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:37

**Parameters:**

Name | Type |
------ | ------ |
`record` | [Space](../interfaces/space.md) |
`existing?` | [T]() |

**Returns:** *Promise‹void›*

___

### `Protected` _find

▸ **_find**(`q?`: undefined | string, `options?`: i.FindOptions‹[Space](../interfaces/space.md)›, `queryAccess?`: QueryAccess‹[Space](../interfaces/space.md)›): *Promise‹[Space](../interfaces/space.md)[]›*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:36

**Parameters:**

Name | Type |
------ | ------ |
`q?` | undefined \| string |
`options?` | i.FindOptions‹[Space](../interfaces/space.md)› |
`queryAccess?` | QueryAccess‹[Space](../interfaces/space.md)› |

**Returns:** *Promise‹[Space](../interfaces/space.md)[]›*

___

### `Protected` _postProcess

▸ **_postProcess**(`record`: [Space](../interfaces/space.md)): *[Space](../interfaces/space.md)*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:39

**Parameters:**

Name | Type |
------ | ------ |
`record` | [Space](../interfaces/space.md) |

**Returns:** *[Space](../interfaces/space.md)*

___

### `Protected` _preProcess

▸ **_preProcess**(`record`: [Space](../interfaces/space.md)): *[Space](../interfaces/space.md)*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:40

**Parameters:**

Name | Type |
------ | ------ |
`record` | [Space](../interfaces/space.md) |

**Returns:** *[Space](../interfaces/space.md)*

___

### `Protected` _removeFromArray

▸ **_removeFromArray**(`id`: string, `field`: keyof Space, `values`: string[] | string): *Promise‹void›*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:35

**Parameters:**

Name | Type |
------ | ------ |
`id` | string |
`field` | keyof Space |
`values` | string[] \| string |

**Returns:** *Promise‹void›*

___

### `Protected` _sanitizeRecord

▸ **_sanitizeRecord**(`record`: [Space](../interfaces/space.md)): *[Space](../interfaces/space.md)*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:38

**Parameters:**

Name | Type |
------ | ------ |
`record` | [Space](../interfaces/space.md) |

**Returns:** *[Space](../interfaces/space.md)*

___

### `Protected` _updateWith

▸ **_updateWith**(`id`: string, `body`: any): *Promise‹void›*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:33

**Parameters:**

Name | Type |
------ | ------ |
`id` | string |
`body` | any |

**Returns:** *Promise‹void›*

___

###  addViewsToSpace

▸ **addViewsToSpace**(`spaceId`: string, `views`: string[] | string): *Promise‹void›*

*Defined in [models/spaces.ts:20](https://github.com/terascope/teraslice/blob/d2d877b60/packages/data-access/src/models/spaces.ts#L20)*

Associate views to space

**Parameters:**

Name | Type |
------ | ------ |
`spaceId` | string |
`views` | string[] \| string |

**Returns:** *Promise‹void›*

___

###  count

▸ **count**(`q?`: undefined | string, `queryAccess?`: QueryAccess‹[Space](../interfaces/space.md)›): *Promise‹number›*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:20

**Parameters:**

Name | Type |
------ | ------ |
`q?` | undefined \| string |
`queryAccess?` | QueryAccess‹[Space](../interfaces/space.md)› |

**Returns:** *Promise‹number›*

___

###  countBy

▸ **countBy**(`fields`: AnyInput‹[Space](../interfaces/space.md)›, `joinBy?`: JoinBy, `arrayJoinBy?`: JoinBy): *Promise‹number›*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:21

**Parameters:**

Name | Type |
------ | ------ |
`fields` | AnyInput‹[Space](../interfaces/space.md)› |
`joinBy?` | JoinBy |
`arrayJoinBy?` | JoinBy |

**Returns:** *Promise‹number›*

___

###  create

▸ **create**(`record`: i.CreateRecordInput‹[Space](../interfaces/space.md)›): *Promise‹[Space](../interfaces/space.md)›*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:22

**Parameters:**

Name | Type |
------ | ------ |
`record` | i.CreateRecordInput‹[Space](../interfaces/space.md)› |

**Returns:** *Promise‹[Space](../interfaces/space.md)›*

___

###  deleteAll

▸ **deleteAll**(`ids`: string[]): *Promise‹void›*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:24

**Parameters:**

Name | Type |
------ | ------ |
`ids` | string[] |

**Returns:** *Promise‹void›*

___

###  deleteById

▸ **deleteById**(`id`: string): *Promise‹void›*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:23

**Parameters:**

Name | Type |
------ | ------ |
`id` | string |

**Returns:** *Promise‹void›*

___

###  exists

▸ **exists**(`id`: string[] | string): *Promise‹boolean›*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:25

**Parameters:**

Name | Type |
------ | ------ |
`id` | string[] \| string |

**Returns:** *Promise‹boolean›*

___

###  find

▸ **find**(`q?`: undefined | string, `options?`: i.FindOptions‹[Space](../interfaces/space.md)›, `queryAccess?`: QueryAccess‹[Space](../interfaces/space.md)›): *Promise‹[Space](../interfaces/space.md)[]›*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:31

**Parameters:**

Name | Type |
------ | ------ |
`q?` | undefined \| string |
`options?` | i.FindOptions‹[Space](../interfaces/space.md)› |
`queryAccess?` | QueryAccess‹[Space](../interfaces/space.md)› |

**Returns:** *Promise‹[Space](../interfaces/space.md)[]›*

___

###  findAll

▸ **findAll**(`input`: string[] | string | undefined, `options?`: i.FindOneOptions‹[Space](../interfaces/space.md)›, `queryAccess?`: QueryAccess‹[Space](../interfaces/space.md)›): *Promise‹[Space](../interfaces/space.md)[]›*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:30

**Parameters:**

Name | Type |
------ | ------ |
`input` | string[] \| string \| undefined |
`options?` | i.FindOneOptions‹[Space](../interfaces/space.md)› |
`queryAccess?` | QueryAccess‹[Space](../interfaces/space.md)› |

**Returns:** *Promise‹[Space](../interfaces/space.md)[]›*

___

###  findAndApply

▸ **findAndApply**(`updates`: Partial‹[Space](../interfaces/space.md)› | undefined, `options?`: i.FindOneOptions‹[Space](../interfaces/space.md)›, `queryAccess?`: QueryAccess‹[Space](../interfaces/space.md)›): *Promise‹Partial‹[Space](../interfaces/space.md)››*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:29

**Parameters:**

Name | Type |
------ | ------ |
`updates` | Partial‹[Space](../interfaces/space.md)› \| undefined |
`options?` | i.FindOneOptions‹[Space](../interfaces/space.md)› |
`queryAccess?` | QueryAccess‹[Space](../interfaces/space.md)› |

**Returns:** *Promise‹Partial‹[Space](../interfaces/space.md)››*

___

###  findBy

▸ **findBy**(`fields`: AnyInput‹[Space](../interfaces/space.md)›, `joinBy?`: JoinBy, `options?`: i.FindOneOptions‹[Space](../interfaces/space.md)›, `queryAccess?`: QueryAccess‹[Space](../interfaces/space.md)›): *Promise‹[Space](../interfaces/space.md)›*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:26

**Parameters:**

Name | Type |
------ | ------ |
`fields` | AnyInput‹[Space](../interfaces/space.md)› |
`joinBy?` | JoinBy |
`options?` | i.FindOneOptions‹[Space](../interfaces/space.md)› |
`queryAccess?` | QueryAccess‹[Space](../interfaces/space.md)› |

**Returns:** *Promise‹[Space](../interfaces/space.md)›*

___

###  findByAnyId

▸ **findByAnyId**(`anyId`: any, `options?`: i.FindOneOptions‹[Space](../interfaces/space.md)›, `queryAccess?`: QueryAccess‹[Space](../interfaces/space.md)›): *Promise‹[Space](../interfaces/space.md)›*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:28

**Parameters:**

Name | Type |
------ | ------ |
`anyId` | any |
`options?` | i.FindOneOptions‹[Space](../interfaces/space.md)› |
`queryAccess?` | QueryAccess‹[Space](../interfaces/space.md)› |

**Returns:** *Promise‹[Space](../interfaces/space.md)›*

___

###  findById

▸ **findById**(`id`: string, `options?`: i.FindOneOptions‹[Space](../interfaces/space.md)›, `queryAccess?`: QueryAccess‹[Space](../interfaces/space.md)›): *Promise‹[Space](../interfaces/space.md)›*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:27

**Parameters:**

Name | Type |
------ | ------ |
`id` | string |
`options?` | i.FindOneOptions‹[Space](../interfaces/space.md)› |
`queryAccess?` | QueryAccess‹[Space](../interfaces/space.md)› |

**Returns:** *Promise‹[Space](../interfaces/space.md)›*

___

###  initialize

▸ **initialize**(): *Promise‹void›*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:18

**Returns:** *Promise‹void›*

___

###  removeViewFromSpaces

▸ **removeViewFromSpaces**(`viewId`: string): *Promise‹void›*

*Defined in [models/spaces.ts:41](https://github.com/terascope/teraslice/blob/d2d877b60/packages/data-access/src/models/spaces.ts#L41)*

**Parameters:**

Name | Type |
------ | ------ |
`viewId` | string |

**Returns:** *Promise‹void›*

___

###  removeViewsFromSpace

▸ **removeViewsFromSpace**(`spaceId`: string, `views`: string[] | string): *Promise‹void›*

*Defined in [models/spaces.ts:31](https://github.com/terascope/teraslice/blob/d2d877b60/packages/data-access/src/models/spaces.ts#L31)*

Disassociate views to space

**Parameters:**

Name | Type |
------ | ------ |
`spaceId` | string |
`views` | string[] \| string |

**Returns:** *Promise‹void›*

___

###  shutdown

▸ **shutdown**(): *Promise‹void›*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:19

**Returns:** *Promise‹void›*

___

###  update

▸ **update**(`record`: i.UpdateRecordInput‹[Space](../interfaces/space.md)›): *Promise‹void›*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:32

**Parameters:**

Name | Type |
------ | ------ |
`record` | i.UpdateRecordInput‹[Space](../interfaces/space.md)› |

**Returns:** *Promise‹void›*
